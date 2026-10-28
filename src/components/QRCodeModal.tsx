import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing } from '../theme/tokens';
import { AppIcon } from './AppIcon';
import { TaskItem } from '../services/taskStore';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  task: TaskItem;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  onClose,
  task,
}) => {
  const otp = task.completionOtp || '0000';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <AppIcon name="shield" width={20} height={20} color={colors.brandPrimary} />
              <Text style={styles.title}>Touchless QR Handshake</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Your helper can scan or read this 4-digit verification code to confirm task completion
          </Text>

          {/* Visual QR Simulator Card */}
          <View style={styles.qrContainer}>
            <View style={styles.qrBox}>
              {/* Decorative Corner Anchors */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              <View style={styles.qrGrid}>
                <Text style={styles.qrIcon}>📱</Text>
                <Text style={styles.qrTextSmall}>SAMN SECURE OTP</Text>
                <Text style={styles.qrOtpNumber}>{otp}</Text>
                <Text style={styles.qrTaskTitle} numberOfLines={1}>{task.title}</Text>
              </View>
            </View>
          </View>

          {/* 4-digit Large Badge */}
          <View style={styles.otpPill}>
            <Text style={styles.otpPillLabel}>VERIFICATION PASSCODE</Text>
            <Text style={styles.otpPillDigits}>{otp.split('').join('   ')}</Text>
          </View>

          <Text style={styles.helperNote}>
            💡 Share this only after the task is finished to release helper payment and rating.
          </Text>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close Passcode</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 16,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandPrimary,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    marginBottom: spacing.lg,
  },
  qrBox: {
    width: 200,
    height: 200,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: spacing.md,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.brandPrimary,
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3 },
  qrGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  qrTextSmall: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
  },
  qrOtpNumber: {
    color: '#fff',
    fontSize: 32,
    fontWeight: fontWeights.black,
    letterSpacing: 6,
    marginVertical: 4,
  },
  qrTaskTitle: {
    color: '#64748b',
    fontSize: 10,
    maxWidth: 160,
    textAlign: 'center',
  },
  otpPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  otpPillLabel: {
    color: colors.brandPrimary,
    fontSize: 9,
    fontWeight: fontWeights.black,
    letterSpacing: 1.5,
  },
  otpPillDigits: {
    color: '#fff',
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.black,
    marginTop: 2,
  },
  helperNote: {
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
});
