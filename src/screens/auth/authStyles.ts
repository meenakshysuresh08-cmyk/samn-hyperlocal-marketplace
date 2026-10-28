import { StyleSheet } from 'react-native';

import { brand, fontFamily, spacing } from '../../theme/tokens';
import { normalize } from '../../components/AppText/sizes';

/** Auth flow design tokens (SAMN) — sourced from global brand tokens. */
export const authColors = {
  background: '#F5F9F8',
  inputFill: '#EDEDED',
  inputPlaceholder: '#9CA3AF',
  footerMuted: '#9CA3AF',
  footerLink: '#4B5563',
  decorRing: 'rgba(0, 95, 80, 0.14)',
  decorRingSoft: 'rgba(0, 95, 80, 0.08)',
};

export const authLayout = {
  horizontalPadding: spacing.xxl,
  logoTopMargin: spacing.xxl,
  sectionGap: spacing.xxl,
  fieldGap: spacing.lg,
  buttonHeight: 52,
  buttonRadius: 10,
  inputRadius: 10,
  inputHeight: 52,
};

export const authStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authColors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: authLayout.horizontalPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pageBody: {
    flexGrow: 1,
    width: '100%',
  },
  formCenter: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing.lg,
  },
  decorContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: authColors.decorRing,
  },
  topBar: {
    width: '100%',
    minHeight: 40,
    justifyContent: 'center',
  },
  logoHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    minHeight: 130,
    width: '100%',
  },
  logoDecorWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  logoDecorRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: authColors.decorRing,
    backgroundColor: authColors.decorRingSoft,
  },
  logo: {
    textAlign: 'center',
    color: brand.primary,
    fontFamily: fontFamily.extrabold,
    fontSize: normalize(28),
    letterSpacing: normalize(4),
    zIndex: 2,
  },
  headerBlock: {
    marginBottom: spacing.xxl,
  },
  headerBlockCentered: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    color: '#111827',
    marginBottom: spacing.sm,
  },
  titleCentered: {
    color: '#111827',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: normalize(22),
  },
  subtitleCentered: {
    color: '#6B7280',
    lineHeight: normalize(22),
    textAlign: 'center',
  },
  fieldLabel: {
    color: brand.primary,
    fontFamily: fontFamily.semibold,
    fontSize: normalize(13),
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  fieldLabelUpper: {
    color: '#4B5563',
    fontFamily: fontFamily.semibold,
    fontSize: normalize(11),
    letterSpacing: normalize(0.8),
    marginBottom: spacing.xs,
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  forgotLink: {
    color: brand.primary,
    fontFamily: fontFamily.medium,
    fontSize: normalize(13),
  },
  forgotLinkRow: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  inputWrapper: {
    backgroundColor: authColors.inputFill,
    borderWidth: 0,
    borderRadius: authLayout.inputRadius,
    height: authLayout.inputHeight,
  },
  inputText: {
    fontSize: normalize(15),
    fontFamily: fontFamily.regular,
  },
  fieldSpacing: {
    marginBottom: authLayout.fieldGap,
  },
  primaryButton: {
    width: '100%',
    marginTop: spacing.md,
    marginVertical: 0,
    borderRadius: authLayout.buttonRadius,
    borderWidth: 0,
    minHeight: authLayout.buttonHeight,
    paddingVertical: 14,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    color: authColors.footerMuted,
    fontFamily: fontFamily.regular,
    fontSize: normalize(14),
    textAlign: 'center',
  },
  footerLink: {
    color: authColors.footerLink,
    fontFamily: fontFamily.semibold,
  },
  footerLinkPrimary: {
    color: brand.primary,
    fontFamily: fontFamily.semibold,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  otpCell: {
    flex: 1,
    height: 56,
    borderRadius: authLayout.inputRadius,
    backgroundColor: authColors.inputFill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellFocused: {
    borderColor: brand.primary,
  },
  otpCellText: {
    fontSize: normalize(22),
    fontFamily: fontFamily.semibold,
    color: '#111827',
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendText: {
    color: authColors.footerMuted,
    fontSize: normalize(14),
  },
  resendLink: {
    color: brand.primary,
    fontFamily: fontFamily.semibold,
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0, 95, 80, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xxl,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: authLayout.horizontalPadding,
  },
  centeredHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
});
