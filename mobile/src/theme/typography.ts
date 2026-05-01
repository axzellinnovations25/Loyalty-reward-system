import { Platform } from 'react-native';

export const typography = {
  fonts: {
    primary: Platform.select({ ios: 'System', android: 'sans-serif' }),
    secondary: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  } as const,
};
