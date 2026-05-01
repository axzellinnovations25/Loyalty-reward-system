import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { theme } from '../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'danger';

export type AppButtonProps = PropsWithChildren<{
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: 'md' | 'lg';
  style?: ViewStyle;
}>;

export function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  style,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === 'lg' && styles.lg,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={stylesText[variant].color} /> : <AppText style={stylesText[variant]}>{title}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  lg: {
    height: 56,
    borderRadius: theme.spacing.borderRadius.lg,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  disabled: {
    opacity: 0.55,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
});

const stylesText: Record<Variant, { color: string; fontWeight: '600' }> = {
  primary: { color: theme.colors.white, fontWeight: '600' },
  secondary: { color: theme.colors.text, fontWeight: '600' },
  danger: { color: theme.colors.white, fontWeight: '600' },
};
