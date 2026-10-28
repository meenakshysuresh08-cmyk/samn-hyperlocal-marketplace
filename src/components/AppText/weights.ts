import { fontFamily as tokenFontFamily } from '../../theme/tokens';

/** @deprecated Import from `src/theme/tokens` — kept for backward compatibility. */
export const fontWeights = {
  normal: tokenFontFamily.regular,
  medium: tokenFontFamily.medium,
  semibold: tokenFontFamily.semibold,
  bold: tokenFontFamily.bold,
  extrabold: tokenFontFamily.extrabold,
  ar_normal: tokenFontFamily.ar_regular,
  ar_bold: tokenFontFamily.ar_bold,
} as const;

export type FontWeights = keyof typeof fontWeights;
