import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';

import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';
import { IconRegistry } from './IconRegistry';
import { AppIconStyles, iconSizes } from './styles';
import type { AppIconProps, IconName, IconSource, VectorIconDefinition } from './types';

const VECTOR_MAP = {
  ion: Ionicons,
  material: MaterialIcons,
  materialCommunity: MaterialCommunityIcons,
  feather: Feather,
};

const isVectorIcon = (src: IconSource): src is VectorIconDefinition =>
  typeof src === 'object' && src !== null && 'type' in src && src.type === 'vector';

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 'md',
  width,
  height,
  color,
  rtlFlip = true,
  pressable = false,
  style,
  onPress,
  accessibilityLabel,
}) => {
  const theme = useThemeStore(state => state.theme);
  const isRTL = useIsRTL();
  const animatedScaleRef = useRef(new Animated.Value(1));
  const iconSize = iconSizes[size];

  let resolved: IconSource;
  if (typeof name === 'string' && name in IconRegistry) {
    resolved = IconRegistry[name as IconName];
  } else {
    resolved = name as IconSource;
  }

  const flipStyle = rtlFlip && isRTL ? ({ transform: [{ scaleX: -1 }] } as any) : undefined;
  const isInteractive = pressable && typeof onPress === 'function';
  const Wrapper = isInteractive ? TouchableOpacity : View;

  if (!isVectorIcon(resolved)) {
    return null;
  }

  const IconSet = VECTOR_MAP[resolved.pack];

  const content = (
    <IconSet
      name={resolved.name as never}
      size={width ?? height ?? iconSize}
      color={color || theme.text}
      style={flipStyle}
    />
  );

  return (
    <Animated.View
      style={[{ transform: [{ scale: animatedScaleRef.current }] }, AppIconStyles.base, style]}
    >
      <Wrapper
        onPress={isInteractive ? onPress : undefined}
        disabled={!isInteractive}
        accessibilityLabel={accessibilityLabel}
        {...(isInteractive ? { accessibilityRole: 'button' as const } : {})}
      >
        {content}
      </Wrapper>
    </Animated.View>
  );
};
