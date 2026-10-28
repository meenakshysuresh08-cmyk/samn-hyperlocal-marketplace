import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  type KeyboardAvoidingViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = Omit<
  KeyboardAvoidingViewProps,
  'behavior' | 'keyboardVerticalOffset'
> & {
  /**
   * Extra offset from the top of the screen.
   * Use this if you have a fixed header above the view.
   */
  extraOffset?: number;
  /**
   * If true, adds the top safe-area inset to the offset.
   * Default is false because it can reduce the lift on Android modals/sheets.
   */
  includeSafeAreaTop?: boolean;
  /**
   * Defaults to a flex:1 container style.
   */
  style?: StyleProp<ViewStyle>;
};

export function KeyboardAvoiding({
  children,
  extraOffset = 0,
  includeSafeAreaTop = false,
  style,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();

  // iOS needs "padding" to move content above keyboard.
  // Android is more reliable with "height" (works with adjustResize).
  const behavior = Platform.OS === 'ios' ? 'padding' : 'height';

  const keyboardVerticalOffset =
    extraOffset + (includeSafeAreaTop ? Math.max(insets.top, 0) : 0);

  return (
    <KeyboardAvoidingView
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[{ flex: 1 }, style]}
      {...rest}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
