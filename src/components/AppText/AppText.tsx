import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from 'react-native';
import React, { ReactNode, forwardRef } from 'react';

import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';
import { TextPresets, textPresets } from './presets';
import { TextSizes, textSizes } from './sizes';
import { fontWeights } from './weights';

export interface AppTextProps extends RNTextProps {
  tx?: string;
  text?: string | number;
  children?: ReactNode;
  preset?: TextPresets;
  weight?: keyof typeof fontWeights;
  size?: TextSizes;
  style?: StyleProp<TextStyle>;
}

export const AppText = forwardRef<RNText, AppTextProps>((props, ref) => {
  const theme = useThemeStore(state => state.theme);
  const isRTL = useIsRTL();

  const {
    tx,
    text,
    children,
    preset = 'default',
    weight,
    size,
    style: override,
    ...rest
  } = props;

  let content: React.ReactNode = null;

  if (tx) {
    content = tx;
  } else if (typeof text === 'string' || typeof text === 'number') {
    content = text;
  } else if (React.isValidElement(children)) {
    content = children;
  } else if (Array.isArray(children)) {
    content = children;
  } else if (children != null) {
    content = String(children);
  }

  const presetStyles = textPresets[preset].map(item =>
    typeof item === 'function' ? item(theme) : item,
  );

  const sizeStyle = size ? textSizes[size] : {};
  const weightFont = weight ? fontWeights[weight] : undefined;

  const rtlStyle: TextStyle = isRTL
    ? { writingDirection: 'rtl', textAlign: 'right' }
    : { writingDirection: 'ltr', textAlign: 'left' };

  return (
    <RNText
      {...rest}
      ref={ref}
      style={[presetStyles, sizeStyle, weightFont && { fontFamily: weightFont }, rtlStyle, override]}
    >
      {content}
    </RNText>
  );
});

AppText.displayName = 'AppText';
