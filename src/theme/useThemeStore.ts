import { Appearance, ColorSchemeName } from 'react-native';
import { create } from 'zustand';

import { DarkTheme, LightTheme, type AppTheme } from './themes';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeState = {
  mode: ThemeMode;
  colorScheme: ColorSchemeName;
  theme: AppTheme;
};

type ThemeActions = {
  setMode: (mode: ThemeMode) => void;
  detectSystemTheme: () => void;
  initialize: () => () => void;
};

const resolveTheme = (mode: ThemeMode) => {
  const systemScheme = Appearance.getColorScheme() ?? 'light';
  const effective = mode === 'system' ? systemScheme : mode;
  return {
    colorScheme: effective,
    theme: effective === 'dark' ? DarkTheme : LightTheme,
  };
};

export const useThemeStore = create<ThemeState & ThemeActions>((set, get) => ({
  mode: 'system',
  ...resolveTheme('system'),

  setMode: mode => {
    set({ mode, ...resolveTheme(mode) });
  },

  detectSystemTheme: () => {
    const { mode } = get();
    if (mode !== 'system') {
      return;
    }
    set(resolveTheme('system'));
  },

  initialize: () => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const { mode } = get();
      if (mode === 'system') {
        const scheme = colorScheme ?? 'light';
        set({
          colorScheme: scheme,
          theme: scheme === 'dark' ? DarkTheme : LightTheme,
        });
      }
    });

    get().detectSystemTheme();

    return () => subscription.remove();
  },
}));
