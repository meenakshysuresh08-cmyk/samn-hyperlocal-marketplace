import { StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/themes';

export const createAppSwitchStyles = (theme: AppTheme, isRTL: boolean) =>
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

    track: {
      borderRadius: 999,
      justifyContent: 'center',
      overflow: 'hidden',
    },

    thumb: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: '#fff', // Usually white for contrast
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
  });
