import { StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/themes';

export const createAppCheckboxStyles = (theme: AppTheme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },

    labelContainer: {
      flex: 1,
      marginStart: 10,
    },

    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: isRTL ? 'right' : 'left',
    },

    description: {
      fontSize: 12,
      marginTop: 2,
      color: theme.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
    },

    box: {
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderRadius: 6,
    },
  });
