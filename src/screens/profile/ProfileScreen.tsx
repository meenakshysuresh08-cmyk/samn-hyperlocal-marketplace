import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuthStore } from '../../services/authStore';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';
import { AppIcon } from '../../components/AppIcon';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, switchRole, logout, refreshUser } = useAuthStore();

  React.useEffect(() => {
    if (refreshUser) refreshUser();
  }, []);

  const isCustomer = user?.activeRole === 'customer';

  const handleToggleRole = async () => {
    const nextRole = isCustomer ? 'helper' : 'customer';
    await switchRole(nextRole);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Card */}
      <View style={styles.userCard}>
        <Image
          source={{
            uri:
              user?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
          }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user?.name || 'SAMN User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        <Text style={styles.userPhone}>📱 {user?.phone || 'Not set'}</Text>

        {/* Role switcher button */}
        <TouchableOpacity style={styles.roleSwitchBtn} onPress={handleToggleRole}>
          <Text style={styles.roleSwitchBtnText}>
            Active Role: <Text style={styles.roleHighlight}>{user?.activeRole?.toUpperCase()}</Text> (Tap to Switch)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <Text style={styles.statsHeader}>Reputation & Financial Activity</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={[styles.statVal, { color: '#f59e0b' }]}>
              ₹{user?.stats?.totalSpent || 0}
            </Text>
            <Text style={styles.statSub}>As Customer</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={[styles.statVal, { color: '#10b981' }]}>
              ₹{user?.stats?.totalEarned || 0}
            </Text>
            <Text style={styles.statSub}>As Helper</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statVal}>{user?.stats?.tasksCompleted || 0}</Text>
            <Text style={styles.statSub}>Tasks done</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={[styles.statVal, { color: '#fbbf24' }]}>
              ⭐ {isCustomer ? (user?.stats?.avgRatingAsCustomer || '5.0') : (user?.stats?.avgRatingAsHelper || '5.0')}
            </Text>
            <Text style={styles.statSub}>{isCustomer ? 'As Customer' : 'As Helper'}</Text>
          </View>
        </View>
      </View>

      {/* Quick Action: Task History & Dashboard */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate('HomeStack')}
      >
        <AppIcon name="clock" width={18} height={18} color={colors.brandPrimary} />
        <View style={styles.historyBtnTextCol}>
          <Text style={styles.historyBtnTitle}>
            {isCustomer ? 'My Posted Requests History' : 'My Completed Jobs & Bids'}
          </Text>
          <Text style={styles.historyBtnSub}>
            Track active tasks, completed work, and reviews
          </Text>
        </View>
        <AppIcon name="arrowRight" width={16} height={16} color={colors.textTertiary} />
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <AppIcon name="log-out" width={16} height={16} color="#ef4444" />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  userCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    marginBottom: spacing.md,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  userPhone: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  roleSwitchBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  roleSwitchBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  roleHighlight: {
    color: colors.brandPrimary,
  },
  statsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.lg,
  },
  statsHeader: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  statVal: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
    marginTop: 2,
  },
  statSub: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  historyBtnTextCol: {
    flex: 1,
  },
  historyBtnTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  historyBtnSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: spacing.sm,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
});
