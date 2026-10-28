import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing } from '../theme/tokens';
import { AppIcon } from './AppIcon';
import { useAuthStore } from '../services/authStore';
import { useTaskStore } from '../services/taskStore';
import {
  requestDeviceLocation,
  searchLocationAddresses,
  geocodeCustomAddress,
  LocationSearchResult,
} from '../services/locationService';

interface ManualLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation?: (coords: [number, number], address: string) => void;
}

const POPULAR_HUBS = [
  { name: 'Koramangala, 4th Block, Bengaluru', coords: [77.6271, 12.9352] as [number, number] },
  { name: 'Indiranagar, 100ft Road, Bengaluru', coords: [77.6412, 12.9719] as [number, number] },
  { name: 'HSR Layout, Sector 1, Bengaluru', coords: [77.6433, 12.9121] as [number, number] },
  { name: 'MG Road / Brigade Road, Bengaluru', coords: [77.6074, 12.9756] as [number, number] },
  { name: 'Whitefield, ITPL Main Road, Bengaluru', coords: [77.7499, 12.9850] as [number, number] },
  { name: 'Jayanagar, 4th Block, Bengaluru', coords: [77.5833, 12.9250] as [number, number] },
  { name: 'Connaught Place, New Delhi', coords: [77.2167, 28.6315] as [number, number] },
  { name: 'Bandra West, Mumbai', coords: [72.8333, 19.0596] as [number, number] },
  { name: 'Hitec City, Madhapur, Hyderabad', coords: [78.3768, 17.4474] as [number, number] },
  { name: 'T Nagar / Anna Nagar, Chennai', coords: [80.2337, 13.0418] as [number, number] },
];

export const ManualLocationModal: React.FC<ManualLocationModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
}) => {
  const { user, updateLocation } = useAuthStore();
  const { fetchNearbyTasks } = useTaskStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [visible]);

  // Debounced search on typing
  const handleQueryChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim() || text.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocationAddresses(text);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
  };

  const handleSelectLocation = async (coords: [number, number], address: string) => {
    await updateLocation(coords, address);
    fetchNearbyTasks(coords);
    if (onSelectLocation) {
      onSelectLocation(coords, address);
    }
    onClose();
  };

  const handleApplyCustomTyped = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Address Required', 'Please enter a location, area, or street name.');
      return;
    }

    setIsSearching(true);
    const { coords, formattedAddress } = await geocodeCustomAddress(searchQuery.trim());
    setIsSearching(false);
    await handleSelectLocation(coords, formattedAddress);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <AppIcon name="map-pin" width={18} height={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.title}>Select Task Location</Text>
                <Text style={styles.subtitle}>Search any locality or choose an address</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Live GPS Button */}
            <TouchableOpacity
              style={styles.gpsModalBtn}
              onPress={async () => {
                setIsGpsLoading(true);
                const res = await requestDeviceLocation();
                setIsGpsLoading(false);
                if (res.success && res.coords && res.address) {
                  if (onSelectLocation) {
                    onSelectLocation(res.coords, res.address);
                  }
                  onClose();
                } else {
                  Alert.alert('GPS Notice', res.error || 'Failed to get GPS location');
                }
              }}
              disabled={isGpsLoading}
            >
              <Text style={styles.gpsModalIcon}>🎯</Text>
              <View style={styles.gpsModalTextWrap}>
                <Text style={styles.gpsModalTitle}>Use My Current GPS Location</Text>
                <Text style={styles.gpsModalSubtitle}>
                  {isGpsLoading ? 'Fetching accurate GPS fix...' : 'Pinpoint live coordinates from device GPS'}
                </Text>
              </View>
              {isGpsLoading ? (
                <ActivityIndicator color={colors.brandPrimary} size="small" />
              ) : (
                <AppIcon name="arrowRight" width={16} height={16} color={colors.brandPrimary} />
              )}
            </TouchableOpacity>

            {/* Search Input Field */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionLabel}>Search City, Street, or Landmark</Text>
              <View style={styles.searchBar}>
                <AppIcon name="search" width={16} height={16} color={colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g. BTM 2nd Stage, Koramangala, Bandra..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={handleQueryChange}
                  returnKeyType="search"
                  onSubmitEditing={handleApplyCustomTyped}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={styles.clearSearchBtn}
                  >
                    <Text style={styles.clearSearchText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Apply Direct Button */}
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.applyDirectBtn}
                  onPress={handleApplyCustomTyped}
                  disabled={isSearching}
                >
                  <Text style={styles.applyDirectBtnText}>
                    📍 Set "{searchQuery.trim()}" as Task Location
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search Autocomplete Suggestions */}
            {isSearching && (
              <View style={styles.searchingRow}>
                <ActivityIndicator color={colors.brandPrimary} size="small" />
                <Text style={styles.searchingText}>Searching locations across India...</Text>
              </View>
            )}

            {searchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                <Text style={styles.sectionLabel}>Matching Locations</Text>
                {searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.resultItem}
                    onPress={() => handleSelectLocation(item.coords, item.fullAddress)}
                  >
                    <View style={styles.resultIconCircle}>
                      <AppIcon name="map-pin" width={14} height={14} color={colors.brandPrimary} />
                    </View>
                    <View style={styles.resultTextWrap}>
                      <Text style={styles.resultTitle}>{item.title}</Text>
                      <Text style={styles.resultSubtitle} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Popular Preset Hubs */}
            <View style={styles.presetSection}>
              <Text style={styles.sectionLabel}>Popular City Hubs</Text>
              {POPULAR_HUBS.map((hub, idx) => {
                const isSelected = user?.location?.address?.includes(hub.name.split(',')[0]);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.hubItem, isSelected && styles.hubItemSelected]}
                    onPress={() => handleSelectLocation(hub.coords, hub.name)}
                  >
                    <View style={[styles.hubIconBox, isSelected && styles.hubIconBoxSelected]}>
                      <AppIcon
                        name="map-pin"
                        width={14}
                        height={14}
                        color={isSelected ? '#fff' : colors.brandPrimary}
                      />
                    </View>
                    <Text style={[styles.hubText, isSelected && styles.hubTextSelected]} numberOfLines={1}>
                      {hub.name}
                    </Text>
                    {isSelected ? (
                      <Text style={styles.activeTag}>✓ Current</Text>
                    ) : (
                      <Text style={styles.selectTag}>Select</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  scrollBody: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  gpsModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: spacing.sm,
  },
  gpsModalIcon: {
    fontSize: 22,
  },
  gpsModalTextWrap: {
    flex: 1,
  },
  gpsModalTitle: {
    color: '#10b981',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  gpsModalSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  searchSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 2,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.xs,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: colors.textTertiary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  applyDirectBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  applyDirectBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchingText: {
    color: colors.brandPrimary,
    fontSize: fontSizes.xs,
  },
  resultsContainer: {
    marginBottom: spacing.lg,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  resultIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextWrap: {
    flex: 1,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  resultSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  presetSection: {
    marginTop: spacing.xs,
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  hubItemSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  hubIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubIconBoxSelected: {
    backgroundColor: colors.brandPrimary,
  },
  hubText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  hubTextSelected: {
    color: colors.brandPrimary,
    fontWeight: fontWeights.bold,
  },
  activeTag: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  selectTag: {
    color: colors.textTertiary,
    fontSize: 11,
  },
});
