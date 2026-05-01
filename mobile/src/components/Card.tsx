import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { theme } from '../theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  variant?: 'elevated' | 'outline' | 'flat' | 'glass' | 'primary';
}

export function Card({ children, style, onPress, variant = 'elevated', ...props }: CardProps) {
  const content = (
    <View
      {...props}
      style={[
        styles.base,
        styles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [
        { width: (style as any)?.width, flex: (style as any)?.flex },
        pressed && styles.pressed
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: theme.colors.surface,
    ...theme.spacing.shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  flat: {
    backgroundColor: theme.colors.backgroundSubtle,
  },
  glass: {
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...theme.spacing.shadows.lg,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.spacing.shadows.lg,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
