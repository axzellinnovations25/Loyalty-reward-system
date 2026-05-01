import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { theme } from '../theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  variant?: 'elevated' | 'outline' | 'flat';
}

export function Card({ children, style, onPress, variant = 'elevated', ...props }: CardProps) {
  const content = (
    <View
      {...props}
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'outline' && styles.outline,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
  },
  elevated: {
    ...theme.spacing.shadows.sm,
  },
  outline: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flat: {
    backgroundColor: theme.colors.background,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
});
