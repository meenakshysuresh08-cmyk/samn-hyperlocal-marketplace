import { createThemedStyles } from '../theme/createThemedStyles';
import { TAB_BAR_CONTENT_HEIGHT, TAB_BAR_ROW_HEIGHT } from './tabBarLayout';

export const tabBarStyles = createThemedStyles(theme => ({
  tabBar: {
    backgroundColor: theme.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: theme.tabBarBorder,
    paddingTop: 22,
    minHeight: TAB_BAR_CONTENT_HEIGHT,
    overflow: 'visible',
    shadowColor: theme.tabBarShadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: theme.tabBarShadowOpacity,
    shadowRadius: 5,
    elevation: 8,
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: TAB_BAR_ROW_HEIGHT,
  },
  tabBarLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    height: TAB_BAR_ROW_HEIGHT,
  },
  tabBarRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 112,
    height: TAB_BAR_ROW_HEIGHT,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    height: TAB_BAR_ROW_HEIGHT,
  },
  tabBarItemDisabled: {
    opacity: 0.55,
  },
  tabBarItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    lineHeight: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tabBarLabelInactive: {
    color: theme.tabBarItemInactive,
    fontWeight: '600',
  },
  tabBarLabelActive: {
    color: theme.tabBarItemActive,
    fontWeight: '700',
  },
  tabBarScanWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarScanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.tabBarScanShadowOpacity,
    shadowRadius: 15,
    elevation: 10,
  },
}));
