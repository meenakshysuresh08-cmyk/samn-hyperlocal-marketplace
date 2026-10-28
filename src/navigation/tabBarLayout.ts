import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { createContext, useContext } from 'react';

export const TAB_BAR_ROW_HEIGHT = 64;
/** Space reserved above the tab row for the center FAB. */
export const TAB_BAR_TOP_PADDING = 22;
export const TAB_BAR_CONTENT_HEIGHT = TAB_BAR_ROW_HEIGHT + TAB_BAR_TOP_PADDING;
/** Fallback scroll inset until the tab bar reports its measured height. */
export const TAB_BAR_DEFAULT_INSET = TAB_BAR_CONTENT_HEIGHT + 24;

export const TabBarInsetContext = createContext(TAB_BAR_DEFAULT_INSET);

export const useTabBarInset = (): number => useContext(TabBarInsetContext);

/**
 * Bottom inset for the custom tab bar.
 * iOS keeps the source-project adjustment; Android always reserves nav/gesture space.
 */
export function getTabBarBottomPadding(insets: EdgeInsets): number {
  if (Platform.OS === 'ios') {
    return insets.bottom > 0 ? Math.max(insets.bottom - 14, 0) : 0;
  }

  return Math.max(insets.bottom, 12);
}
