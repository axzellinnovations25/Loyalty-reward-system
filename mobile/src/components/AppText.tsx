import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { theme } from '../theme';

type Variant = 'title' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

export type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: Variant;
    dim?: boolean;
    color?: string;
  }
>;

export function AppText({ variant = 'body', dim = false, color, style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        dim && styles.dim,
        color ? { color } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.primary,
  },
  dim: {
    color: theme.colors.textMuted,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semiBold,
  },
  body: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.regular,
    lineHeight: 24,
  },
  caption: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.regular,
    lineHeight: 20,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textMuted,
  },
});

