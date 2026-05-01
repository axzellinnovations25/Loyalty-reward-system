import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} as const;

export type Theme = typeof theme;
export * from './colors';
export * from './radius';
export * from './shadows';
export * from './spacing';
export * from './typography';
