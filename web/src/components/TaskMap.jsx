import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Flame, Radio, User, MapPin, Navigation, Search, Crosshair, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// Component to dynamically re-center map when center coordinates change
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Component to handle map clicks for manual pin dropping
function MapClickHandler({ isPicking, onPickLocation }) {
  useMapEvents({
    click: async (e) => {
      if (!isPicking) return;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.address) {
            const addr = data.address;
            const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village;
            const city = addr.city || addr.town || addr.state_district || addr.state;
            if (locality && city) address = `${locality}, ${city}`;
            else if (data.display_name) address = data.display_name.split(',').slice(0, 3).join(',').trim();
          }
        }
      } catch (err) {}
      onPickLocation([lng, lat], address);
    },
  });
  return null;
}

const quickCities = [
  { name: 'Bengaluru', coords: [77.5946, 12.9716] },
  { name: 'Chennai', coords: [80.2707, 13.0827] },
  { name: 'Mumbai', coords: [72.8777, 19.0760] },
  { name: 'Delhi', coords: [77.1025, 28.7041] },
  { name: 'Hyderabad', coords: [78.4867, 17.3850] },
];

export default function TaskMap({
  tasks = [],
  helpers = [],
  userLocation,
  searchRadius = 10000,
  onSelectTask,
  selectedTaskId,
  centerCoordinates,
  zoom = 13,
  onLocationChange,
}) {
  const { setLocation, fetchBrowserLocation, setManualLocation } = useAuthStore();
  const [manualQuery, setManualQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);

  // Center is [lat, lng] for Leaflet
  const defaultCenter = useMemo(() => {
    if (centerCoordinates && centerCoordinates.length === 2) {
      return [centerCoordinates[1], centerCoordinates[0]];
    }
    if (userLocation?.coordinates && userLocation.coordinates.length === 2) {
      return [userLocation.coordinates[1], userLocation.coordinates[0]];
    }
    return [12.9716, 77.5946]; // Bengaluru default
  }, [centerCoordinates, userLocation]);

  const handleManualSearch = async (e) => {
    if (e) e.preventDefault();
    if (!manualQuery.trim()) return;
    setIsSearching(true);
    const res = await setManualLocation(manualQuery.trim());
    setIsSearching(false);
    if (res.success) {
      setManualQuery('');
      setShowLocationDrawer(false);
      if (onLocationChange) onLocationChange(res.coordinates, res.address);
    } else {
      alert('Location not found. Please try entering a specific area or city name.');
    }
  };

  const handleGPSReset = async () => {
    setIsLocatingGPS(true);
    try {
      const res = await fetchBrowserLocation();
      if (onLocationChange) onLocationChange(res.coordinates, res.address);
    } catch (err) {
      alert('Could not access device GPS. Please ensure location permission is allowed.');
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const handlePickLocation = (coords, addr) => {
    setLocation(coords, addr);
    setIsPickingLocation(false);
    if (onLocationChange) onLocationChange(coords, addr);
  };

  const handleQuickCity = (city) => {
    setLocation(city.coords, `${city.name}, India`);
    setShowLocationDrawer(false);
    if (onLocationChange) onLocationChange(city.coords, `${city.name}, India`);
  };

  // Create custom marker icons
  const createCustomIcon = (type, isUrgent, isBroadcasted, isSelected) => {
    let pinClass = 'custom-pin';
    if (isUrgent) pinClass += ' urgent';
    else if (isBroadcasted) pinClass += ' broadcasted';
    if (type === 'user') pinClass += ' user-location';

    const html = `
      <div class="${pinClass}">
        ${(isUrgent || isBroadcasted || isSelected) ? '<div class="pulse-ring"></div>' : ''}
        <div class="pin-body">
          ${type === 'user' ? '📍' : isUrgent ? '🔥' : isBroadcasted ? '📡' : '₹'}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-pin',
      html: html,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  const helperIcon = L.divIcon({
    className: 'custom-helper-pin',
    html: `
      <div class="custom-pin">
        <div class="pin-body" style="background: #10b981; width: 28px; height: 28px; font-size: 12px;">
          👷
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Floating Interactive Location & Manual Control Header */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl glass-card border border-slate-700/80 shadow-2xl backdrop-blur-md">
          {/* Current Location Badge */}
          <button
            onClick={() => setShowLocationDrawer(!showLocationDrawer)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-brand-500 text-left transition-all text-xs max-w-[200px] sm:max-w-[280px]"
            title="Click to search or manually enter location"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0 animate-bounce" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-semibold">Active Location</span>
              <span className="text-xs font-bold text-white truncate block">
                {userLocation?.address || 'Set Location'}
              </span>
            </div>
          </button>

          {/* Action Buttons: Search, Pin, GPS */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsPickingLocation(!isPickingLocation)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isPickingLocation
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg animate-pulse'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Click anywhere on the map to set location pin"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isPickingLocation ? 'Click Map...' : 'Pick on Map'}
              </span>
            </button>

            <button
              onClick={handleGPSReset}
              disabled={isLocatingGPS}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border bg-slate-900/90 border-slate-700 text-slate-300 hover:text-brand-400 hover:border-brand-500 transition-all"
              title="Detect and center to device GPS"
            >
              {isLocatingGPS ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-brand-400" />
              )}
              <span className="hidden md:inline">Live GPS</span>
            </button>

            <button
              onClick={() => setShowLocationDrawer(!showLocationDrawer)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/30"
            >
              Enter Manually
            </button>
          </div>
        </div>

        {/* Expandable Manual Search & Quick Cities Drawer */}
        {showLocationDrawer && (
          <div className="p-3.5 rounded-2xl glass-card border border-brand-500/40 shadow-2xl bg-slate-950/95 animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleManualSearch} className="flex items-center gap-2 mb-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type any area, street, landmark, or city (e.g. Anna Nagar, Chennai)..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Set</span>}
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Jump:</span>
              {quickCities.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleQuickCity(city)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-brand-600/30 hover:border-brand-500 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors"
                >
                  📍 {city.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {isPickingLocation && (
          <div className="p-2 rounded-xl bg-amber-500/90 text-slate-950 text-xs font-black text-center shadow-lg animate-pulse">
            👆 Click anywhere on the map to set your location pin!
          </div>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className={`w-full h-full z-10 ${isPickingLocation ? 'cursor-crosshair' : ''}`}
      >
        <ChangeView center={defaultCenter} zoom={zoom} />
        <MapClickHandler isPicking={isPickingLocation} onPickLocation={handlePickLocation} />

        {/* OpenStreetMap 100% Free Open-Source Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* User Search Radius Circle */}
        {userLocation?.coordinates && (
          <Circle
            center={[userLocation.coordinates[1], userLocation.coordinates[0]]}
            radius={searchRadius}
            pathOptions={{
              color: '#6366f1',
              fillColor: '#6366f1',
              fillOpacity: 0.07,
              weight: 1.5,
              dashArray: '4, 8',
            }}
          />
        )}

        {/* User Location Marker */}
        {userLocation?.coordinates && (
          <Marker
            position={[userLocation.coordinates[1], userLocation.coordinates[0]]}
            icon={createCustomIcon('user', false, false, false)}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-sm text-emerald-400">Selected Location</p>
                <p className="text-xs text-slate-300 mt-1">{userLocation.address || 'Active Map Center'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Coordinates: {userLocation.coordinates[1].toFixed(4)}, {userLocation.coordinates[0].toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Active Helpers (Radar mode) */}
        {helpers.map((helper) => {
          if (!helper.location?.coordinates || helper.location.coordinates.length < 2) return null;
          return (
            <Marker
              key={helper._id}
              position={[helper.location.coordinates[1], helper.location.coordinates[0]]}
              icon={helperIcon}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-xs text-emerald-400">Helper: {helper.name}</p>
                  <p className="text-[11px] text-slate-300">Rating: ⭐ {helper.stats?.avgRatingAsHelper || '5.0'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{helper.isOnline ? '🟢 Online now' : '⚪ Offline'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Tasks Markers */}
        {tasks.map((task) => {
          if (!task.location?.coordinates || task.location.coordinates.length < 2) return null;
          const isSelected = selectedTaskId === task._id;
          const pos = [task.location.coordinates[1], task.location.coordinates[0]];

          return (
            <Marker
              key={task._id}
              position={pos}
              icon={createCustomIcon(
                'task',
                task.isUrgent,
                task.status === 'broadcasted',
                isSelected
              )}
              eventHandlers={{
                click: () => onSelectTask && onSelectTask(task),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[220px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-brand-400 px-1.5 py-0.5 rounded bg-brand-950 border border-brand-800">
                      {task.category}
                    </span>
                    <span className="text-sm font-black text-emerald-400">
                      ₹{task.budget?.amount}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white line-clamp-1 mb-1">{task.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-2">{task.description}</p>
                  <p className="text-[11px] text-slate-400 flex items-center mb-3">
                    <MapPin className="w-3 h-3 text-brand-400 mr-1 shrink-0" />
                    <span className="truncate">{task.location?.address}</span>
                  </p>

                  <Link
                    to={`/task/${task._id}`}
                    className="block w-full py-1.5 text-center text-xs font-bold rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                  >
                    View Task Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
