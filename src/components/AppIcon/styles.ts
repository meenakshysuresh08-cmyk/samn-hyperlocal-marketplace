import { StyleSheet } from 'react-native';

export const iconSizes = {
  sm: 16,
  md: 22,
  lg: 28,
  xl: 36,
  xxl: 80,
  logo: 100,
};

export const AppIconStyles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
});
