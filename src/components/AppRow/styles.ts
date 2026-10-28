import { AppTheme } from '../../theme/themes';
import { StyleSheet } from 'react-native';

export const createRowStyles = (theme: AppTheme, isRTL: boolean) =>
  StyleSheet.create({
    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },

    between: {
      justifyContent: 'space-between',
    },

    center: {
      justifyContent: 'center',
    },

    left: {
      justifyContent: isRTL ? 'flex-end' : 'flex-start',
    },

    right: {
      justifyContent: isRTL ? 'flex-start' : 'flex-end',
    },

    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 10,
    },
  });
