import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  TextStyle,
} from 'react-native';
import { theme } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    (disabled || isLoading) ? styles.disabled : null,
  ];

  const textStyle: TextStyle[] = [
    styles.textBase,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      style={[containerStyle, style]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.white} />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.spacing.borderRadius.md,
  },
  textBase: {
    fontWeight: theme.typography.weights.semiBold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  
  // Variants
  primaryContainer: {
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryContainer: {
    backgroundColor: theme.colors.secondary,
  },
  secondaryText: {
    color: theme.colors.white,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  dangerContainer: {
    backgroundColor: theme.colors.danger,
  },
  dangerText: {
    color: theme.colors.white,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: theme.colors.primary,
  },

  // Sizes
  smContainer: { paddingVertical: 8, paddingHorizontal: 16 },
  smText: { fontSize: theme.typography.sizes.sm },
  mdContainer: { paddingVertical: 12, paddingHorizontal: 20 },
  mdText: { fontSize: theme.typography.sizes.md },
  lgContainer: { paddingVertical: 16, paddingHorizontal: 24 },
  lgText: { fontSize: theme.typography.sizes.lg },
});
