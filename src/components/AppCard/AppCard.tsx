import {
  Animated,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import React, { useRef } from 'react';
import { createCardStyles } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';

export interface AppCardProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  direction?: 'row' | 'column';
  pressable?: boolean;
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  header,
  footer,
  direction = 'column',
  pressable = false,
  divider = false,
  style,
  onPress,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
  
  const styles = createCardStyles(theme, isRTL);
  const animatedValueRef = useRef(new Animated.Value(1));

  const handlePressIn = () =>
    Animated.timing(animatedValueRef.current, {
      toValue: 0.97,
      duration: 90,
      useNativeDriver: true,
    }).start();

  const handlePressOut = () =>
    Animated.timing(animatedValueRef.current, {
      toValue: 1,
      duration: 90,
      useNativeDriver: true,
    }).start();

  const Container = pressable ? TouchableOpacity : View;

  return (
    <Animated.View style={{ transform: [{ scale: animatedValueRef.current }] }}>
      <Container
        {...(pressable
          ? {
              activeOpacity: 0.9,
              onPress,
              onPressIn: handlePressIn,
              onPressOut: handlePressOut,
            }
          : {})}
        style={[
          styles.base,
          direction === 'row' ? styles.row : styles.column,
          style,
        ]}
      >
        {header ? <View style={styles.header}>{header}</View> : null}

        {divider && header ? <View style={styles.divider} /> : null}

        {children}

        {divider && footer ? <View style={styles.divider} /> : null}

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Container>
    </Animated.View>
  );
};
