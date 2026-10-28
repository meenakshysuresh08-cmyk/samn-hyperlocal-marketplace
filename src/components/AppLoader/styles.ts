import { StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/themes';

export const createAppLoaderStyles = (theme: AppTheme, isRTL: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    loaderContainer: {
      padding: 24,
      borderRadius: 16,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 12,
      minWidth: 100,
    },

    message: {
      marginTop: 16,
      color: theme.textPrimary,
      textAlign: isRTL ? 'right' : 'left',
      fontSize: 14,
      fontWeight: '600',
    },
  });
