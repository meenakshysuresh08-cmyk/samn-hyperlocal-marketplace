import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { colors, fontSizes, fontWeights, spacing } from '../theme/tokens';
import { AppIcon } from './AppIcon';
import { useAuthStore } from '../services/authStore';
import {
  requestDeviceLocation,
  searchLocationAddresses,
  reverseGeocodeCoords,
  LocationSearchResult,
} from '../services/locationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InteractiveLocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialCoords?: [number, number]; // [lng, lat]
  initialAddress?: string;
  onConfirmLocation: (coords: [number, number], address: string, landmark?: string) => void;
}

export const InteractiveLocationPickerModal: React.FC<InteractiveLocationPickerModalProps> = ({
  visible,
  onClose,
  initialCoords,
  initialAddress,
  onConfirmLocation,
}) => {
  const { user } = useAuthStore();
  const webViewRef = useRef<WebView>(null);

  const defaultLng = initialCoords?.[0] || user?.location?.coordinates?.[0] || 77.5946;
  const defaultLat = initialCoords?.[1] || user?.location?.coordinates?.[1] || 12.9716;

  const [currentCoords, setCurrentCoords] = useState<[number, number]>([defaultLng, defaultLat]);
  const [resolvedAddress, setResolvedAddress] = useState<string>(initialAddress || 'Koramangala, Bengaluru');
  const [landmark, setLandmark] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const reverseTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      const lng = initialCoords?.[0] || user?.location?.coordinates?.[0] || 77.5946;
      const lat = initialCoords?.[1] || user?.location?.coordinates?.[1] || 12.9716;
      setCurrentCoords([lng, lat]);
      if (initialAddress) {
        setResolvedAddress(initialAddress);
      } else {
        fetchAddressForCoords(lng, lat);
      }
    }
  }, [visible, initialCoords, initialAddress]);

  const fetchAddressForCoords = async (lng: number, lat: number) => {
    setIsReverseGeocoding(true);
    const address = await reverseGeocodeCoords([lng, lat]);
    setResolvedAddress(address);
    setIsReverseGeocoding(false);
  };

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text.trim() || text.trim().length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocationAddresses(text);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);
  };

  const handleSelectSearchResult = (result: LocationSearchResult) => {
    const [lng, lat] = result.coords;
    setCurrentCoords([lng, lat]);
    setResolvedAddress(result.fullAddress);
    setShowSuggestions(false);
    setSearchQuery('');

    // Fly Leaflet map to chosen coordinates
    if (webViewRef.current) {
      const msg = JSON.stringify({ type: 'fly_to', lat, lng, zoom: 17 });
      webViewRef.current.postMessage(msg);
    }
  };

  const handleUseCurrentGPS = async () => {
    setIsGpsLoading(true);
    const result = await requestDeviceLocation();
    setIsGpsLoading(false);

    if (result.success && result.coords) {
      const [lng, lat] = result.coords;
      setCurrentCoords([lng, lat]);
      if (result.address) setResolvedAddress(result.address);

      if (webViewRef.current) {
        const msg = JSON.stringify({ type: 'fly_to', lat, lng, zoom: 17 });
        webViewRef.current.postMessage(msg);
      }
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'map_ready') {
        setIsMapReady(true);
      } else if (data.type === 'center_changed') {
        const lat = data.lat;
        const lng = data.lng;
        setCurrentCoords([lng, lat]);

        // Debounce reverse geocoding on map drag
        if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current);
        reverseTimeoutRef.current = setTimeout(() => {
          fetchAddressForCoords(lng, lat);
        }, 500);
      }
    } catch (e) {}
  };

  const handleConfirm = () => {
    onConfirmLocation(currentCoords, resolvedAddress, landmark.trim());
    onClose();
  };

  const generatePickerMapHTML = () => {
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
          body, html, #map { width: 100%; height: 100%; background: #0b1120; }
          
          /* Dark theme CSS filter for OpenStreetMap public tiles */
          .leaflet-tile-pane {
            filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
          }

          /* Fixed Center Pin Overlay */
          .center-pin-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .pin-head {
            width: 42px;
            height: 42px;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.6);
            border: 3px solid #ffffff;
            animation: bouncePin 1.5s ease-in-out infinite alternate;
          }

          .pin-icon {
            transform: rotate(45deg);
            font-size: 18px;
            color: #ffffff;
          }

          .pin-shadow {
            width: 14px;
            height: 6px;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 50%;
            margin-top: 4px;
          }

          @keyframes bouncePin {
            0% { transform: translateY(0px) rotate(-45deg); }
            100% { transform: translateY(-8px) rotate(-45deg); }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="center-pin-container">
          <div class="pin-head">
            <span class="pin-icon">📍</span>
          </div>
          <div class="pin-shadow"></div>
        </div>

        <script>
          const map = L.map('map', {
            center: [${defaultLat}, ${defaultLng}],
            zoom: 16,
            zoomControl: false,
            attributionControl: false
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          // Emit map center whenever moved
          map.on('moveend', function() {
            const center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'center_changed',
              lat: center.lat,
              lng: center.lng
            }));
          });

          // Listen for messages from React Native (e.g. fly to search result or GPS)
          function handleRNMessage(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'fly_to') {
                map.flyTo([data.lat, data.lng], data.zoom || 17, { duration: 1.2 });
              }
            } catch (e) {}
          }

          window.addEventListener('message', handleRNMessage);
          document.addEventListener('message', handleRNMessage);

          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_ready' }));
        </script>
      </body>
      </html>
    `;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Top Header & Search Bar */}
          <View style={styles.topHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose}>
              <Text style={styles.backBtnText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Choose Task Location</Text>
            <TouchableOpacity style={styles.gpsSmallBtn} onPress={handleUseCurrentGPS}>
              {isGpsLoading ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <Text style={styles.gpsSmallBtnText}>🎯 My GPS</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Autocomplete Search Bar */}
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <AppIcon name="search" width={16} height={16} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search area, landmark, or street name..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={handleQueryChange}
                autoCorrect={false}
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.brandPrimary} />
              ) : searchQuery ? (
                <TouchableOpacity onPress={() => handleQueryChange('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Suggestions Overlay Dropdown */}
            {showSuggestions && searchResults.length > 0 && (
              <View style={styles.suggestionsDropdown}>
                {searchResults.map((res, idx) => (
                  <TouchableOpacity
                    key={`${res.title}-${idx}`}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSearchResult(res)}
                  >
                    <AppIcon name="map-pin" width={14} height={14} color={colors.brandPrimary} />
                    <View style={styles.suggestionTextCol}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>
                        {res.title}
                      </Text>
                      <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                        {res.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Map View Area */}
          <View style={styles.mapWrapper}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: generatePickerMapHTML() }}
              style={styles.mapWebView}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />

            {/* Drag Pin Hint Badge */}
            <View style={styles.dragHintBadge}>
              <Text style={styles.dragHintText}>🖐️ Pan map to fine-tune exact pin location</Text>
            </View>
          </View>

          {/* Bottom Confirmation Card */}
          <View style={styles.bottomCard}>
            <View style={styles.addressMetaRow}>
              <AppIcon name="map-pin" width={18} height={18} color={colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedAddressLabel}>Selected Task Location</Text>
                {isReverseGeocoding ? (
                  <ActivityIndicator size="small" color={colors.brandPrimary} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={styles.selectedAddressText} numberOfLines={2}>
                    {resolvedAddress}
                  </Text>
                )}
              </View>
              <View style={styles.coordsPill}>
                <Text style={styles.coordsPillText}>
                  {currentCoords[1].toFixed(3)}°, {currentCoords[0].toFixed(3)}°
                </Text>
              </View>
            </View>

            {/* Optional Landmark / Floor Input */}
            <TextInput
              style={styles.landmarkInput}
              placeholder="Optional landmark, flat, or floor (e.g. Near HDFC Bank, 2nd Floor)"
              placeholderTextColor={colors.textTertiary}
              value={landmark}
              onChangeText={setLandmark}
            />

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm Task Location 📍</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  keyboardContainer: {
    flex: 1,
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
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  gpsSmallBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  gpsSmallBtnText: {
    color: '#10b981',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  searchBarWrapper: {
    position: 'relative',
    zIndex: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgCanvas,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    marginLeft: spacing.xs,
  },
  clearSearch: {
    color: colors.textTertiary,
    fontSize: 14,
    paddingHorizontal: 6,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  suggestionTextCol: {
    flex: 1,
  },
  suggestionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  suggestionSubtitle: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  mapWebView: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  dragHintBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    zIndex: 10,
  },
  dragHintText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  bottomCard: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addressMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedAddressLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
  },
  selectedAddressText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginTop: 2,
  },
  coordsPill: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  coordsPillText: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  landmarkInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  confirmBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
});
