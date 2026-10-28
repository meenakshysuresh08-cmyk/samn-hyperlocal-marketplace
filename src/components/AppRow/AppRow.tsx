import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';

import React from 'react';
import { createRowStyles } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';

type AlignPreset = 'left' | 'right' | 'center' | 'between';

export interface AppRowProps {
  children?: React.ReactNode;
  align?: AlignPreset;
  divider?: boolean;
  pressable?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const AppRow: React.FC<AppRowProps> = ({
  children,
  align = 'between',
  divider = false,
  pressable = false,
  style,
  onPress,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
  
  const styles = createRowStyles(theme, isRTL);

  const Container = pressable ? TouchableOpacity : View;

  return (
    <>
      <Container
        style={[
          styles.row,
          align === 'between' && styles.between,
          align === 'center' && styles.center,
          align === 'left' && styles.left,
          align === 'right' && styles.right,
          style,
        ]}
        onPress={onPress}
        disabled={!pressable}
      >
        {children}
      </Container>

      {divider && <View style={styles.divider} />}
    </>
  );
};
