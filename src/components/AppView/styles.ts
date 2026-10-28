import { AppTheme } from '../../theme/themes';
import { StyleSheet } from 'react-native';

export const createViewStyles = (theme: AppTheme, isRTL: boolean) =>
  StyleSheet.create({
    base: {
      backgroundColor: 'transparent',
    },

    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },

    column: {
      flexDirection: isRTL ? 'column-reverse' : 'column',
    },

    elevated: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.card,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  });
