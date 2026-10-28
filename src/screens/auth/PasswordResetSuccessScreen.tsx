import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';

export const PasswordResetSuccessScreen = () => {
  const navigation = useNavigation<any>();

  const goToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon Badge */}
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.logoBadge}
        >
          <Text style={styles.logoIcon}>✓</Text>
        </LinearGradient>

        <Text style={styles.title}>Password Reset Complete</Text>
        <Text style={styles.subtitle}>
          Your password has been updated successfully. You can now sign in to your SAMN account with your new password.
        </Text>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={goToLogin}
        >
          <LinearGradient
            colors={[colors.brandPrimary, colors.accentIndigo]}
            style={styles.gradientBtn}
          >
            <Text style={styles.submitBtnText}>Sign In Now ➔</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 38,
    color: '#fff',
    fontWeight: fontWeights.black,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing['2xl'],
  },
  submitBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
  },
});
