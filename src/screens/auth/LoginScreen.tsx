import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../services/authStore';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }: any) {
  const { login, isLoading, error } = useAuthStore();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const res = await login({ emailOrPhone, password });
    if (res.success) {
      navigation.navigate('Main');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.brandPrimary, colors.accentIndigo]}
            style={styles.logoBadge}
          >
            <Text style={styles.logoText}>S</Text>
          </LinearGradient>
          <Text style={styles.title}>SAMN</Text>
          <Text style={styles.subtitle}>Someone Around Me Now</Text>
          <Text style={styles.tagline}>Help is just around you.</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>Email or Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com or 9876543210"
            placeholderTextColor={colors.textTertiary}
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
          />

          <View style={styles.passwordHeaderRow}>
            <Text style={styles.inputLabel}>Password</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.brandPrimary, colors.accentIndigo]}
              style={styles.gradientBtn}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account? <Text style={styles.registerHighlight}>Create One</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  scrollContent: {
    padding: spacing.xl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  title: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.brandPrimary,
    marginTop: spacing.xs,
  },
  tagline: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorBox: {
    padding: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#f87171',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  forgotPasswordText: {
    fontSize: fontSizes.xs,
    color: colors.brandPrimary,
    fontWeight: fontWeights.semibold,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    fontSize: fontSizes.sm,
  },
  loginButton: {
    marginTop: spacing.xl,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
  },
  registerLink: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  registerHighlight: {
    color: colors.brandPrimary,
    fontWeight: fontWeights.bold,
  },
});
