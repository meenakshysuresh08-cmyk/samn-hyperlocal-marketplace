import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Linking,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { colors, fontSizes, fontWeights, spacing } from '../theme/tokens';
import { AppIcon } from './AppIcon';
import { getMobileSocket } from '../services/socket';
import { calculateDistanceKm } from '../services/locationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WebViewComponent: any = WebView;

interface TaskLiveTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  taskAddress: string;
  taskCoords: [number, number]; // [lng, lat]
  helper?: {
    _id: string;
    name: string;
    phone?: string;
    avatar?: string;
    stats?: { avgRatingAsHelper?: number };
    isVerified?: boolean;
  } | null;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
    avatar?: string;
    stats?: { avgRatingAsCustomer?: number };
    isVerified?: boolean;
  } | null;
  recipient?: {
    name?: string;
    phone?: string;
    landmark?: string;
    notes?: string;
  };
  isHelperView?: boolean;
  taskStatus: string;
  onOpenChat?: () => void;
}

export const TaskLiveTrackingModal: React.FC<TaskLiveTrackingModalProps> = ({
  visible,
  onClose,
  taskId,
  taskTitle,
  taskAddress,
  taskCoords,
  helper,
  customer,
  recipient,
  isHelperView = false,
  taskStatus,
  onOpenChat,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Helper starting coordinates: slight offset from task if not yet received
  const initialHelperLng = taskCoords[0] + 0.008;
  const initialHelperLat = taskCoords[1] + 0.006;

  const [helperCoords, setHelperCoords] = useState<[number, number]>([
    initialHelperLng,
    initialHelperLat,
  ]);
  const [distanceKm, setDistanceKm] = useState<number>(
    calculateDistanceKm([initialHelperLng, initialHelperLat], taskCoords)
  );
  const [etaMinutes, setEtaMinutes] = useState<number>(4);
  const [isLiveActive, setIsLiveActive] = useState(true);

  // Helper GPS Streamer: when viewed by Helper, constantly stream real GPS coordinates
  useEffect(() => {
    if (!visible || !taskId) return;

    const socket = getMobileSocket();
    if (!socket) return;

    socket.emit('join_task_room', taskId);

    let locationSubscription: any = null;
    let intervalId: any = null;

    if (isHelperView) {
      // Fetch immediate current location
      const fetchAndBroadcastLocation = async () => {
        try {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const { latitude, longitude, heading, speed } = position.coords;
          setHelperCoords([longitude, latitude]);

          const dist = calculateDistanceKm([longitude, latitude], taskCoords);
          setDistanceKm(dist);
          const mins = Math.max(1, Math.round((dist / 25) * 60));
          setEtaMinutes(mins);

          // Broadcast to customer over socket
          socket.emit('send_helper_location', {
            taskId,
            coordinates: [longitude, latitude],
            heading: heading || 0,
            speed: speed || 0,
          });

          // Update local map marker
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'update_helper_coords',
                lat: latitude,
                lng: longitude,
                heading: heading || 0,
              })
            );
          }
        } catch (e) {}
      };

      fetchAndBroadcastLocation();
      intervalId = setInterval(fetchAndBroadcastLocation, 5000);
    } else {
      // Customer view: Listen for helper live GPS updates from socket
      const onHelperLiveLocation = (data: any) => {
        if (data && data.taskId === taskId && data.coordinates && Array.isArray(data.coordinates)) {
          const [lng, lat] = data.coordinates;
          setHelperCoords([lng, lat]);

          const dist = calculateDistanceKm([lng, lat], taskCoords);
          setDistanceKm(dist);

          const mins = Math.max(1, Math.round((dist / 25) * 60));
          setEtaMinutes(mins);

          // Send update to Leaflet webview to smoothly animate marker
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'update_helper_coords',
                lat,
                lng,
                heading: data.heading || 0,
              })
            );
          }
        }
      };

      socket.on('helper_live_location', onHelperLiveLocation);

      return () => {
        socket.off('helper_live_location', onHelperLiveLocation);
      };
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove();
    };
  }, [visible, taskId, isHelperView, taskCoords]);

  const handleCallParty = () => {
    const phone = isHelperView
      ? (recipient?.phone || customer?.phone)
      : helper?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleOpenGoogleMapsNavigation = () => {
    const [destLng, destLat] = taskCoords;
    const latLng = `${destLat},${destLng}`;
    const label = encodeURIComponent(taskTitle || 'Task Destination');
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const nativeUrl = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;

    if (nativeUrl) {
      Linking.canOpenURL(nativeUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(nativeUrl);
          } else {
            Linking.openURL(webUrl);
          }
        })
        .catch(() => {
          Linking.openURL(webUrl);
        });
    } else {
      Linking.openURL(webUrl);
    }
  };

  const handleRecenter = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'recenter' }));
    }
  };

  const helperAvatar =
    helper?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';
  const helperName = helper?.name || 'Assigned Helper';
  const helperRating = helper?.stats?.avgRatingAsHelper || '5.0';

  const formatDistanceDisplay = (km: number) => {
    if (km < 1.0) {
      return `${Math.round(km * 1000)} m away`;
    }
    return `${km.toFixed(1)} km away`;
  };

  const generateTrackingMapHTML = () => {
    const helperLng = helperCoords[0];
    const helperLat = helperCoords[1];
    const destLng = taskCoords[0];
    const destLat = taskCoords[1];

    const customerDisplayName = recipient?.name || customer?.name || 'Customer';
    const cleanCustomerName = customerDisplayName.replace(/'/g, "\\'");
    const cleanHelperName = helperName.replace(/'/g, "\\'");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body, html, #map { width: 100%; height: 100%; background: #0b1120; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
          
          /* Dark theme filter */
          .leaflet-tile-pane {
            filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
          }

          .marker-name-tag {
            background: rgba(15, 23, 42, 0.95);
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 9999px;
            white-space: nowrap;
            max-width: 116px;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 3px;
            text-align: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
          }
          .helper-tag {
            border: 1.5px solid #34d399;
          }
          .dest-tag {
            border: 1.5px solid #818cf8;
          }

          /* Helper Live Marker with Pulse */
          .helper-marker-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 120px;
          }

          .helper-pulse {
            position: absolute;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background: rgba(99, 102, 241, 0.4);
            animation: pulseRing 1.8s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
          }

          .helper-avatar-bubble {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #1e1b4b;
            border: 2.5px solid #6366f1;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.6);
            z-index: 2;
            font-size: 18px;
          }

          @keyframes pulseRing {
            0% { transform: scale(0.6); opacity: 0.9; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          /* Task Destination Marker */
          .dest-marker-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 120px;
          }

          .dest-marker-bubble {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #064e3b;
            border: 2.5px solid #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6);
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>

        <script>
          const map = L.map('map', {
            center: [${(helperLat + destLat) / 2}, ${(helperLng + destLng) / 2}],
            zoom: 15,
            zoomControl: false,
            attributionControl: false
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          // Helper Icon
          const helperIcon = L.divIcon({
            className: 'helper-marker',
            html: '<div class="helper-marker-wrapper"><div class="marker-name-tag helper-tag">🛵 ${cleanHelperName}</div><div class="helper-avatar-bubble">🛵</div></div>',
            iconSize: [120, 64],
            iconAnchor: [60, 44]
          });

          // Destination Icon
          const destIcon = L.divIcon({
            className: 'dest-marker',
            html: '<div class="dest-marker-wrapper"><div class="marker-name-tag dest-tag">👤 ${cleanCustomerName}</div><div class="dest-marker-bubble">📍</div></div>',
            iconSize: [120, 60],
            iconAnchor: [60, 42]
          });

          let helperMarker = L.marker([${helperLat}, ${helperLng}], { icon: helperIcon })
            .bindPopup('<b>🛵 ${cleanHelperName}</b><br><span style="color:#10b981">Assigned Helper</span>')
            .addTo(map);
          let destMarker = L.marker([${destLat}, ${destLng}], { icon: destIcon })
            .bindPopup('<b>👤 ${cleanCustomerName}</b><br><span style="color:#6366f1">Destination / Customer</span>')
            .addTo(map);

          // Connecting polyline route
          let routeLine = L.polyline([
            [${helperLat}, ${helperLng}],
            [${destLat}, ${destLng}]
          ], {
            color: '#6366f1',
            weight: 3.5,
            dashArray: '8, 8',
            opacity: 0.85
          }).addTo(map);

          // Fit bounds
          function fitBoth() {
            map.fitBounds([helperMarker.getLatLng(), destMarker.getLatLng()], { padding: [60, 60] });
          }
          fitBoth();

          // Listen for coordinates update
          function handleRNMessage(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'update_helper_coords') {
                const newLatLng = L.latLng(data.lat, data.lng);
                helperMarker.setLatLng(newLatLng);
                routeLine.setLatLngs([newLatLng, destMarker.getLatLng()]);
              } else if (data.type === 'recenter') {
                fitBoth();
              }
            } catch (e) {}
          }

          window.addEventListener('message', handleRNMessage);
          document.addEventListener('message', handleRNMessage);
        </script>
      </body>
      </html>
    `;
  };

  const targetPersonAvatar = isHelperView
    ? customer?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    : helper?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';

  const targetPersonName = isHelperView
    ? recipient?.name || customer?.name || 'Customer'
    : helper?.name || 'Assigned Helper';

  const targetPersonRating = isHelperView
    ? customer?.stats?.avgRatingAsCustomer || '5.0'
    : helper?.stats?.avgRatingAsHelper || '5.0';

  const targetPersonPhone = isHelperView
    ? recipient?.phone || customer?.phone
    : helper?.phone;

  const isTargetVerified = isHelperView
    ? customer?.isVerified
    : helper?.isVerified;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Navigation */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitleText}>
              {isHelperView ? 'Live Route & Navigation' : 'Live Helper Tracking'}
            </Text>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {isHelperView ? 'BROADCASTING GPS TO CUSTOMER' : 'LIVE GPS STREAM'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter}>
            <Text style={styles.recenterBtnText}>🎯 Recenter</Text>
          </TouchableOpacity>
        </View>

        {/* Live Map Area */}
        <View style={styles.mapArea}>
          <WebViewComponent
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generateTrackingMapHTML() }}
            style={styles.mapWebView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />

          {/* Floating ETA & Distance Banner */}
          <View style={styles.floatingEtaCard}>
            <View style={styles.etaLeft}>
              <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
              <Text style={styles.etaValue}>~{etaMinutes} Mins</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaRight}>
              <Text style={styles.etaLabel}>DISTANCE</Text>
              <Text style={styles.distValue}>{formatDistanceDisplay(distanceKm)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Details Card */}
        <View style={styles.bottomCard}>
          <View style={styles.helperHeaderRow}>
            <Image source={{ uri: targetPersonAvatar }} style={styles.helperAvatar} />
            <View style={styles.helperMetaCol}>
              <View style={styles.helperNameRow}>
                <Text style={styles.helperName}>{targetPersonName}</Text>
                {isTargetVerified && <Text style={styles.verifiedBadge}>✓</Text>}
              </View>
              <Text style={styles.helperRatingText}>
                ⭐ {targetPersonRating} • {isHelperView ? 'Task Customer' : 'Assigned Helper'}
              </Text>
            </View>
            <View style={[styles.statusBadge, isHelperView && styles.statusBadgeHelper]}>
              <Text style={styles.statusBadgeText}>
                {isHelperView
                  ? '⚡ Navigating'
                  : taskStatus === 'in_progress'
                  ? '⚡ Working'
                  : '🛵 On The Way'}
              </Text>
            </View>
          </View>

          {/* Destination Details */}
          <View style={styles.destBox}>
            <AppIcon name="map-pin" width={14} height={14} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.destTitle} numberOfLines={1}>
                {taskTitle}
              </Text>
              <Text style={styles.destAddress} numberOfLines={1}>
                {taskAddress}
              </Text>
              {recipient?.landmark ? (
                <Text style={styles.destLandmark} numberOfLines={1}>
                  📍 Landmark: {recipient.landmark}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Action Row: Call, Chat & Google Maps */}
          <View style={styles.actionButtonsRow}>
            {targetPersonPhone ? (
              <TouchableOpacity style={styles.callBtn} onPress={handleCallParty}>
                <AppIcon name="phone" width={16} height={16} color="#fff" />
                <Text style={styles.callBtnText}>
                  {isHelperView ? 'Call Customer' : 'Call Helper'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {onOpenChat ? (
              <TouchableOpacity style={styles.chatBtn} onPress={onOpenChat}>
                <AppIcon name="message-square" width={16} height={16} color={colors.brandPrimary} />
                <Text style={styles.chatBtnText}>
                  {isHelperView ? 'Chat with Customer' : 'Chat with Helper'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {isHelperView && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={handleOpenGoogleMapsNavigation}
              >
                <AppIcon name="navigation" width={16} height={16} color="#fff" />
                <Text style={styles.navBtnText}>Maps App</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCanvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitleText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  recenterBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  recenterBtnText: {
    color: colors.brandPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  mapWebView: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  floatingEtaCard: {
    position: 'absolute',
    top: 14,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  etaLeft: {
    flex: 1,
    alignItems: 'center',
  },
  etaDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderSubtle,
  },
  etaRight: {
    flex: 1,
    alignItems: 'center',
  },
  etaLabel: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  etaValue: {
    color: '#10b981',
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
    marginTop: 2,
  },
  distValue: {
    color: colors.brandPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
    marginTop: 2,
  },
  bottomCard: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  helperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  helperAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCanvas,
    marginRight: spacing.sm,
  },
  helperMetaCol: {
    flex: 1,
  },
  helperNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helperName: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  verifiedBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: 9,
    fontWeight: fontWeights.black,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  helperRatingText: {
    color: '#fbbf24',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  statusBadgeHelper: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeText: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  destBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  destTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  destAddress: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 1,
  },
  destLandmark: {
    color: '#f59e0b',
    fontSize: 10,
    marginTop: 2,
    fontWeight: fontWeights.semibold,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: spacing.xs,
  },
  callBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    gap: spacing.xs,
  },
  chatBtnText: {
    color: colors.brandPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: spacing.xs,
  },
  navBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
});
