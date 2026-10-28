import { StyleSheet } from 'react-native';

import type { AppTheme } from '../../theme/themes';

export const createPhotoPickerStyles = (theme: AppTheme, isDark: boolean) => {
  const surface = isDark ? '#0F172A' : '#FFFFFF';
  const surfaceElevated = isDark ? '#1E293B' : '#F8FAFC';
  const border = isDark ? '#1E293B' : '#E2E8F0';
  const text = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const cancelBg = isDark ? '#1E293B' : '#F1F5F9';
  const cancelText = isDark ? '#F8FAFC' : '#0F172A';
  const accent = theme.primary;
  const accentSoft = isDark ? 'rgba(59,130,246,0.16)' : 'rgba(37,99,235,0.10)';

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(2, 6, 23, 0.55)',
      justifyContent: 'flex-end',
    },
    sheetWrapper: {
      width: '100%',
    },
    sheet: {
      width: '100%',
      backgroundColor: surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 10,
      paddingHorizontal: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: isDark ? 0.45 : 0.12,
      shadowRadius: 16,
      elevation: 24,
    },
    grabber: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: isDark ? '#334155' : '#CBD5E1',
      marginBottom: 14,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: text,
      textAlign: 'center',
      letterSpacing: 0.1,
    },
    subtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      color: textMuted,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 18,
      paddingHorizontal: 8,
    },
    optionsRow: {
      flexDirection: 'row',
      columnGap: 12,
      marginTop: 4,
    },
    option: {
      flex: 1,
      minHeight: 116,
      backgroundColor: surfaceElevated,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: border,
    },
    optionIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: text,
    },
    optionHint: {
      fontSize: 11,
      color: textMuted,
      marginTop: 2,
      textAlign: 'center',
    },
    cancelBtn: {
      marginTop: 18,
      backgroundColor: cancelBg,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '700',
      color: cancelText,
      letterSpacing: 0.1,
    },
    accent: { color: accent },
  });
};
