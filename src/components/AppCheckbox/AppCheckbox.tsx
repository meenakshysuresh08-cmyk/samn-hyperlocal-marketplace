import { Animated, Pressable } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

import { AppCheckboxProps } from './types';
import { AppIcon } from '../AppIcon';
import { createAppCheckboxStyles } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';
import { AppView } from '../AppView';
import { AppText } from '../AppText';

export const AppCheckbox: React.FC<AppCheckboxProps> = ({
  label,
  description,
  value,
  defaultValue = false,
  onChange,
  disabled = false,
  boxSize = 22,
  hitSlop = 10,
  containerStyle,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
    const styles = createAppCheckboxStyles(theme, isRTL);

  // Handle controlled / uncontrolled
  const [internalValue, setInternalValue] = useState(defaultValue);
  const checked = value !== undefined ? value : internalValue;

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const toggle = () => {
    if (disabled) return;

    const nextValue = !checked;
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);

    // Play animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }),
    ]).start();
  };

  // Animated scale for checkmark
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={toggle}
      hitSlop={hitSlop}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: checked, disabled: disabled }}
      style={[
        styles.container,
        { opacity: disabled ? 0.6 : 1 },
        containerStyle,
      ]}
    >
      {/* Checkbox Box */}
      <Animated.View
        style={[
          styles.box,
          {
            width: boxSize,
            height: boxSize,
            borderColor: checked ? theme.primary : theme.border,
            backgroundColor: checked ? theme.primary : theme.background,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {checked && (
          <AppIcon
            name={{
              type: 'vector',
              pack: 'feather',
              name: 'check',
            }}
            width={boxSize * 0.7}
            height={boxSize * 0.7}
            color={theme.background}
          />
        )}
      </Animated.View>

      {/* Content (Label + Description) */}
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
