import type { Theme } from '@react-navigation/native';

import type { AppTheme } from './themes';

export type ThemePreference = 'light' | 'dark' | 'system';

export type AppThemeColors = {
  background: string;
  surface: string;
  border: string;
  text: string;
  mutedText: string;
  primary: string;
  success: string;
  danger: string;
  navigation: Theme;
};

export type { AppTheme };
