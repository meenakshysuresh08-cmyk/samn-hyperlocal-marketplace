import { AppTheme } from './themes';
import { StyleSheet } from 'react-native';

export function createThemedStyles<
  T extends StyleSheet.NamedStyles<T>,
  P extends any[],
>(styles: (theme: AppTheme, ...args: P) => T) {
  return (theme: AppTheme, ...args: P) =>
    StyleSheet.create(styles(theme, ...args));
}
