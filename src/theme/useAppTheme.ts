import { useEffect } from 'react';
import { DarkTheme as NavigationDarkTheme, DefaultTheme } from '@react-navigation/native';

import type { ThemePreference } from './theme.types';
import { DarkTheme, LightTheme } from './themes';
import { useThemeStore } from './useThemeStore';

const buildNavigationTheme = (isDark: boolean) => {
  const palette = isDark ? DarkTheme : LightTheme;
  const base = isDark ? NavigationDarkTheme : DefaultTheme;

  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.textPrimary,
      border: palette.border,
      notification: palette.error,
    },
  };
};

export const useAppTheme = () => {
  const mode = useThemeStore(state => state.mode);
  const colorScheme = useThemeStore(state => state.colorScheme);
  const theme = useThemeStore(state => state.theme);
  const setMode = useThemeStore(state => state.setMode);
  const initialize = useThemeStore(state => state.initialize);

  useEffect(() => initialize(), [initialize]);

  const isDark = (colorScheme ?? 'light') === 'dark';
  const preference: ThemePreference = mode;

  return {
    theme,
    colors: {
      background: theme.background,
      surface: theme.surfacePrimary,
      border: theme.border,
      text: theme.textPrimary,
      mutedText: theme.textSecondary,
      primary: theme.primary,
      success: theme.success,
      danger: theme.error,
      navigation: buildNavigationTheme(isDark),
    },
    isDark,
    preference,
    activeScheme: colorScheme ?? 'light',
    setPreference: setMode,
  };
};
