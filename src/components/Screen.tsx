import React from 'react';
import { StyleSheet } from 'react-native';

import { TAB_BAR_DEFAULT_INSET, useTabBarInset } from '../navigation/tabBarLayout';
import { useThemeStore } from '../theme/useThemeStore';
import { AppView } from './AppView';

type ScreenProps = {
  children: React.ReactNode;
};

export const Screen = ({ children }: ScreenProps) => {
  const theme = useThemeStore(state => state.theme);
  const tabBarInset = useTabBarInset();

  return (
    <AppView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppView style={[styles.content, { paddingBottom: Math.max(tabBarInset, TAB_BAR_DEFAULT_INSET) }]}>
        {children}
      </AppView>
    </AppView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
