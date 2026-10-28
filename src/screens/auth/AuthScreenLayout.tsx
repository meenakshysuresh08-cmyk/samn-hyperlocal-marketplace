import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, AppView, KeyboardAvoiding } from '../../components';
import { authColors, authStyles } from './authStyles';

type AuthScreenLayoutProps = {
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  footer?: React.ReactNode;
  scrollable?: boolean;
  centered?: boolean;
  /** Vertically centers the main form block between top and footer. */
  centerForm?: boolean;
};

export const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({
  children,
  showBack = false,
  onBack,
  footer,
  scrollable = true,
  centered = false,
  centerForm = true,
}) => {
  const formBlock = (
    <AppView
      style={
        centered
          ? authStyles.successContent
          : centerForm
            ? authStyles.formCenter
            : authStyles.flex
      }
    >
      {children}
    </AppView>
  );

  const body = (
    <AppView style={authStyles.pageBody}>
      {showBack && onBack ? (
        <AppView style={authStyles.topBar}>
          <Pressable
            onPress={onBack}
            style={authStyles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevronLeft" width={24} height={24} color={authColors.footerLink} />
          </Pressable>
        </AppView>
      ) : null}

      {formBlock}

      {footer ? <AppView style={authStyles.footer}>{footer}</AppView> : null}
    </AppView>
  );

  return (
    <SafeAreaView style={authStyles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoiding style={authStyles.flex}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={authStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          <AppView style={[authStyles.scrollContent, authStyles.flex]}>{body}</AppView>
        )}
      </KeyboardAvoiding>
    </SafeAreaView>
  );
};
