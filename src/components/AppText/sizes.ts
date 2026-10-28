import { Dimensions, PixelRatio, TextStyle } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Using a base width of 390px (iPhone 12/13/14) which maps perfectly to the user's provided ratios.
const BASE_WIDTH = 390;

export const normalize = (size: number) => {
  const newSize = size * (SCREEN_WIDTH / BASE_WIDTH);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const textSizes = {
  xxl: { fontSize: normalize(36) } satisfies TextStyle,
  xl: { fontSize: normalize(28) } satisfies TextStyle,
  lg: { fontSize: normalize(22) } satisfies TextStyle,
  md: { fontSize: normalize(18) } satisfies TextStyle,
  sm: { fontSize: normalize(16) } satisfies TextStyle,
  xs: { fontSize: normalize(14) } satisfies TextStyle,
  xxs: { fontSize: normalize(12) } satisfies TextStyle,

  // Specific responsive sizes requested by the user
  size40: normalize(40),
  size24: normalize(24),
  size22: normalize(22),
  size20: normalize(20),
  size18: normalize(18),
  size16: normalize(16),
  size14: normalize(14),
  size13: normalize(13),
  size12: normalize(12),
  size10: normalize(10),
};

export type TextSizes = keyof typeof textSizes;
