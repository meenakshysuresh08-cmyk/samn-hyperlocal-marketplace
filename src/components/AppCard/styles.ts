import { AppTheme } from '../../theme/themes';
import { StyleSheet } from 'react-native';

export const createCardStyles = (theme: AppTheme, isRTL: boolean) =>
  StyleSheet.create({
    base: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 10,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },

    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },

    column: {
      flexDirection: 'column',
    },

    header: {
      marginBottom: 12,
    },

    footer: {
      marginTop: 12,
    },

    divider: {
      height: 1,
      backgroundColor: theme.divider,
      marginVertical: 10,
      width: '100%',
    },
  });
