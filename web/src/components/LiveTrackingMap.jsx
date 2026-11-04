import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Compass,
  Radio,
  Clock,
  CheckCircle2,
  Phone,
  Maximize2,
  RefreshCw,
  Play,
  Pause,
} from 'lucide-react';
import { getSocket } from '../services/socket';

// Helper component to auto-fit both markers in view
function FitBounds({ customerPos, helperPos }) {
  const map = useMap();
  useEffect(() => {
    if (customerPos && helperPos && map) {
      const bounds = L.latLngBounds([customerPos, helperPos]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [customerPos, helperPos, map]);
  return null;
}

// Calculate distance in kilometers
function calculateDistanceKm(c1, c2) {
  if (!c1 || !c2) return 0;
  const [lng1, lat1] = c1;
  const [lng2, lat2] = c2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export default function LiveTrackingMap({ task, currentUser, isCustomer, isAssignedHelper }) {
  const socket = getSocket();

  // Customer destination coordinates: [lng, lat]
  const customerCoords = useMemo(() => {
    if (task?.location?.coordinates && task.location.coordinates.length >= 2) {
      return task.location.coordinates;
    }
    return [77.5946, 12.9716];
  }, [task]);

  // Initial helper coordinates (fallback to helper's saved location or slight offset from customer)
  const [helperCoords, setHelperCoords] = useState(() => {
    if (task?.helperId?.location?.coordinates && task.helperId.location.coordinates[0] !== 0) {
      return task.helperId.location.coordinates;
    }
    // Default to ~1.2 km offset from customer destination for realistic initial tracking
    return [customerCoords[0] - 0.012, customerCoords[1] - 0.008];
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [isStreamingGPS, setIsStreamingGPS] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const simulationTimerRef = useRef(null);

  // Customer position for Leaflet: [lat, lng]
  const customerPos = useMemo(() => [customerCoords[1], customerCoords[0]], [customerCoords]);
  // Helper position for Leaflet: [lat, lng]
  const helperPos = useMemo(() => [helperCoords[1], helperCoords[0]], [helperCoords]);

  // Real-time distance and estimated travel time (assuming ~25km/h in city)
  const distanceKm = useMemo(
    () => calculateDistanceKm(helperCoords, customerCoords),
    [helperCoords, customerCoords]
  );
  const estimatedMins = useMemo(
    () => Math.max(1, Math.round((distanceKm / 25) * 60)),
    [distanceKm]
  );

  // 1. Join task-specific tracking room & listen for live location broadcast
  useEffect(() => {
    if (!socket || !task?._id) return;

    socket.emit('join_task_room', task._id);

    const handleHelperLocation = (data) => {
      if (data.taskId === task._id && data.coordinates && Array.isArray(data.coordinates)) {
        setHelperCoords(data.coordinates);
        setLastUpdated(new Date());
      }
    };

    socket.on('helper_live_location', handleHelperLocation);
    socket.on('helper_location_updated', (data) => {
      if (data.userId === task.helperId?._id && data.coordinates) {
        setHelperCoords(data.coordinates);
        setLastUpdated(new Date());
      }
    });

    return () => {
      socket.off('helper_live_location', handleHelperLocation);
      socket.emit('leave_task_room', task._id);
    };
  }, [socket, task?._id, task?.helperId?._id]);

  // 2. Real device GPS streaming for assigned helper
  useEffect(() => {
    if (!isStreamingGPS || !isAssignedHelper || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setHelperCoords(coords);
        setLastUpdated(new Date());

        if (socket) {
          socket.emit('send_helper_location', {
            taskId: task._id,
            coordinates: coords,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0,
          });
        }
      },
      (err) => console.warn('Live GPS watch error:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isStreamingGPS, isAssignedHelper, socket, task?._id]);

  // 3. Live Simulation tool (moves helper incrementally towards customer destination)
  useEffect(() => {
    if (!isSimulating) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      return;
    }

    simulationTimerRef.current = setInterval(() => {
      setHelperCoords((prev) => {
        const dLng = customerCoords[0] - prev[0];
        const dLat = customerCoords[1] - prev[1];

        // If very close to customer, stop
        if (Math.abs(dLng) < 0.0002 && Math.abs(dLat) < 0.0002) {
          setIsSimulating(false);
          return customerCoords;
        }

        // Move 8% closer per tick
        const nextLng = prev[0] + dLng * 0.08;
        const nextLat = prev[1] + dLat * 0.08;
        const nextCoords = [Number(nextLng.toFixed(6)), Number(nextLat.toFixed(6))];

        // Broadcast over socket so customer sees it in real time
        if (socket && task?._id) {
          socket.emit('send_helper_location', {
            taskId: task._id,
            coordinates: nextCoords,
            timestamp: new Date(),
          });
        }

        setLastUpdated(new Date());
        return nextCoords;
      });
    }, 2000);

    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [isSimulating, customerCoords, socket, task?._id]);

  // HTML escape helper for marker templates
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Derive resolved names for Customer/User and Helper
  const customerName = useMemo(() => {
    return (
      task.customerId?.name ||
      (isCustomer && currentUser?.name ? currentUser.name : null) ||
      task.recipientName ||
      'Customer'
    );
  }, [task.customerId?.name, isCustomer, currentUser?.name, task.recipientName]);

  const helperName = useMemo(() => {
    return (
      task.helperId?.name ||
      (isAssignedHelper && currentUser?.name ? currentUser.name : null) ||
      'Helper'
    );
  }, [task.helperId?.name, isAssignedHelper, currentUser?.name]);

  const customerAvatar = useMemo(() => {
    return (
      task.customerId?.avatar ||
      (isCustomer && currentUser?.avatar ? currentUser.avatar : null) ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop'
    );
  }, [task.customerId?.avatar, isCustomer, currentUser?.avatar]);

  const helperAvatar = useMemo(() => {
    return (
      task.helperId?.avatar ||
      (isAssignedHelper && currentUser?.avatar ? currentUser.avatar : null) ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop'
    );
  }, [task.helperId?.avatar, isAssignedHelper, currentUser?.avatar]);

  // Custom icons showing actual user and helper names directly on the map
  const customerIcon = useMemo(() => {
    const escapedName = escapeHtml(customerName);
    return L.divIcon({
      className: 'custom-customer-pin',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 130px; pointer-events: none;">
          <div style="background: rgba(15, 23, 42, 0.95); color: #ffffff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; border: 1.5px solid #818cf8; box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap; max-width: 125px; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; text-align: center;">
            👤 ${escapedName}
          </div>
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background: rgba(99, 102, 241, 0.35); border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 38px; height: 38px; border-radius: 9999px; background: #6366f1; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4); overflow: hidden;">
              <img src="${customerAvatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop'" />
            </div>
          </div>
          <div style="background: #4338ca; color: #e0e7ff; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 6px; border: 1px solid #818cf8; margin-top: -4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
            User / Customer
          </div>
        </div>
      `,
      iconSize: [130, 80],
      iconAnchor: [65, 52],
      popupAnchor: [0, -48],
    });
  }, [customerName, customerAvatar]);

  const helperIcon = useMemo(() => {
    const escapedName = escapeHtml(helperName);
    return L.divIcon({
      className: 'custom-helper-pin',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 130px; pointer-events: none;">
          <div style="background: rgba(15, 23, 42, 0.95); color: #ffffff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; border: 1.5px solid #34d399; box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap; max-width: 125px; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; text-align: center;">
            🛵 ${escapedName}
          </div>
          <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background: rgba(16, 185, 129, 0.45); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 40px; height: 40px; border-radius: 9999px; background: #10b981; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4); overflow: hidden;">
              <img src="${helperAvatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop'" />
            </div>
          </div>
          <div style="background: #047857; color: #d1fae5; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 6px; border: 1px solid #34d399; margin-top: -4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
            Assigned Helper
          </div>
        </div>
      `,
      iconSize: [130, 82],
      iconAnchor: [65, 54],
      popupAnchor: [0, -50],
    });
  }, [helperName, helperAvatar]);

  return (
    <div className="rounded-3xl glass border border-slate-800 shadow-2xl overflow-hidden mb-8">
      {/* Top Tracking HUD Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-brand-950/40 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Live Location Radar
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <h3 className="text-base font-black text-white">
              {task.status === 'in_progress'
                ? `${helperName} is completing task for ${customerName}`
                : `${helperName} is en route to ${customerName}`}
            </h3>
          </div>
        </div>

        {/* Distance & ETA Badges */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold block">Distance</span>
            <span className="text-sm font-black text-white">{distanceKm} km</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold block">Est. Time</span>
            <span className="text-sm font-black text-emerald-400">~{estimatedMins} mins</span>
          </div>

          {/* Helper Simulation / GPS Controls */}
          {isAssignedHelper && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setIsStreamingGPS(!isStreamingGPS)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border ${
                  isStreamingGPS
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Broadcast your device's live GPS coordinates to customer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isStreamingGPS ? 'GPS Active' : 'Stream GPS'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border ${
                  isSimulating
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Simulate vehicle moving towards customer destination"
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? 'Stop Demo' : 'Simulate Ride'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-950">
        <MapContainer
          center={customerPos}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full z-10"
        >
          <FitBounds customerPos={customerPos} helperPos={helperPos} />

          {/* Free OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Route Line connecting Helper and Customer */}
          <Polyline
            positions={[helperPos, customerPos]}
            pathOptions={{
              color: '#10b981',
              weight: 4,
              dashArray: '8, 12',
              opacity: 0.85,
            }}
          />

          {/* Customer Destination Marker */}
          <Marker position={customerPos} icon={customerIcon}>
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <p className="font-bold text-xs text-brand-400">User / Customer Destination</p>
                </div>
                <p className="text-sm font-black text-white">{customerName}</p>
                <p className="text-xs text-slate-300 mt-1">{task.location?.address}</p>
                {task.location?.landmark && (
                  <p className="text-[11px] text-amber-400 mt-0.5">Near: {task.location.landmark}</p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Delivery Person / Helper Marker */}
          <Marker position={helperPos} icon={helperIcon}>
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <p className="font-bold text-xs text-emerald-400">Assigned Helper</p>
                </div>
                <p className="text-sm font-black text-white">{helperName}</p>
                <p className="text-xs text-slate-300 mt-1">
                  ⭐ {task.helperId?.stats?.avgRatingAsHelper || '5.0'} Rating
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Tracking Overlay Footer */}
        <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto">
          <div className="p-3 sm:p-4 rounded-2xl glass-card border border-slate-700/80 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
            {/* Helper Info */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={helperAvatar}
                  alt={helperName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 text-xs">🛵</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Assigned Helper
                </span>
                <span className="text-sm font-bold text-white block">
                  {helperName}
                </span>
                <span className="text-[11px] text-slate-400">
                  ⭐ {task.helperId?.stats?.avgRatingAsHelper || '5.0'} Rating
                </span>
              </div>
            </div>

            {/* Customer / User Info */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={customerAvatar}
                  alt={customerName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 text-xs">📍</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                  {isCustomer ? 'Customer (You)' : 'Customer (User)'}
                </span>
                <span className="text-sm font-bold text-white block">
                  {customerName}
                </span>
                <span className="text-[11px] text-slate-400 max-w-[150px] truncate block">
                  {task.location?.address}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {(isCustomer ? task.helperId?.phone : task.customerId?.phone) && (
                <a
                  href={`tel:${isCustomer ? task.helperId?.phone : task.customerId?.phone}`}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call</span>
                </a>
              )}

              <div className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live On Radar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
