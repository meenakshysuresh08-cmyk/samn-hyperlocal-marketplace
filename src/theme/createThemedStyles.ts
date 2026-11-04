import { AppTheme } from './themes';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

export function createThemedStyles<
  T extends { [K in keyof T]: ViewStyle | TextStyle | ImageStyle },
  P extends any[] = any[],
>(styles: (theme: AppTheme, ...args: P) => T) {
  return (theme: AppTheme, ...args: P): T =>
    StyleSheet.create(styles(theme, ...args)) as T;
}
