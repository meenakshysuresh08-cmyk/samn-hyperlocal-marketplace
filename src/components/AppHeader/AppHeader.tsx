import React, { useCallback } from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsRTL } from '../../hooks/useIsRTL';
import { header as headerTokens } from '../../theme/tokens';
import { useThemeStore } from '../../theme/useThemeStore';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { AppView } from '../AppView';
import { createAppHeaderStyles } from './styles';
import type { AppHeaderProps } from './types';

const useGradientHeaderStatusBar = (headerColor: string) => {
  const theme = useThemeStore(state => state.theme);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(headerColor);
        StatusBar.setTranslucent(true);
      }
      return () => {
        StatusBar.setBarStyle(theme.statusBarStyle);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor(theme.statusBar);
          StatusBar.setTranslucent(false);
        }
      };
    }, [headerColor, theme.statusBar, theme.statusBarStyle]),
  );
};

const IconButton = ({
  icon,
  onPress,
  color,
  accessibilityLabel,
}: {
  icon: string;
  onPress?: () => void;
  color?: string;
  accessibilityLabel?: string;
}) => (
  <AppIcon
    name={icon}
    size="md"
    color={color}
    pressable
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
    style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
  />
);

type GradientHeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onSearch?: () => void;
  onScan?: () => void;
  onEdit?: () => void;
  onMore?: () => void;
  rightContent?: React.ReactNode;
  safeArea?: boolean;
};

export const StandardHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onSearch,
  onScan,
  onMore,
  safeArea = true,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const theme = useThemeStore(state => state.theme);
  const isRTL = useIsRTL();
  const styles = createAppHeaderStyles(theme, isRTL);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const topPadding = safeArea ? Math.max(insets.top, headerTokens.minTopInset) : 0;
  const gradColors =
    Array.isArray(theme.gradientHeader) && theme.gradientHeader.length > 0
      ? [...theme.gradientHeader]
      : [theme.primaryDark, theme.primary];

  useGradientHeaderStatusBar(theme.headerStatusBar);

  return (
    <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gradientHeader}>
      <AppView style={[styles.gradientHeaderContent, { paddingTop: topPadding }]}>
        <AppView style={[styles.gsHeaderRow, { marginBottom: 0 }]}>
          <TouchableOpacity
            style={styles.gsBackBtnPill}
            onPress={handleBack}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevronLeft" width={headerTokens.iconSize} height={headerTokens.iconSize} color={theme.headerText} rtlFlip={isRTL} />
          </TouchableOpacity>

          <AppView
            style={[
              styles.gsTitleWrapper,
              {
                alignItems: isRTL ? 'flex-end' : 'flex-start',
                marginLeft: isRTL ? 0 : 16,
                marginRight: isRTL ? 16 : 0,
              },
            ]}
          >
            {title ? (
              <AppText
                preset="headerTitle"
                style={[styles.gsHeaderTitle, { textAlign: isRTL ? 'right' : 'left' }]}
              >
                {title}
              </AppText>
            ) : null}
            {subtitle ? (
              <AppText
                preset="headerSubtitle"
                style={[
                  styles.subtitleText,
                  {
                    marginTop: 2,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </AppText>
            ) : null}
          </AppView>

          <AppView style={styles.actions}>
            {onSearch ? (
              <IconButton icon="search" onPress={onSearch} color={theme.headerText} accessibilityLabel="Search" />
            ) : null}
            {onScan ? (
              <IconButton icon="tabQrCode" onPress={onScan} color={theme.headerText} accessibilityLabel="Scan" />
            ) : null}
            {onMore ? (
              <IconButton icon="menu" onPress={onMore} color={theme.headerText} accessibilityLabel="More options" />
            ) : null}
          </AppView>
        </AppView>
      </AppView>
    </LinearGradient>
  );
};

export const CommonHeader = StandardHeader;

export type DashboardHeaderProps = {
  user?: { name?: string };
  onNotification?: () => void;
  onSettings?: () => void;
  safeArea?: boolean;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  onNotification,
  onSettings,
  safeArea = false,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useThemeStore(state => state.theme);
  const isRTL = useIsRTL();
  const styles = createAppHeaderStyles(theme, isRTL);

  const topPadding = safeArea ? Math.max(insets.top, headerTokens.minTopInset) : headerTokens.dashboardTopPadding;
  const gradColors =
    Array.isArray(theme.gradientHeader) && theme.gradientHeader.length > 0
      ? [...theme.gradientHeader]
      : [theme.primaryDark, theme.primary];

  useGradientHeaderStatusBar(theme.headerStatusBar);

  const displayName = user?.name?.trim() || 'Guest';
  const greetingText = `Hello, ${displayName}`;

  return (
    <LinearGradient
      colors={gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.gradientHeader, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
    >
      <AppView style={[styles.gradientHeaderContent, { paddingTop: topPadding }]}>
        <AppView style={[styles.gsHeaderRow, { marginBottom: 0 }]}>
          <AppView
            style={{
              flex: 1,
              justifyContent: 'center',
              marginLeft: isRTL ? 0 : 16,
              marginRight: isRTL ? 16 : 0,
            }}
          >
            <AppText preset="headerGreeting" style={styles.greeting}>
              {greetingText}
            </AppText>
            <AppText preset="headerSubtitle" style={styles.subGreeting}>
              Welcome back
            </AppText>
          </AppView>

          <AppView style={styles.actions}>
            {onNotification ? (
              <IconButton
                icon="bell"
                onPress={onNotification}
                color={theme.headerText}
                accessibilityLabel="Notifications"
              />
            ) : null}
            {onSettings ? (
              <IconButton
                icon="settings"
                onPress={onSettings}
                color={theme.headerText}
                accessibilityLabel="Settings"
              />
            ) : null}
          </AppView>
        </AppView>
      </AppView>
    </LinearGradient>
  );
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  preset = 'standard',
  title,
  tx,
  titlePreset = 'heading1',
  subtitle,
  subtitleTx,
  centerAligned,
  onLeftPress,
  leftIcon,
  showBack,
  onRightPress,
  rightIcon,
  leftContent,
  rightContent,
  children,
  transparent,
  safeArea,
  style,
  contentStyle,
  titleStyle,
}) => {
  const theme = useThemeStore(state => state.theme);
  const navigation = useNavigation();
  const isRTL = useIsRTL();
  const styles = createAppHeaderStyles(theme, isRTL);
  const isHome = preset === 'home';
  const isBack = preset === 'back';
  const _centerAligned = centerAligned ?? !(isHome || isBack);
  const _safeArea = safeArea ?? !(isHome || isBack);
  const _transparent = transparent ?? false;
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onLeftPress) {
      onLeftPress();
    } else {
      navigation.goBack();
    }
  };

  const headerTitle = tx ?? title;
  const headerSubtitle = subtitleTx ?? subtitle;

  const renderLeft = () => {
    if (leftContent) {
      return <AppView style={{ justifyContent: 'center' }}>{leftContent}</AppView>;
    }
    if (showBack || leftIcon) {
      return (
        <AppView style={styles.slot}>
          <Pressable
            onPress={handleBackPress}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <AppIcon
              name={leftIcon || 'chevronLeft'}
              width={24}
              height={24}
              color={theme.textPrimary}
              rtlFlip
            />
          </Pressable>
        </AppView>
      );
    }
    return _centerAligned ? <AppView style={styles.slot} /> : null;
  };

  const renderRight = () => {
    if (rightContent) {
      return <AppView style={{ justifyContent: 'center' }}>{rightContent}</AppView>;
    }
    if (!rightIcon) {
      return _centerAligned ? <AppView style={styles.slot} /> : null;
    }

    return (
      <AppView style={styles.slot}>
        {onRightPress ? (
          <Pressable
            onPress={onRightPress}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            hitSlop={10}
          >
            <AppIcon name={rightIcon} width={24} height={24} color={theme.textPrimary} rtlFlip />
          </Pressable>
        ) : (
          <AppView style={styles.actionButton}>
            <AppIcon name={rightIcon} width={24} height={24} color={theme.textPrimary} rtlFlip />
          </AppView>
        )}
      </AppView>
    );
  };

  const renderCenter = () => {
    if (children) {
      return (
        <AppView style={[styles.center, !_centerAligned && styles.centerStart]}>{children}</AppView>
      );
    }

    if (!headerTitle) {
      return <AppView style={styles.center} />;
    }

    return (
      <AppView style={[styles.center, !_centerAligned && styles.centerStart]}>
        <AppText preset={titlePreset} style={[styles.title, titleStyle]} numberOfLines={1}>
          {headerTitle}
        </AppText>
        {headerSubtitle ? (
          <AppText style={styles.subtitle} numberOfLines={1}>
            {headerSubtitle}
          </AppText>
        ) : null}
      </AppView>
    );
  };

  return (
    <AppView
      style={[
        styles.root,
        isHome && styles.presetHome,
        isBack && styles.presetBack,
        _transparent && styles.transparent,
        _safeArea && { paddingTop: insets?.top || 0 },
        style,
      ]}
    >
      <View style={[styles.navbar, isHome && styles.navbarHome, isBack && styles.navbarBack, contentStyle]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
    </AppView>
  );
};
