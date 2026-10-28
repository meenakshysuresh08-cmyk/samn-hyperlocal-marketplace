import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import { AppText } from '../components/AppText';
import { useThemeStore } from '../theme/useThemeStore';
import { useAuthStore } from '../services/authStore';
import { getTabBarBottomPadding } from './tabBarLayout';
import { tabBarStyles } from './tabBarStyles';

type TabKey = 'HomeStack' | 'ExploreStack' | 'PostTask' | 'ChatStack' | 'ProfileStack' | 'SettingsStack';

type AppBottomTabBarProps = BottomTabBarProps & {
  onHeightChange?: (height: number) => void;
};

export const AppBottomTabBar: React.FC<AppBottomTabBarProps> = ({
  state,
  navigation,
  onHeightChange,
}) => {
  const theme = useThemeStore(s => s.theme);
  const { user } = useAuthStore();
  const isCustomer = user?.activeRole === 'customer';

  const styles = tabBarStyles(theme);
  const insets = useSafeAreaInsets();
  const bottomPadding = getTabBarBottomPadding(insets);

  const activeRoute = state.routes[state.index]?.name as TabKey;
  const inactive = theme.tabBarItemInactive;
  const active = theme.tabBarItemActive;

  const navigateTo = (routeName: TabKey) => {
    const selected = activeRoute === routeName;
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes.find(route => route.name === routeName)?.key ?? '',
      canPreventDefault: true,
    });
    if (!selected && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const renderTab = (
    key: string,
    label: string,
    iconActive: string,
    iconInactive: string,
    selected: boolean,
    onPress?: () => void,
    disabled = false,
  ) => (
    <TouchableOpacity
      key={key}
      style={[styles.tabBarItem, disabled && styles.tabBarItemDisabled]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <View style={styles.tabBarItemInner}>
        <AppIcon
          name={selected ? iconActive : iconInactive}
          color={selected ? active : inactive}
          width={22}
          height={22}
        />
        <AppText
          style={[styles.tabBarLabel, selected ? styles.tabBarLabelActive : styles.tabBarLabelInactive]}
        >
          {label}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.tabBar, { paddingBottom: bottomPadding }]}
      onLayout={event => {
        const { height } = event.nativeEvent.layout;
        if (height > 0) {
          onHeightChange?.(height);
        }
      }}
    >
      <View style={styles.tabBarRow}>
        {/* Left Tabs */}
        <View style={styles.tabBarLeftGroup}>
          {renderTab(
            'home',
            'Home',
            'tabHomeActive',
            'tabHomeInactive',
            activeRoute === 'HomeStack',
            () => navigateTo('HomeStack'),
          )}
          {renderTab(
            'radar',
            isCustomer ? 'Explore' : 'Radar',
            'mapPin',
            'mapPin',
            activeRoute === 'ExploreStack',
            () => navigateTo('ExploreStack'),
          )}
        </View>

        {/* Right Tabs */}
        <View style={styles.tabBarRightGroup}>
          {renderTab(
            'chat',
            'Chat',
            'tabChatActive',
            'tabChatInactive',
            activeRoute === 'ChatStack',
            () => navigateTo('ChatStack'),
          )}
          {renderTab(
            'profile',
            'Profile',
            'tabProfileActive',
            'tabProfileInactive',
            activeRoute === 'ProfileStack',
            () => navigateTo('ProfileStack'),
          )}
        </View>

        {/* Center Floating Action Button */}
        <View style={styles.tabBarScanWrap} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => {
              if (isCustomer) {
                navigation.navigate('PostTask');
              } else {
                navigation.navigate('ExploreStack');
              }
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isCustomer ? 'Post Task' : 'Explore Radar'}
          >
            <LinearGradient
              colors={isCustomer ? ['#6366f1', '#4f46e5'] : ['#10b981', '#059669']}
              locations={[0.2, 1]}
              start={{ x: 0, y: 0.3 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabBarScanButton}
            >
              <AppIcon
                name={isCustomer ? 'plus' : 'search'}
                color="#ffffff"
                width={26}
                height={26}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
