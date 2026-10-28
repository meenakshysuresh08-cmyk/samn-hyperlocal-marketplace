import { Animated, Pressable } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

import { AppSwitchProps } from './types';
import { createAppSwitchStyles } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';
import { AppView } from '../AppView';
import { AppText } from '../AppText';

export const AppSwitch: React.FC<AppSwitchProps> = ({
  value,
  defaultValue = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  containerStyle,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
    const styles = createAppSwitchStyles(theme, isRTL);

  const [internalValue, setInternalValue] = useState(defaultValue);

  // Controlled / uncontrolled logic
  const checked = value !== undefined ? value : internalValue;

  // Animation for thumb position
  const positionAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  const toggle = () => {
    if (disabled) return;
    const next = !checked;
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  };

  useEffect(() => {
    Animated.spring(positionAnim, {
      toValue: checked ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  }, [checked, positionAnim]);

  // Sizing setup
  const trackWidth = size === 'lg' ? 56 : size === 'sm' ? 38 : 48;
  const trackHeight = size === 'lg' ? 30 : size === 'sm' ? 20 : 26;
  const padding = 3;
  const thumbSize = trackHeight - padding * 2;
  const thumbTranslate = trackWidth - trackHeight;

  return (
    <Pressable
      onPress={toggle}
      disabled={disabled}
      style={[
        styles.container,
        { opacity: disabled ? 0.6 : 1 },
        containerStyle,
      ]}
    >
      {/* Switch control */}
      <AppView
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            backgroundColor: checked ? theme.primary : theme.border,
            padding,
            alignItems: isRTL ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              backgroundColor: '#fff',
              transform: [
                {
                  translateX: positionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, isRTL ? -thumbTranslate : thumbTranslate],
                  }),
                },
              ],
            },
          ]}
        />
      </AppView>

      {/* Label + Description */}
      {(label || description) && (
        <AppView style={styles.labelContainer}>
          {label && <AppText style={styles.label}>{label}</AppText>}
          {description && (
            <AppText style={styles.description}>{description}</AppText>
          )}
        </AppView>
      )}
    </Pressable>
  );
};
