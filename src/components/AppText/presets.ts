import { ThemedStyle } from '../../theme/themeStyle.types';
import { typography } from '../../theme/tokens';

import { TextStyle } from 'react-native';
import { fontWeights } from './weights';
import { normalize } from './sizes';

const fromTypography = (
  token: (typeof typography)[keyof typeof typography],
  color?: (theme: { textPrimary: string; textSecondary: string; textMuted: string; error: string; textInverse: string; primary: string; headerText: string; headerTextMuted: string }) => string,
): ThemedStyle<TextStyle>[] => [
  theme => ({
    fontFamily: token.fontFamily,
    color: color ? color(theme) : theme.textPrimary,
    fontSize: normalize(token.fontSize),
    lineHeight: normalize(token.lineHeight),
    letterSpacing: normalize(token.letterSpacing),
  }),
];

const base: ThemedStyle<TextStyle> = theme => ({
  fontFamily: fontWeights.normal,
  color: theme.textPrimary,
});

export const textPresets = {
  default: [
    base,
    () => ({ fontSize: normalize(12), lineHeight: normalize(16.8) }),
  ],

  // Display Text
  displayLarge: fromTypography(typography.displayLarge),
  displayMedium: fromTypography(typography.displayMedium),
  displaySmall: fromTypography(typography.displaySmall),

  // Headings
  heading1: fromTypography(typography.heading1),
  heading2: fromTypography(typography.heading2),
  heading3: fromTypography(typography.heading3),

  // Body Text
  bodyLarge: fromTypography(typography.bodyLarge),
  body: fromTypography(typography.body),
  bodySmall: fromTypography(typography.bodySmall),

  // UI Text
  label: [
    ...fromTypography(typography.label, theme => theme.textSecondary),
  ],
  button: [
    ...fromTypography(typography.button, theme => theme.textInverse),
  ],
  caption: [
    ...fromTypography(typography.caption, theme => theme.textMuted),
  ],
  overline: [
    ...fromTypography(typography.overline, theme => theme.textSecondary),
    () => ({ textTransform: 'uppercase' as const }),
  ],

  // Gradient header typography
  headerGreeting: fromTypography(typography.headerGreeting, theme => theme.headerText),
  headerSubtitle: fromTypography(typography.headerSubtitle, theme => theme.headerTextMuted),
  headerTitle: fromTypography(typography.headerTitle, theme => theme.headerText),

  // Deprecated Keys (for compatibility)
  heading: [
    base,
    () => ({
      fontSize: normalize(18),
      fontFamily: fontWeights.bold,
      lineHeight: normalize(27),
      letterSpacing: normalize(-0.36),
    }),
  ],
  subheading: [
    base,
    () => ({
      fontSize: normalize(16),
      fontFamily: fontWeights.semibold,
      lineHeight: normalize(24),
      letterSpacing: normalize(-0.32),
    }),
  ],
  title: [
    base,
    () => ({
      fontSize: normalize(18),
      fontFamily: fontWeights.bold,
      lineHeight: normalize(27),
      letterSpacing: normalize(-0.36),
    }),
  ],
  small: [base, () => ({ fontSize: normalize(10), lineHeight: normalize(15) })],
  error: [
    base,
    (theme: any) => ({
      fontSize: normalize(12),
      lineHeight: normalize(18),
      color: theme.error,
    }),
  ],
  helper: [
    base,
    (theme: any) => ({
      fontSize: normalize(12),
      lineHeight: normalize(18),
      color: theme.textMuted,
    }),
  ],

  // Auth flow (login, forgot password, organisation select)
  authCardTitle: [
    base,
    (theme: any) => ({
      fontSize: normalize(20),
      fontFamily: fontWeights.bold,
      fontWeight: '700',
      lineHeight: normalize(26),
      color: theme.primary,
    }),
  ],
  authCardSubtitle: [
    base,
    (theme: any) => ({
      fontSize: normalize(14),
      fontFamily: fontWeights.normal,
      fontWeight: '400',
      lineHeight: normalize(20),
      color: theme.textSecondary,
    }),
  ],
  authEmailDisplay: [
    base,
    (theme: any) => ({
      fontSize: normalize(14),
      fontFamily: fontWeights.normal,
      fontWeight: '400',
      lineHeight: normalize(20),
      color: theme.textPrimary,
    }),
  ],
  authBodyText: [
    base,
    (theme: any) => ({
      fontSize: normalize(14),
      fontFamily: fontWeights.normal,
      fontWeight: '400',
      lineHeight: normalize(22),
      color: theme.textSecondary,
    }),
  ],
  authLink: [
    base,
    (theme: any) => ({
      fontSize: normalize(14),
      fontFamily: fontWeights.semibold,
      // fontWeight: '600',
      lineHeight: normalize(20),
      color: theme.primary,
    }),
  ],
  authLinkLarge: [
    base,
    (theme: any) => ({
      fontSize: normalize(18),
      fontFamily: fontWeights.semibold,
      fontWeight: '600',
      lineHeight: normalize(24),
      color: theme.primary,
    }),
  ],
  authProductName: [
    base,
    (theme: any) => ({
      fontSize: normalize(16),
      fontFamily: fontWeights.bold,
      fontWeight: '700',
      lineHeight: normalize(22),
      color: theme.secondary,
    }),
  ],
  authOrganisationName: [
    base,
    (theme: any) => ({
      fontSize: normalize(14),
      fontFamily: fontWeights.normal,
      fontWeight: '400',
      lineHeight: normalize(20),
      color: theme.textSecondary,
    }),
  ],
  authButtonLabel: [
    base,
    (theme: any) => ({
      fontSize: normalize(14),
      fontFamily: fontWeights.semibold,
      fontWeight: '600',
      lineHeight: normalize(24),
      color: theme.textInverse,
    }),
  ],
} as const;

export type TextPresets = keyof typeof textPresets;
