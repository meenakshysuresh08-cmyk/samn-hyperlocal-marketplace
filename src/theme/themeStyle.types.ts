import { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { AppTheme } from './themes';

export type NamedStyles = {
  [key: string]: ViewStyle | TextStyle | ImageStyle;
};

export type ThemedStyle<T = NamedStyles> = (theme: AppTheme) => T;

export type ThemedStyleArray<T = NamedStyles> = Array<ThemedStyle<T> | T>;
