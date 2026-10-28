import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, fontSizes, fontWeights, spacing } from '../theme/tokens';
import { AppIcon } from './AppIcon';
import { TaskItem, useTaskStore } from '../services/taskStore';
import { useAuthStore } from '../services/authStore';
import { requestDeviceLocation } from '../services/locationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TaskRadarMapProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onChangeLocation: () => void;
}

export const TaskRadarMap: React.FC<TaskRadarMapProps> = ({
  tasks,
  onSelectTask,
  onChangeLocation,
}) => {
  const { user } = useAuthStore();
  const { searchRadius, setSearchRadius } = useTaskStore();
  const [selectedPin, setSelectedPin] = useState<TaskItem | null>(tasks[0] || null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const RADIUS_OPTIONS = [
    { label: '3 km', value: 3000 },
    { label: '5 km', value: 5000 },
    { label: '10 km', value: 10000 },
    { label: '25 km', value: 25000 },
  ];

  // User coordinates: fallback to Bangalore (12.9716, 77.5946)
  const userLat = user?.location?.coordinates?.[1] || 12.9716;
  const userLng = user?.location?.coordinates?.[0] || 77.5946;

  // Auto request location permission on first mount
  useEffect(() => {
    handleGetLiveLocation(false);
  }, []);

  const handleGetLiveLocation = async (showAlert = true) => {
    setIsLocating(true);
    const result = await requestDeviceLocation();
    setIsLocating(false);

    if (!result.success && showAlert) {
      Alert.alert(
        'Location Permission Needed',
        result.error || 'Please enable location permissions in your phone settings to use your live GPS location.',
        [{ text: 'OK' }]
      );
    }
  };

  // Synchronize selected pin when tasks list or radius changes
  useEffect(() => {
    if (tasks.length > 0) {
      if (!selectedPin || !tasks.some(t => t._id === selectedPin._id)) {
        setSelectedPin(tasks[0]);
      }
    } else {
      setSelectedPin(null);
    }
  }, [tasks, searchRadius]);

  // Prepare map HTML with OpenStreetMap public free tiles (Zero API key needed)
  const generateMapHTML = () => {
    const validTasks = tasks.filter(
      t => t.location?.coordinates && Array.isArray(t.location.coordinates) && t.location.coordinates.length >= 2
    );

    const tasksJSON = JSON.stringify(
      validTasks.map(t => ({
        id: t._id,
        title: t.title,
        lat: t.location.coordinates![1],
        lng: t.location.coordinates![0],
        amount: t.budget?.amount,
        category: t.category,
        isUrgent: t.isUrgent,
      }))
    );

    const zoomLevel = searchRadius <= 3000 ? 14 : searchRadius <= 5000 ? 13 : searchRadius <= 10000 ? 12 : 11;

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
          body, html, #map { width: 100%; height: 100%; background: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          
          /* Dark theme CSS filter for OpenStreetMap public tiles (No API key needed) */
          .leaflet-tile-pane {
            filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
          }

          /* Custom user marker pulse */
          .user-marker {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #10b981;
            border: 3px solid #ffffff;
            box-shadow: 0 0 14px #10b981;
            position: relative;
          }
          .user-marker::after {
            content: '';
            position: absolute;
            top: -8px; left: -8px; right: -8px; bottom: -8px;
            border-radius: 50%;
            border: 2px solid rgba(16, 185, 129, 0.6);
            animation: pulse 2s infinite ease-out;
          }
          @keyframes pulse {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(1.8); opacity: 0; }
          }

          /* Task Pin styling */
          .task-marker-pill {
            background: #1e1b4b;
            border: 2px solid #6366f1;
            border-radius: 20px;
            padding: 4px 8px;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .task-marker-pill.urgent {
            border-color: #ef4444;
            background: #450a0a;
          }
          .task-price {
            color: #10b981;
            font-weight: 800;
          }
          .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const userCenter = [${userLat}, ${userLng}];
          const map = L.map('map', {
            center: userCenter,
            zoom: ${zoomLevel},
            zoomControl: false
          });

          // Free OpenStreetMap Standard Public Tiles (Zero API Key needed)
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            crossOrigin: true
          }).addTo(map);

          // Radar Scan Radius Circle
          const radiusCircle = L.circle(userCenter, {
            radius: ${searchRadius},
            color: '#6366f1',
            weight: 1.5,
            fillColor: '#6366f1',
            fillOpacity: 0.12,
            dashArray: '4, 8'
          }).addTo(map);

          // User Marker
          const userIcon = L.divIcon({
            className: 'user-icon-wrap',
            html: '<div class="user-marker"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          L.marker(userCenter, { icon: userIcon }).addTo(map);

          // Render Task Markers
          const tasks = ${tasksJSON};
          const categoryEmojis = {
            care_taking: '🤝',
            hospital_accompany: '🏥',
            pet_care: '🐾',
            pet_grooming: '✂️',
            car_wash: '🚗',
            gardening: '🌱',
            grocery: '🛍️',
            delivery: '🚚',
            tech_help: '💻',
            cleaning: '✨',
            repair: '🔧',
            moving: '📦',
            other: '⚡'
          };

          tasks.forEach(t => {
            const emoji = categoryEmojis[t.category] || '📍';
            const html = '<div class="task-marker-pill ' + (t.isUrgent ? 'urgent' : '') + '">' +
              '<span>' + emoji + '</span>' +
              '<span class="task-price">₹' + t.amount + '</span>' +
            '</div>';

            const icon = L.divIcon({
              className: 'custom-task-icon',
              html: html,
              iconSize: [60, 26],
              iconAnchor: [30, 13]
            });

            const marker = L.marker([t.lat, t.lng], { icon: icon }).addTo(map);
            marker.on('click', () => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SELECT_TASK',
                  taskId: t.id
                }));
              }
            });
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_TASK') {
        const found = tasks.find(t => t._id === data.taskId);
        if (found) {
          setSelectedPin(found);
        }
      }
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      {/* Map Header Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.locationChip} onPress={onChangeLocation}>
          <AppIcon name="map-pin" width={14} height={14} color={colors.brandPrimary} />
          <Text style={styles.locationChipText} numberOfLines={1}>
            {user?.location?.address || 'Koramangala, Bengaluru'}
          </Text>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>

        {/* GPS Live Locate Button */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={() => handleGetLiveLocation(true)}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <>
              <Text style={styles.gpsIcon}>🎯</Text>
              <Text style={styles.gpsBtnText}>Live GPS</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.taskCountBadge}>
          <Text style={styles.taskCountText}>📡 {tasks.length} Pins</Text>
        </View>
      </View>

      {/* Real Interactive Map View Container */}
      <View style={styles.mapCardWrapper}>
        <WebView
          key={`radar-map-${searchRadius}-${tasks.length}-${userLng}-${userLat}`}
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: generateMapHTML() }}
          style={styles.webView}
          scrollEnabled={false}
          onLoadEnd={() => setIsMapLoading(false)}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {isMapLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color={colors.brandPrimary} />
            <Text style={styles.loaderText}>Loading OpenStreetMap tiles...</Text>
          </View>
        )}
      </View>

      {/* Radius Filter Pills */}
      <View style={styles.radiusContainer}>
        <Text style={styles.radiusTitle}>Scan Radius:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusScroll}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.radiusPill, searchRadius === r.value && styles.radiusPillActive]}
              onPress={() => setSearchRadius(r.value)}
            >
              <Text style={[styles.radiusText, searchRadius === r.value && styles.radiusTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Selected Task Bottom Highlight Card */}
      {selectedPin && (
        <View style={styles.previewCard}>
          <View style={styles.previewTop}>
            <View style={styles.previewCategory}>
              <Text style={styles.previewCategoryText}>{selectedPin.category?.toUpperCase()}</Text>
            </View>
            {selectedPin.isUrgent && (
              <View style={styles.previewUrgent}>
                <Text style={styles.previewUrgentText}>🔥 URGENT</Text>
              </View>
            )}
            <Text style={styles.previewPrice}>₹{selectedPin.budget?.amount}</Text>
          </View>

          <Text style={styles.previewTitle} numberOfLines={1}>
            {selectedPin.title}
          </Text>
          <Text style={styles.previewAddress} numberOfLines={1}>
            📍 {selectedPin.location?.address} {selectedPin.distanceKm ? `(${selectedPin.distanceKm} km away)` : ''}
          </Text>

          <TouchableOpacity
            style={styles.viewTaskBtn}
            onPress={() => onSelectTask(selectedPin)}
          >
            <Text style={styles.viewTaskBtnText}>View Task & Place Offer ➔</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: 6,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgCard,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    flex: 1,
  },
  locationChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  changeText: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  gpsIcon: {
    fontSize: 12,
  },
  gpsBtnText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  taskCountBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  taskCountText: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  mapCardWrapper: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    height: 280,
    backgroundColor: '#090d16',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginVertical: spacing.xs,
    alignSelf: 'center',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(11, 17, 32, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 6,
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  radiusTitle: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    marginRight: spacing.sm,
  },
  radiusScroll: {
    gap: spacing.xs,
  },
  radiusPill: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  radiusPillActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  radiusText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  radiusTextActive: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  previewCategory: {
    backgroundColor: colors.bgElevated,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  previewCategoryText: {
    color: colors.brandPrimary,
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  previewUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  previewUrgentText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  previewPrice: {
    color: '#10b981',
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
  },
  previewTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  previewAddress: {
    color: colors.textTertiary,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  viewTaskBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewTaskBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
});
