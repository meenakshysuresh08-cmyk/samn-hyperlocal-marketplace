import { Animated, View, ViewProps } from 'react-native';

import React from 'react';
import { createViewStyles } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';

export type Direction = 'row' | 'column' | 'auto';

export interface AppViewProps extends ViewProps {
  direction?: Direction;
  elevated?: boolean;
  animated?: boolean;
}

export const AppView: React.FC<AppViewProps> = ({
  direction = 'auto',
  elevated = false,
  animated = false,
  style,
  children,
  ...rest
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
  
  const styles = createViewStyles(theme, isRTL);

  const directionStyle =
    direction === 'row'
      ? styles.row
      : direction === 'column'
      ? styles.column
      : null;

  const Comp = animated ? Animated.View : View;

  return (
    <Comp
      {...rest}
      style={[styles.base, directionStyle, elevated && styles.elevated, style]}
    >
      {children}
    </Comp>
  );
};
