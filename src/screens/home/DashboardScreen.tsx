import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../services/authStore';
import { useTaskStore, TaskItem } from '../../services/taskStore';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../../components/AppIcon';
import { ManualLocationModal } from '../../components/ManualLocationModal';

type HistoryFilterTab = 'active' | 'completed' | 'all' | 'cancelled';

export default function DashboardScreen({ navigation }: any) {
  const { user, switchRole } = useAuthStore();
  const {
    nearbyTasks,
    myTasks,
    fetchNearbyTasks,
    fetchMyTasks,
    deleteTask,
    searchRadius,
    isLoading,
    bindSocketListeners,
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState<HistoryFilterTab>('active');
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    fetchNearbyTasks(user?.location?.coordinates);
    fetchMyTasks(user?.activeRole || 'customer');
    bindSocketListeners();
  }, [user?.activeRole, user?.location?.coordinates, searchRadius]);

  const isCustomer = user?.activeRole === 'customer';

  const onRefresh = () => {
    fetchNearbyTasks(user?.location?.coordinates);
    fetchMyTasks(user?.activeRole || 'customer');
  };

  const handleToggleRole = () => {
    const nextRole = isCustomer ? 'helper' : 'customer';
    switchRole(nextRole);
  };

  // Filter tasks according to active tab
  const activeTasks = myTasks.filter(t => ['open', 'broadcasted', 'assigned', 'in_progress'].includes(t.status));
  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const cancelledTasks = myTasks.filter(t => t.status === 'cancelled');

  const filteredTasks = (() => {
    switch (activeTab) {
      case 'active':
        return activeTasks;
      case 'completed':
        return completedTasks;
      case 'cancelled':
        return cancelledTasks;
      case 'all':
      default:
        return myTasks;
    }
  })();

  // Tasks with pending offers (Customer mode)
  const tasksWithPendingOffers = myTasks.filter(
    t => ['open', 'broadcasted'].includes(t.status) && t.bids && t.bids.length > 0
  );

  // Helper mode: helper's submitted bids
  const helperActiveBidsCount = myTasks.filter(t =>
    t.bids?.some((b: any) => {
      const bHelperId = b.helperId?._id || b.helperId;
      return bHelperId && user?._id && bHelperId.toString() === user._id.toString();
    })
  ).length;

  const radiusKm = (searchRadius || 25000) / 1000;

  // Clean radar tasks for helper strictly bounded within active radius
  const cleanNearbyTasks = nearbyTasks.filter((task) => {
    if (isCustomer) return true;
    const custId = task.customerId?._id || task.customerId;
    if (user?._id && custId?.toString() === user._id.toString()) return false;
    if (task.distanceKm !== undefined && task.distanceKm !== null && task.distanceKm > radiusKm) {
      return false;
    }
    return true;
  });

  const handleDeleteTaskCard = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete Task? 🗑️',
      `Permanently delete "${taskTitle}"? This will remove the task, all helper proposals, and history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteTask(taskId);
            if (res.success) {
              fetchMyTasks(user?.activeRole || 'customer');
            } else {
              Alert.alert('Error', res.message || 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const renderTaskCard = ({ item }: { item: TaskItem }) => {
    const bidsCount = item.bids?.length || 0;
    const isAssigned = ['assigned', 'in_progress'].includes(item.status);
    const isCompleted = item.status === 'completed';

    const otherParty = isCustomer ? item.helperId : item.customerId;
    const otherPartyName = otherParty?.name || (isCustomer ? 'Helper Assigned' : 'Customer');

    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          item.isUrgent && styles.urgentCard,
          isCompleted && styles.completedCardBorder,
        ]}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
        activeOpacity={0.8}
      >
        {/* Card Top Meta */}
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
          </View>

          {item.isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>🔥 URGENT</Text>
            </View>
          )}

          <View
            style={[
              styles.statusBadge,
              isCompleted && styles.statusCompleted,
              item.status === 'in_progress' && styles.statusInProgress,
              item.status === 'assigned' && styles.statusAssigned,
              item.status === 'cancelled' && styles.statusCancelled,
            ]}
          >
            <Text style={styles.statusText}>
              {isCompleted
                ? '✅ COMPLETED'
                : item.status === 'assigned'
                ? '🤝 ASSIGNED'
                : item.status === 'in_progress'
                ? '⚡ IN PROGRESS'
                : item.status === 'cancelled'
                ? '✕ CANCELLED'
                : '📡 OPEN'}
            </Text>
          </View>

          <Text style={styles.budgetText}>₹{item.budget?.amount}</Text>

          {/* Quick Delete Task button for Customer on open/cancelled tasks */}
          {isCustomer && !isCompleted && !isAssigned && (
            <TouchableOpacity
              style={styles.cardDeleteBtn}
              onPress={() => handleDeleteTaskCard(item._id, item.title)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="trash-2" width={14} height={14} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Task Title & Description */}
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.taskDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Scheduled Time Banner (if set) */}
        {item.timeline?.scheduledText && (
          <View style={styles.schedulePill}>
            <AppIcon name="clock" width={12} height={12} color="#f59e0b" />
            <Text style={styles.schedulePillText} numberOfLines={1}>
              Schedule: {item.timeline.scheduledText}
            </Text>
          </View>
        )}

        {/* Assigned Helper / Customer Row */}
        {isAssigned && otherParty && (
          <View style={styles.participantRow}>
            <Image
              source={{
                uri:
                  otherParty.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
              }}
              style={styles.participantAvatar}
            />
            <View style={styles.participantInfo}>
              <Text style={styles.participantRole}>
                {isCustomer ? 'Assigned Helper:' : 'Posted By Customer:'}
              </Text>
              <Text style={styles.participantName}>{otherPartyName}</Text>
            </View>
            <View style={styles.chatShortcut}>
              <AppIcon name="message-square" width={14} height={14} color={colors.brandPrimary} />
            </View>
          </View>
        )}

        {/* Completion Verified Badge for Completed Tasks */}
        {isCompleted && (
          <View style={styles.verifiedCompletionPill}>
            <Text style={styles.verifiedCompletionText}>
              🔐 Passcode Handshake Verified & Completed
            </Text>
          </View>
        )}

        {/* Completion OTP Pill for Customer when assigned */}
        {isCustomer && isAssigned && (
          <View style={styles.otpIndicatorPill}>
            <AppIcon name="lock" width={12} height={12} color="#f59e0b" />
            <Text style={styles.otpIndicatorText}>Passcode Generated: • • • • (Tap to View)</Text>
          </View>
        )}

        {/* Pending Offers Alert for Customer */}
        {isCustomer && !isAssigned && !isCompleted && bidsCount > 0 && (
          <View style={styles.pendingOffersPill}>
            <Text style={styles.pendingOffersText}>
              🏷️ {bidsCount} {bidsCount === 1 ? 'Offer' : 'Offers'} Received • Tap to Accept / Reject
            </Text>
          </View>
        )}

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.locationRow}>
            <AppIcon name="map-pin" width={12} height={12} color={colors.brandPrimary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location?.address}
            </Text>
          </View>
          <Text style={styles.bidsCount}>
            {bidsCount} {bidsCount === 1 ? 'offer' : 'offers'} ➔
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
    >
      {/* Top Location Bar */}
      <View style={styles.locationBar}>
        <View style={styles.locationLeft}>
          <AppIcon name="map-pin" width={14} height={14} color={colors.brandPrimary} />
          <Text style={styles.locationAddressText} numberOfLines={1}>
            {user?.location?.address || 'Koramangala, Bengaluru, India'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.locationChangeBtn}
          onPress={() => setShowLocationModal(true)}
        >
          <Text style={styles.locationChangeBtnText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Header Banner */}
      <LinearGradient
        colors={isCustomer ? [colors.brandPrimary, colors.accentIndigo] : ['#059669', '#0d9488']}
        style={styles.heroBanner}
      >
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroHeaderLeft}>
            <Text style={styles.greetingText}>Hello, {user?.name || 'User'} 👋</Text>
            <Text style={styles.heroRoleSub}>
              {isCustomer ? '🛡️ Customer Command Center' : '⚡ Helper Mission Control'}
            </Text>
          </View>

          <TouchableOpacity style={styles.roleSwitchBtn} onPress={handleToggleRole}>
            <Text style={styles.roleSwitchBtnText}>
              Mode: {isCustomer ? 'Customer' : 'Helper'} 🔄
            </Text>
          </TouchableOpacity>
        </View>

        {isCustomer ? (
          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() => navigation.navigate('PostTask')}
          >
            <Text style={styles.heroActionBtnText}>+ Post a New Request</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.heroActionBtnEmerald}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={styles.heroActionBtnText}>📡 Open Live Radar ({cleanNearbyTasks.length} in range)</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Real-time Pending Offers Banner for Customer */}
      {isCustomer && tasksWithPendingOffers.length > 0 && (
        <TouchableOpacity
          style={styles.offersAlertBanner}
          onPress={() => {
            setActiveTab('active');
            if (tasksWithPendingOffers[0]) {
              navigation.navigate('TaskDetail', { taskId: tasksWithPendingOffers[0]._id });
            }
          }}
        >
          <View style={styles.offersAlertIconBox}>
            <Text style={styles.offersAlertIcon}>🏷️</Text>
          </View>
          <View style={styles.offersAlertTextWrap}>
            <Text style={styles.offersAlertTitle}>
              {tasksWithPendingOffers.length} Task(s) Have New Helper Offers!
            </Text>
            <Text style={styles.offersAlertSub}>
              Helpers are ready to assist. Tap to review prices, accept or reject.
            </Text>
          </View>
          <AppIcon name="arrowRight" width={16} height={16} color="#f59e0b" />
        </TouchableOpacity>
      )}

      {/* Analytics & Metrics Grid */}
      <View style={styles.analyticsSection}>
        <Text style={styles.sectionHeading}>
          {isCustomer ? 'Customer Activity Overview' : 'Helper Performance & Earnings'}
        </Text>

        <View style={styles.metricsGrid}>
          {isCustomer ? (
            <>
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>Tasks Posted</Text>
                <Text style={styles.metricCardValue}>{myTasks.length}</Text>
                <Text style={styles.metricCardSub}>{activeTasks.length} Active</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>Completed</Text>
                <Text style={[styles.metricCardValue, { color: '#10b981' }]}>{completedTasks.length}</Text>
                <Text style={styles.metricCardSub}>Verified OTP</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>Total Spent</Text>
                <Text style={[styles.metricCardValue, { color: colors.brandPrimary }]}>
                  ₹{user?.stats?.totalSpent || 0}
                </Text>
                <Text style={styles.metricCardSub}>Direct Escrow</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>Rating</Text>
                <Text style={[styles.metricCardValue, { color: '#fbbf24' }]}>
                  ⭐ {user?.stats?.avgRatingAsCustomer || '5.0'}
                </Text>
                <Text style={styles.metricCardSub}>{user?.stats?.ratingCountCustomer || 0} reviews</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>Assigned Work</Text>
                <Text style={styles.metricCardValue}>{activeTasks.length}</Text>
                <Text style={styles.metricCardSub}>In Progress</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>Completed Jobs</Text>
                <Text style={[styles.metricCardValue, { color: '#10b981' }]}>{completedTasks.length}</Text>
                <Text style={styles.metricCardSub}>Finished</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>Total Earned</Text>
                <Text style={[styles.metricCardValue, { color: '#10b981' }]}>
                  ₹{user?.stats?.totalEarned || 0}
                </Text>
                <Text style={styles.metricCardSub}>Direct Payouts</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>Helper Rating</Text>
                <Text style={[styles.metricCardValue, { color: '#fbbf24' }]}>
                  ⭐ {user?.stats?.avgRatingAsHelper || '5.0'}
                </Text>
                <Text style={styles.metricCardSub}>{user?.stats?.ratingCountHelper || 0} reviews</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Task History & Tracking Tabs */}
      <View style={styles.historySection}>
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionHeading}>
            {isCustomer ? 'My Task History & Requests' : 'My Job History & Bids'}
          </Text>
          <Text style={styles.historyCountBadge}>{filteredTasks.length}</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'active' && styles.tabChipActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabChipText, activeTab === 'active' && styles.tabChipTextActive]}>
              ⚡ Active ({activeTasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'completed' && styles.tabChipActiveGreen]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabChipText, activeTab === 'completed' && styles.tabChipTextActive]}>
              ✅ Completed ({completedTasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'all' && styles.tabChipActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabChipText, activeTab === 'all' && styles.tabChipTextActive]}>
              📋 All ({myTasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'cancelled' && styles.tabChipActiveRed]}
            onPress={() => setActiveTab('cancelled')}
          >
            <Text style={[styles.tabChipText, activeTab === 'cancelled' && styles.tabChipTextActive]}>
              ✕ Cancelled ({cancelledTasks.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'completed' ? '🏆' : activeTab === 'cancelled' ? '📂' : '📋'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'active'
                ? 'No Active Tasks'
                : activeTab === 'completed'
                ? 'No Completed Tasks Yet'
                : activeTab === 'cancelled'
                ? 'No Cancelled Tasks'
                : 'No Task History Found'}
            </Text>
            <Text style={styles.emptyText}>
              {isCustomer
                ? activeTab === 'active'
                  ? 'Post a new task to receive instant offers from verified nearby helpers.'
                  : 'Your task records will appear here as they are completed.'
                : activeTab === 'active'
                ? 'Check out the Live Radar map to find nearby tasks and make offers.'
                : 'Finished jobs and earnings history will be tracked here.'}
            </Text>

            {isCustomer && activeTab === 'active' && (
              <TouchableOpacity
                style={styles.quickPostBtn}
                onPress={() => navigation.navigate('PostTask')}
              >
                <Text style={styles.quickPostBtnText}>+ Create a Request Now</Text>
              </TouchableOpacity>
            )}

            {!isCustomer && activeTab === 'active' && (
              <TouchableOpacity
                style={styles.quickRadarBtn}
                onPress={() => navigation.navigate('Explore')}
              >
                <Text style={styles.quickRadarBtnText}>📡 Open Live Radar Map</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item._id}
            renderItem={renderTaskCard}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Helper-Only Live Radar Preview */}
      {!isCustomer && cleanNearbyTasks.length > 0 && (
        <View style={[styles.section, { marginBottom: spacing['3xl'] }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Live Nearby Radar Stream</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.radarRadiusText}>Explore All ({cleanNearbyTasks.length}) ➔</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={cleanNearbyTasks.slice(0, 4)}
            keyExtractor={(item) => item._id}
            renderItem={renderTaskCard}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Manual Location Modal */}
      <ManualLocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: spacing.sm,
  },
  locationAddressText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  locationChangeBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  locationChangeBtnText: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  heroBanner: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  heroHeaderLeft: {
    flex: 1,
  },
  greetingText: {
    color: '#fff',
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
  },
  heroRoleSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.xs,
  },
  roleSwitchBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  roleSwitchBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  heroActionBtn: {
    backgroundColor: '#fff',
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  heroActionBtnEmerald: {
    backgroundColor: '#064e3b',
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroActionBtnText: {
    color: colors.bgCanvas,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  offersAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: spacing.sm,
  },
  offersAlertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offersAlertIcon: {
    fontSize: 18,
  },
  offersAlertTextWrap: {
    flex: 1,
  },
  offersAlertTitle: {
    color: '#f59e0b',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  offersAlertSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  analyticsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metricCardLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  metricCardValue: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    marginVertical: 2,
  },
  metricCardSub: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  historySection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyCountBadge: {
    backgroundColor: colors.bgElevated,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  tabChip: {
    backgroundColor: colors.bgCard,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  tabChipActiveGreen: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  tabChipActiveRed: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  tabChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  tabChipTextActive: {
    color: '#fff',
    fontWeight: fontWeights.bold,
  },
  taskCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  urgentCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  completedCardBorder: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  urgentBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: fontWeights.black,
  },
  statusBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusInProgress: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusAssigned: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  budgetText: {
    marginLeft: 'auto',
    color: '#10b981',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.black,
  },
  taskTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  taskDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: spacing.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  schedulePillText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.xs,
    borderRadius: 10,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantRole: {
    color: colors.textTertiary,
    fontSize: 9,
  },
  participantName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  chatShortcut: {
    padding: 4,
  },
  verifiedCompletionPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  verifiedCompletionText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  otpIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  otpIndicatorText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  pendingOffersPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  pendingOffersText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  locationText: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  bidsCount: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: spacing.xs,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    marginBottom: 4,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  quickPostBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  quickPostBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  quickRadarBtn: {
    backgroundColor: '#059669',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  quickRadarBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  radarRadiusText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  cardDeleteBtn: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginLeft: spacing.xs,
  },
});
