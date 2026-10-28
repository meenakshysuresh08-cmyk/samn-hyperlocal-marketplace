/**
 * Global design tokens — single source of truth for brand, typography, spacing, and header.
 * Update values here to propagate across the app (themes, headers, text presets, components).
 */

// ── Brand ─────────────────────────────────────────────────────────────────────

export const brand = {
  primary: '#005F50',
  primaryLight: '#007A68',
  primaryDark: '#004A3F',
  primaryMuted: '#1A8A7A',
  accent: '#1EC3B1',
  accentLight: '#5EEAD4',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: 'rgba(255, 255, 255, 0.85)',
};

// ── Typography — font families ────────────────────────────────────────────────

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
  ar_regular: 'NotoSansArabic-Regular',
  ar_bold: 'NotoSansArabic-Bold',
} as const;

// ── Semantic Color Tokens ───────────────────────────────────────────────────
export const colors = {
  bgCanvas: '#0f172a',
  bgCard: '#1e293b',
  bgSurface: '#1e293b',
  bgElevated: '#334155',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  brandPrimary: '#6366f1',
  accentIndigo: '#4f46e5',
  accentAmber: '#f59e0b',
  accentEmerald: '#10b981',
};

// ── Font Sizes & Weights ───────────────────────────────────────────────────
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
} as const;

// ── Typography — scale (base px before responsive normalize) ─────────────────

export const typography = {
  displayLarge: { fontSize: 24, lineHeight: 28.8, letterSpacing: -0.48, fontFamily: fontFamily.extrabold },
  displayMedium: { fontSize: 22, lineHeight: 26.4, letterSpacing: -0.44, fontFamily: fontFamily.bold },
  displaySmall: { fontSize: 18, lineHeight: 21.6, letterSpacing: -0.36, fontFamily: fontFamily.bold },
  heading1: { fontSize: 18, lineHeight: 25, letterSpacing: -0.36, fontFamily: fontFamily.bold },
  heading2: { fontSize: 16, lineHeight: 22, letterSpacing: -0.32, fontFamily: fontFamily.semibold },
  heading3: { fontSize: 14, lineHeight: 20, letterSpacing: -0.28, fontFamily: fontFamily.semibold },
  bodyLarge: { fontSize: 14, lineHeight: 22.4, letterSpacing: 0, fontFamily: fontFamily.regular },
  body: { fontSize: 12, lineHeight: 16.8, letterSpacing: 0, fontFamily: fontFamily.regular },
  bodySmall: { fontSize: 10, lineHeight: 14, letterSpacing: 0, fontFamily: fontFamily.regular },
  label: { fontSize: 14, lineHeight: 19.6, letterSpacing: 0.7, fontFamily: fontFamily.medium },
  button: { fontSize: 14, lineHeight: 21, letterSpacing: 0.7, fontFamily: fontFamily.medium },
  caption: { fontSize: 12, lineHeight: 18, letterSpacing: 0, fontFamily: fontFamily.regular },
  overline: { fontSize: 10, lineHeight: 15, letterSpacing: 0.5, fontFamily: fontFamily.medium },
  /** Dashboard / gradient header greeting */
  headerGreeting: { fontSize: 20, lineHeight: 26, letterSpacing: -0.4, fontFamily: fontFamily.bold },
  /** Gradient header subtitle */
  headerSubtitle: { fontSize: 13, lineHeight: 18, letterSpacing: 0, fontFamily: fontFamily.regular },
  /** Standard gradient header title */
  headerTitle: { fontSize: 18, lineHeight: 24, letterSpacing: -0.36, fontFamily: fontFamily.semibold },
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

// ── Header layout ─────────────────────────────────────────────────────────────

export const header = {
  borderRadius: 16,
  contentPaddingHorizontal: spacing.lg,
  contentPaddingBottom: spacing.lg,
  minTopInset: 10,
  dashboardTopPadding: 12,
  iconButtonSize: 44,
  iconButtonRadius: 12,
  iconSize: 22,
  rowMarginBottom: 16,
  titleSideMargin: 16,
  subtitleOpacity: 0.85,
} as const;

// ── Gradients ─────────────────────────────────────────────────────────────────

export const gradients = {
  headerLight: [brand.primaryDark, brand.primary],
  headerDark: ['#003D34', brand.primaryDark],
  accent: [brand.primary, brand.accent],
  scanFab: [brand.primary, brand.accent],
  authButton: [brand.primary, brand.accent],
};

// ── Semantic overlays (header action pills on gradient) ───────────────────────

export const overlays = {
  headerActionBg: 'rgba(255, 255, 255, 0.18)',
  headerActionBgPressed: 'rgba(255, 255, 255, 0.28)',
  borderOnBrand: 'rgba(255, 255, 255, 0.2)',
  primaryBgSubtle: 'rgba(0, 95, 80, 0.07)',
  primaryBorderSubtle: 'rgba(0, 95, 80, 0.25)',
  primaryHighlight: 'rgba(0, 95, 80, 0.1)',
};
