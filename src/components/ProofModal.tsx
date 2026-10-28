import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing } from '../theme/tokens';
import { AppIcon } from './AppIcon';
import { useTaskStore, TaskItem } from '../services/taskStore';

interface ProofModalProps {
  visible: boolean;
  onClose: () => void;
  task: TaskItem;
  onSuccess?: () => void;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  visible,
  onClose,
  task,
  onSuccess,
}) => {
  const { submitProof } = useTaskStore();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 4) {
      Alert.alert('Invalid Passcode', 'Please enter the 4-digit completion passcode provided by the customer.');
      return;
    }

    setLoading(true);
    const res = await submitProof(task._id, { otp: otp.trim() } as any);
    setLoading(false);

    if (res.success) {
      Alert.alert('Task Completed! 🎉', 'Customer OTP successfully verified. Payment and rating release initiated.', [
        {
          text: 'OK',
          onPress: () => {
            setOtp('');
            if (onSuccess) onSuccess();
            onClose();
          },
        },
      ]);
    } else {
      Alert.alert('Verification Failed ❌', res.message || 'Incorrect passcode. Please ask the customer for their active completion code.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <AppIcon name="lock" width={22} height={22} color="#10b981" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Customer Completion Passcode</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit secure OTP provided by <Text style={styles.boldName}>{task.customerId?.name || 'Customer'}</Text> to verify and finalize this task.
          </Text>

          {/* OTP Input */}
          <View style={styles.otpBox}>
            <TextInput
              style={styles.otpInput}
              placeholder="• • • •"
              placeholderTextColor={colors.textTertiary}
              value={otp}
              onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
            />
          </View>

          {/* Security Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🛡️ <Text style={styles.infoBold}>Touchless Instant Release:</Text> Direct OTP verification validates genuine task fulfillment without violating personal privacy.
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.verifyBtn, (loading || otp.length !== 4) && styles.verifyBtnDisabled]}
            onPress={handleSubmitOtp}
            disabled={loading || otp.length !== 4}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify OTP & Complete Task</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  boldName: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },
  otpBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 220,
    height: 60,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    color: '#fff',
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.black,
    textAlign: 'center',
    letterSpacing: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: spacing.xl,
  },
  infoText: {
    color: '#c7d2fe',
    fontSize: 11,
    lineHeight: 16,
  },
  infoBold: {
    fontWeight: fontWeights.bold,
    color: '#fff',
  },
  verifyBtn: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  verifyBtnDisabled: {
    opacity: 0.5,
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
  },
  cancelBtnText: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
});
