import { StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/themes';

export const createRadioStyles = (theme: AppTheme, isRTL: boolean) =>
  StyleSheet.create({
    groupContainer: {
      width: '100%',
    },

    optionContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },

    labelContainer: {
      flex: 1,
      marginStart: 12,
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

    outerCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },

    innerCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
  });
