import { Animated, Pressable } from 'react-native';
import React, { useEffect, useRef } from 'react';

import { AppRadioButtonProps } from './types';
import { createRadioStyles } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';
import { AppView } from '../AppView';
import { AppText } from '../AppText';

export const AppRadioButton: React.FC<AppRadioButtonProps> = ({
  selected,
  label,
  description,
  onPress,
  disabled = false,
  containerStyle,
  labelStyle,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
    const styles = createRadioStyles(theme, isRTL);

  const fadeAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [selected, fadeAnim]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.optionContainer,
        { opacity: disabled ? 0.6 : 1 },
        containerStyle,
      ]}
    >
      <AppView
        style={[
          styles.outerCircle,
          {
            borderColor: selected ? theme.primary : theme.border,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.innerCircle,
            {
              backgroundColor: theme.primary,
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim }],
            },
          ]}
        />
      </AppView>

      <AppView style={styles.labelContainer}>
        <AppText style={[styles.label, labelStyle]}>{label}</AppText>

        {description && (
          <AppText style={styles.description}>{description}</AppText>
        )}
      </AppView>
    </Pressable>
  );
};
