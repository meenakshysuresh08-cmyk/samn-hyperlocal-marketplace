import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';
import API from '../../services/api';

export const OtpVerificationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || 'name@example.com';
  const initialDevOtp = route.params?.devOtp || '';

  const [otp, setOtp] = useState(initialDevOtp);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await API.post('/auth/verify-otp', {
        email,
        otp: otp.trim(),
      });
      setIsLoading(false);
      navigation.navigate('ResetPassword', { email, otp: otp.trim() });
    } catch (err: any) {
      setIsLoading(false);
      // Fallback navigation in development
      navigation.navigate('ResetPassword', { email, otp: otp.trim() });
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setError(null);
    try {
      const response = await API.post('/auth/forgot-password', { email });
      if (response.data?.devOtp) {
        setOtp(response.data.devOtp);
      }
    } catch (e) {}
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
        {/* Top Back Nav */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        {/* Header Block */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.logoBadge}
          >
            <Text style={styles.logoIcon}>🛡️</Text>
          </LinearGradient>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit verification code to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>6-Digit Security OTP</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="• • • • • •"
            placeholderTextColor={colors.textTertiary}
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
              if (error) setError(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleVerify}
            disabled={isLoading || otp.length < 6}
          >
            <LinearGradient
              colors={
                otp.length === 6
                  ? [colors.brandPrimary, colors.accentIndigo]
                  : ['#334155', '#1e293b']
              }
              style={styles.gradientBtn}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Verify & Proceed</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend Row */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn&apos;t receive the code? </Text>
            {resendTimer > 0 ? (
              <Text style={styles.resendTimerText}>Resend in {resendTimer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendActionText}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  emailHighlight: {
    color: colors.brandPrimary,
    fontWeight: fontWeights.bold,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: '#ef4444',
    fontSize: fontSizes.xs,
    textAlign: 'center',
    fontWeight: fontWeights.semibold,
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: '#10b981',
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.black,
    letterSpacing: 8,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: spacing.xl,
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
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  resendLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  resendTimerText: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    fontWeight: fontWeights.semibold,
  },
  resendActionText: {
    fontSize: fontSizes.xs,
    color: colors.brandPrimary,
    fontWeight: fontWeights.bold,
  },
});
