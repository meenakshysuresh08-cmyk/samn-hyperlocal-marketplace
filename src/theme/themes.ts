/**
 * Design tokens aligned with Figma variable semantics.
 * Brand, typography, and header values are sourced from tokens.ts — edit tokens once.
 */

import { brand, gradients, overlays } from './tokens';

export type StatusBadgeColors = {
  text: string;
  bg: string;
  border: string;
};

export type StatusBadgeMap = Record<string, StatusBadgeColors>;

export const commonBadges: Record<string, StatusBadgeColors> = {
  success: { text: '#067647', bg: '#ECFDF3', border: '#ABEFC6' },
  error: { text: '#B42318', bg: '#FEF3F2', border: '#FECDCA' },
  warning: { text: '#B54708', bg: '#FFFAEB', border: '#FEDF89' },
  info: { text: '#026AA2', bg: '#F0F9FF', border: '#B9E6FE' },
  primary: { text: brand.primary, bg: '#ECFDF8', border: '#99F6E4' },
  secondary: { text: '#363F72', bg: '#F8F9FC', border: '#D5D9EB' },
  purple: { text: '#5925DC', bg: '#F4F3FF', border: '#D9D6FE' },
  pink: { text: '#C11574', bg: '#FDF2FA', border: '#FCCEEE' },
  gray: { text: '#717680', bg: '#F5F5F5', border: '#E9EAEB' },
  rose: { text: '#B42318', bg: '#FDF2FA', border: '#FCCEEE' },
};

export const LightTheme = {
  // ── Background ──────────────────────────────────────────────────────────
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8F9FA',
  bgTertiary: '#F5F5F5',
  bgMuted: '#D5D9EB',
  bgOverlay: 'rgba(0, 0, 0, 0.05)',

  // ── Surface (cards, inputs, chips, elevated panels) ─────────────────────
  surfacePrimary: '#FFFFFF',
  surfaceSecondary: '#F8F9FC',
  surfaceTertiary: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  surfaceDropdown: '#FFFFFF',
  surfaceBrand: brand.primaryDark,
  surfaceBrandMuted: brand.primaryMuted,

  // ── Text ────────────────────────────────────────────────────────────────
  textPrimary: '#181D27',
  textSecondary: '#414651',
  textTertiary: '#535862',
  textQuaternary: '#717680',
  textDisabled: '#717680',
  textBrandPrimary: brand.primaryDark,
  textBrandSecondary: brand.primary,
  textOnBrand: brand.onPrimary,
  textInverse: '#FFFFFF',
  textError: '#B42318',
  textPlaceholder: '#717680',
  textMuted: '#535862',

  // ── Border ──────────────────────────────────────────────────────────────
  borderPrimary: '#E2E8F0',
  borderSecondary: '#E9EAEB',
  borderSubtle: 'rgba(15, 23, 42, 0.1)',
  borderBrand: '#99F6E4',
  borderBrandStrong: brand.primaryDark,
  borderOnBrand: overlays.borderOnBrand,

  // ── Shadow ──────────────────────────────────────────────────────────────
  shadowColor: '#0A0D12',
  shadowColorAlt: '#101828',
  shadowOpacityMd: 0.1,
  shadowOpacitySm: 0.06,
  shadowOpacityLg: 0.12,
  shadowOpacityHeader: 0.08,

  // ── Brand & accent ──────────────────────────────────────────────────────
  primary: brand.primary,
  primaryLight: brand.primaryLight,
  primaryDark: brand.primaryDark,
  secondary: '#0F172A',
  secondaryDark: '#020617',
  success: '#067647',
  warning: '#B54708',
  error: '#B42318',
  info: '#026AA2',

  // ── Interactive states ──────────────────────────────────────────────────
  primaryBgSubtle: overlays.primaryBgSubtle,
  primaryBorderSubtle: overlays.primaryBorderSubtle,
  errorBgSubtle: 'rgba(180, 35, 24, 0.06)',
  errorBorderSubtle: 'rgba(180, 35, 24, 0.25)',
  disabled: '#E2E8F0',
  disabledText: '#717680',
  focus: brand.primary,
  highlight: overlays.primaryHighlight,

  // ── Gradients ───────────────────────────────────────────────────────────
  gradientHeader: [...gradients.headerLight],
  gradientAuthButton: [...gradients.authButton],
  gradientAccent: [...gradients.accent],
  gradientScanFab: [...gradients.scanFab],
  gradientPrimary: ['#0F172A', '#020617'],
  accentGradient: [brand.primary, brand.primaryLight],
  primaryGradient: ['#0F172A', '#020617'],

  // ── Header (gradient bar) ───────────────────────────────────────────────
  headerText: brand.onPrimary,
  headerTextMuted: brand.onPrimaryMuted,
  headerActionBg: overlays.headerActionBg,
  headerActionBgPressed: overlays.headerActionBgPressed,
  headerStatusBar: brand.primaryDark,

  // ── Tab bar (bottom navigation) ─────────────────────────────────────────
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E9EAEB',
  tabBarShadowColor: '#000000',
  tabBarShadowOpacity: 0.25,
  tabBarItemActive: brand.primary,
  tabBarItemInactive: '#414651',
  tabBarScanShadowOpacity: 0.1,

  // ── Effects ─────────────────────────────────────────────────────────────
  backdrop: 'rgba(0, 0, 0, 0.5)',

  // ── Status bar ──────────────────────────────────────────────────────────
  statusBar: '#FFFFFF',
  statusBarStyle: 'dark-content' as
    | 'dark-content'
    | 'light-content'
    | 'default',

  // ── Status indicator dots (asset list) ──────────────────────────────────
  statusDotActiveOuter: '#99F6E0',
  statusDotActiveInner: '#15B79E',
  statusDotActiveText: '#134E48',
  statusDotInactiveOuter: '#FECDD6',
  statusDotInactiveInner: '#F63D68',
  auditHierarchyStepInactive: '#ABB7C2',

  // ── Status badges (semantic palettes) ─────────────────────────────────
  badgeColors: commonBadges,

  // ── Domain-specific (audit stats, etc.) ─────────────────────────────────
  statMatched: brand.primaryLight,
  statMissing: '#B42318',
  statUnexpected: '#B54708',

  // ── Legacy aliases (prefer semantic tokens above in new code) ───────────
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  overlay: 'rgba(0, 0, 0, 0.05)',
  surface: '#F1F5F9',
  surfaceHover: '#CBD5E1',
  border: '#E2E8F0',
  divider: '#E9EAEB',
  card: '#FFFFFF',
  text: '#181D27',
  shadow: 'rgba(10, 13, 18, 0.1)',
  headerGradient: [...gradients.headerLight],
};

export const DarkTheme: AppTheme = {
  // ── Background ──────────────────────────────────────────────────────────
  bgPrimary: '#0D0D0D',
  bgSecondary: '#1A1A1A',
  bgTertiary: '#141414',
  bgMuted: '#1D2440',
  bgOverlay: 'rgba(0, 0, 0, 0.7)',

  // ── Surface ─────────────────────────────────────────────────────────────
  surfacePrimary: '#1A1A1A',
  surfaceSecondary: '#262626',
  surfaceTertiary: '#1A1A1A',
  surfaceElevated: '#1C2333',
  surfaceDropdown: '#1C2333',
  surfaceBrand: brand.primaryDark,
  surfaceBrandMuted: '#1A5C52',

  // ── Text ────────────────────────────────────────────────────────────────
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textQuaternary: '#475569',
  textDisabled: '#475569',
  textBrandPrimary: brand.accentLight,
  textBrandSecondary: brand.accent,
  textOnBrand: brand.onPrimary,
  textInverse: '#0F172A',
  textError: '#FCA5A5',
  textPlaceholder: '#64748B',
  textMuted: '#64748B',

  // ── Border ──────────────────────────────────────────────────────────────
  borderPrimary: '#262626',
  borderSecondary: '#333333',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderBrand: 'rgba(94, 234, 212, 0.4)',
  borderBrandStrong: brand.accentLight,
  borderOnBrand: overlays.borderOnBrand,

  // ── Shadow ──────────────────────────────────────────────────────────────
  shadowColor: '#000000',
  shadowColorAlt: '#000000',
  shadowOpacityMd: 0.4,
  shadowOpacitySm: 0.25,
  shadowOpacityLg: 0.5,
  shadowOpacityHeader: 0.3,

  // ── Brand & accent ──────────────────────────────────────────────────────
  primary: brand.accentLight,
  primaryLight: '#99F6E4',
  primaryDark: brand.primary,
  secondary: '#888888',
  secondaryDark: '#666666',
  success: '#2DD4BF',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#22D3EE',

  // ── Interactive states ──────────────────────────────────────────────────
  primaryBgSubtle: 'rgba(94, 234, 212, 0.12)',
  primaryBorderSubtle: 'rgba(94, 234, 212, 0.4)',
  errorBgSubtle: 'rgba(248, 113, 113, 0.08)',
  errorBorderSubtle: 'rgba(248, 113, 113, 0.35)',
  disabled: '#1A1A1A',
  disabledText: '#444444',
  focus: '#5EEAD4',
  highlight: 'rgba(94, 234, 212, 0.2)',

  // ── Gradients ───────────────────────────────────────────────────────────
  gradientHeader: [...gradients.headerDark],
  gradientAuthButton: [...gradients.authButton],
  gradientAccent: [...gradients.accent],
  gradientScanFab: [...gradients.scanFab],
  gradientPrimary: ['#0D0D0D', '#1A1A1A'],
  accentGradient: [brand.primary, brand.accentLight],
  primaryGradient: ['#0D0D0D', '#1A1A1A'],

  // ── Header (gradient bar) ───────────────────────────────────────────────
  headerText: brand.onPrimary,
  headerTextMuted: brand.onPrimaryMuted,
  headerActionBg: overlays.headerActionBg,
  headerActionBgPressed: overlays.headerActionBgPressed,
  headerStatusBar: brand.primaryDark,

  // ── Tab bar (bottom navigation) ─────────────────────────────────────────
  tabBarBg: '#1A1A1A',
  tabBarBorder: '#333333',
  tabBarShadowColor: '#000000',
  tabBarShadowOpacity: 0.4,
  tabBarItemActive: brand.accentLight,
  tabBarItemInactive: '#94A3B8',
  tabBarScanShadowOpacity: 0.35,

  // ── Effects ─────────────────────────────────────────────────────────────
  backdrop: 'rgba(0, 0, 0, 0.8)',

  // ── Status bar ──────────────────────────────────────────────────────────
  statusBar: '#0D0D0D',
  statusBarStyle: 'light-content' as
    | 'dark-content'
    | 'light-content'
    | 'default',

  // ── Status indicator dots ───────────────────────────────────────────────
  statusDotActiveOuter: '#99F6E0',
  statusDotActiveInner: '#15B79E',
  statusDotActiveText: '#134E48',
  statusDotInactiveOuter: '#FECDD6',
  statusDotInactiveInner: '#F63D68',
  auditHierarchyStepInactive: '#ABB7C2',

  // ── Status badges ───────────────────────────────────────────────────────
  badgeColors: commonBadges,

  // ── Domain-specific ─────────────────────────────────────────────────────
  statMatched: '#E2E8F0',
  statMissing: '#F87171',
  statUnexpected: '#FBBF24',

  // ── Legacy aliases ────────────────────────────────────────────────────────
  background: '#0D0D0D',
  backgroundSecondary: '#1A1A1A',
  overlay: 'rgba(0, 0, 0, 0.7)',
  surface: '#1A1A1A',
  surfaceHover: '#333333',
  border: '#262626',
  divider: '#1A1A1A',
  card: '#1A1A1A',
  text: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.5)',
  headerGradient: [...gradients.headerDark],
};

export type AppTheme = typeof LightTheme;
