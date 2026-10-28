import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../services/authStore';
import { useTaskStore, TaskItem } from '../../services/taskStore';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';
import { AppIcon } from '../../components/AppIcon';
import { ManualLocationModal } from '../../components/ManualLocationModal';
import { TaskRadarMap } from '../../components/TaskRadarMap';

const categories = [
  { id: 'all', label: '🌟 All Tasks' },
  { id: 'care_taking', label: '🤝 Care Takers' },
  { id: 'hospital_accompany', label: '🏥 Hospital Escort' },
  { id: 'pet_care', label: '🐾 Pet Care' },
  { id: 'pet_grooming', label: '✂️ Pet Grooming' },
  { id: 'car_wash', label: '🚗 Car Wash' },
  { id: 'gardening', label: '🌱 Gardening' },
  { id: 'grocery', label: '🛍️ Grocery' },
  { id: 'delivery', label: '🚚 Delivery' },
  { id: 'tech_help', label: '💻 Tech Support' },
  { id: 'cleaning', label: '✨ Deep Cleaning' },
  { id: 'repair', label: '🔧 Home Repairs' },
  { id: 'moving', label: '📦 Moving' },
  { id: 'other', label: '⚡ General' },
];

export default function ExploreScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const isCustomer = user?.activeRole === 'customer';
  const {
    nearbyTasks,
    fetchNearbyTasks,
    selectedCategory,
    setSelectedCategory,
    searchRadius,
    setSearchRadius,
    isLoading,
    bindSocketListeners,
  } = useTaskStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    fetchNearbyTasks(user?.location?.coordinates);
    bindSocketListeners();
  }, [selectedCategory, searchRadius, user?.location?.coordinates]);

  const radiusKm = (searchRadius || 25000) / 1000;

  const filteredTasks = nearbyTasks.filter((task) => {
    // Exclude own tasks in Helper mode
    const custId = task.customerId?._id || task.customerId;
    if (user?._id && custId?.toString() === user._id.toString()) {
      return false;
    }

    // Strict distance filtering: immediately exclude tasks outside helper's radius
    if (task.distanceKm !== undefined && task.distanceKm !== null && task.distanceKm > radiusKm) {
      return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.location?.address?.toLowerCase().includes(q) ||
      task.category?.toLowerCase().includes(q)
    );
  });

  const renderTask = ({ item }: { item: TaskItem }) => (
    <TouchableOpacity
      style={[
        styles.card,
        item.isUrgent && styles.urgentCard,
        item.status === 'broadcasted' && styles.broadcastedCard,
      ]}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
    >
      <View style={styles.cardTop}>
        <View style={styles.catPill}>
          <Text style={styles.catText}>{item.category?.toUpperCase()}</Text>
        </View>

        {item.isUrgent && (
          <View style={styles.urgentPill}>
            <Text style={styles.urgentText}>🔥 URGENT</Text>
          </View>
        )}

        <Text style={styles.priceText}>₹{item.budget?.amount}</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {item.description}
      </Text>

      {item.location?.landmark ? (
        <View style={styles.landmarkPill}>
          <Text style={styles.landmarkPillText} numberOfLines={1}>
            🚩 {item.location.landmark}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardBottom}>
        <View style={styles.locRow}>
          <AppIcon name="map-pin" width={12} height={12} color={colors.brandPrimary} />
          <Text style={styles.locText} numberOfLines={1}>
            {item.location?.address}
          </Text>
        </View>
        <Text style={styles.distanceText}>
          {item.distanceKm != null ? `${item.distanceKm} km away` : 'Nearby'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Location Bar */}
      <View style={styles.topLocationBar}>
        <View style={styles.locationInfo}>
          <AppIcon name="map-pin" width={14} height={14} color={colors.brandPrimary} />
          <Text style={styles.currentLocText} numberOfLines={1}>
            {user?.location?.address || 'Koramangala, Bengaluru'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.changeLocBtn}
          onPress={() => setShowLocationModal(true)}
        >
          <Text style={styles.changeLocBtnText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar & View Toggle */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <AppIcon name="search" width={16} height={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nearby requests..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Map / List View Toggle */}
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>
              🗺️ Map
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>
              📋 List
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Filter Horizontal Scroll */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.categoryPill, selectedCategory === c.id && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(c.id)}
            >
              <Text style={[styles.categoryPillText, selectedCategory === c.id && styles.categoryPillTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content Area: Interactive Map vs List View */}
      {viewMode === 'map' ? (
        <ScrollView
          style={styles.mapScrollView}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => fetchNearbyTasks(user?.location?.coordinates)}
              tintColor={colors.brandPrimary}
            />
          }
        >
          <TaskRadarMap
            tasks={filteredTasks}
            onSelectTask={(task) => navigation.navigate('TaskDetail', { taskId: task._id })}
            onChangeLocation={() => setShowLocationModal(true)}
          />

          {/* Quick List Preview Under Map */}
          <View style={styles.nearbyListUnderMap}>
            <Text style={styles.sectionHeaderUnderMap}>
              Nearby Open Tasks ({filteredTasks.length})
            </Text>
            {filteredTasks.map((task) => (
              <View key={task._id}>
                {renderTask({ item: task })}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => fetchNearbyTasks(user?.location?.coordinates)}
              tintColor={colors.brandPrimary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyTitle}>No Tasks In This Area</Text>
              <Text style={styles.emptySub}>
                Expand your search radius or change your location to find more requests.
              </Text>
              <TouchableOpacity
                style={styles.expandRadiusBtn}
                onPress={() => setSearchRadius(25000)}
              >
                <Text style={styles.expandRadiusBtnText}>Expand Radar to 25km</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (Customer posts, Helper scans) */}
      {isCustomer ? (
        <TouchableOpacity
          style={styles.floatingPostBtn}
          onPress={() => navigation.navigate('PostTask')}
          activeOpacity={0.85}
        >
          <Text style={styles.floatingPostBtnText}>+ Post Task</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.floatingRadarBtn}
          onPress={() => fetchNearbyTasks(user?.location?.coordinates)}
          activeOpacity={0.85}
        >
          <Text style={styles.floatingRadarBtnText}>📡 Refresh Radar</Text>
        </TouchableOpacity>
      )}

      {/* Location Modal */}
      <ManualLocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  topLocationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: spacing.sm,
  },
  currentLocText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  changeLocBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  changeLocBtnText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.xs,
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
  },
  clearSearchText: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
    paddingHorizontal: 4,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  viewToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  viewToggleBtnActive: {
    backgroundColor: colors.brandPrimary,
  },
  viewToggleText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  viewToggleTextActive: {
    color: '#fff',
  },
  categoriesSection: {
    marginVertical: spacing.xs,
  },
  catScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  categoryPill: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  categoryPillActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  categoryPillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  categoryPillTextActive: {
    color: '#fff',
    fontWeight: fontWeights.bold,
  },
  mapScrollView: {
    flex: 1,
  },
  nearbyListUnderMap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    marginTop: spacing.sm,
  },
  sectionHeaderUnderMap: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  urgentCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  broadcastedCard: {
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  catPill: {
    backgroundColor: colors.bgElevated,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
  },
  catText: {
    color: colors.brandPrimary,
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  urgentPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  urgentText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  priceText: {
    color: '#10b981',
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  desc: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  landmarkPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  landmarkPillText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: fontWeights.semibold,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  locText: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  distanceText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xs,
  },
  emptySub: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  expandRadiusBtn: {
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  expandRadiusBtnText: {
    color: colors.brandPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  floatingPostBtn: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingPostBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  floatingRadarBtn: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#059669',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingRadarBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
});
