import {
  Animated,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
} from 'react-native';

import { AppText } from '../AppText';
import { AppIcon } from '../AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { buttonPresets } from './buttonPresets';
import { createButtonStyles } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';
import { TextPresets } from '../AppText/presets';

export interface AppButtonProps {
  tx?: string;
  text?: string;
  icon?: string;
  trailingIcon?: string;
  preset?: keyof typeof buttonPresets;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
  textColor?: string;
  isGradient?: boolean;
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  gradientLocations?: number[];
  compact?: boolean;
  labelStyle?: StyleProp<TextStyle>;
  textWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  iconWidth?: number;
  iconHeight?: number;
  labelPreset?: TextPresets;
}

export const AppButton: React.FC<AppButtonProps> = ({
  tx,
  text,
  icon,
  trailingIcon,
  preset = 'primary',
  onPress,
  style,
  disabled = false,
  textColor,
  isGradient,
  gradientColors,
  gradientStart,
  gradientEnd,
  gradientLocations,
  compact = false,
  labelStyle,
  textWeight,
  iconWidth,
  iconHeight,
  labelPreset,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
  
  const presetStyles = buttonPresets[preset](theme);
  const styles = createButtonStyles(theme, isRTL);
  const useGradient =
    typeof isGradient === 'boolean' ? isGradient : presetStyles.isGradient;
  const resolvedGradientColors =
    gradientColors ?? presetStyles.gradientColors ?? [];
  const resolvedGradientStart = gradientStart ?? presetStyles.start;
  const resolvedGradientEnd = gradientEnd ?? presetStyles.end;
  const resolvedGradientLocations =
    gradientLocations ?? presetStyles.gradientLocations;

  const animatedValueRef = useRef(new Animated.Value(1));

  const handlePressIn = () => {
    if (disabled) return;
    return Animated.timing(animatedValueRef.current, {
      toValue: 0.95,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    return Animated.timing(animatedValueRef.current, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: animatedValueRef.current }] }}>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          (preset === 'small' || compact) && styles.smallContainer,
          preset === 'inline' && styles.inlineContainer,
          useGradient
            ? {
                borderColor: 'transparent',
                backgroundColor: 'transparent',
                overflow: 'hidden',
              }
            : {
                backgroundColor: presetStyles.backgroundColor,
                borderColor: presetStyles.borderColor,
              },
          style,
        ]}
      >
        {useGradient ? (
          <LinearGradient
            pointerEvents="none"
            colors={resolvedGradientColors}
            start={resolvedGradientStart}
            end={resolvedGradientEnd}
            locations={resolvedGradientLocations}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}

        {icon ? (
          <AppIcon
            name={icon}
            {...(iconWidth || iconHeight
              ? { width: iconWidth, height: iconHeight, rtlFlip: false }
              : { size: 'sm' as const })}
            color={textColor ?? presetStyles.textColor}
            style={styles.icon}
          />
        ) : null}
        <AppText
          tx={tx}
          text={tx ? undefined : text}
          preset={labelPreset}
          weight={textWeight}
          style={[
            !labelPreset &&
              (preset === 'small' || compact
                ? styles.smallLabel
                : styles.label),
            { color: textColor ?? presetStyles.textColor },
            labelStyle,
          ]}
        />
        {trailingIcon ? (
          <AppIcon
            name={trailingIcon}
            {...(iconWidth || iconHeight
              ? { width: iconWidth, height: iconHeight }
              : { size: 'sm' as const })}
            color={textColor ?? presetStyles.textColor}
            style={styles.icon}
          />
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
};
