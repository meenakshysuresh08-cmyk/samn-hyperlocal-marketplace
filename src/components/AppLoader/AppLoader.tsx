import React from 'react';
import { ActivityIndicator, Modal } from 'react-native';
import { useLoaderStore } from '../../hooks/useLoaderStore';
import { useThemeStore } from '../../theme/useThemeStore';
import { useIsRTL } from '../../hooks/useIsRTL';
import { createAppLoaderStyles } from './styles';
import { AppView } from '../AppView';
import { AppText } from '../AppText';

export interface AppLoaderProps {
  /** Optional manual override for visibility */
  visible?: boolean;
  /** Optional label text */
  message?: string;
  /** Optional i18n key for the label */
  tx?: string;
  /** Render the loader inline without the full-screen Modal overlay */
  inline?: boolean;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  visible,
  message,
  tx,
  inline,
}) => {
  const storeIsLoading = useLoaderStore(s => s.isLoading);
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
    const styles = createAppLoaderStyles(theme, isRTL);

  const isLoading = visible ?? storeIsLoading;

  if (!isLoading) {
    return null;
  }

  const loaderContent = (
    <AppView
      style={[
        styles.loaderContainer,
        inline && {
          backgroundColor: 'transparent',
          padding: 0,
          shadowOpacity: 0,
          elevation: 0,
          minWidth: 0,
        },
      ]}
    >
      <ActivityIndicator
        size={inline ? 'small' : 'large'}
        color={theme.primary}
      />
      {(message || tx) && (
        <AppText
          tx={tx}
          text={message}
          style={[styles.message, inline && { marginTop: 8, fontSize: 13 }]}
        />
      )}
    </AppView>
  );

  if (inline) {
    return loaderContent;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isLoading}
      statusBarTranslucent
    >
      <AppView
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        pointerEvents="box-none"
      >
        {loaderContent}
      </AppView>
    </Modal>
  );
};
