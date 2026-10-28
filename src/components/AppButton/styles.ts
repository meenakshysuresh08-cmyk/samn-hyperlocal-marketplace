import { AppTheme } from '../../theme/themes';
import { StyleSheet } from 'react-native';

export const createButtonStyles = (theme: AppTheme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1.2,
      marginVertical: 6,
    },
    gradientFill: {
      width: '100%',
      minHeight: '100%',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 10,
    },

    smallContainer: {
      paddingVertical: 8,
      borderRadius: 8,
    },

    inlineContainer: {
      paddingVertical: 4,
      paddingHorizontal: 2,
      borderRadius: 4,
    },

    label: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      paddingHorizontal: 8,
    },

    smallLabel: {
      fontSize: 14,
      fontWeight: '500',
      paddingHorizontal: 8,
    },

    icon: {
      fontSize: 18,
      marginHorizontal: 8,
    },

    rowTwoButtons: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      gap: 12,
    },

    buttonHalf: {
      flex: 1,
    },
  });
