import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glass';
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
  const isPrimary = variant === 'primary';
  const isGlass = variant === 'glass';

  const Content = (
    <View style={styles.content}>
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.white} />
      ) : (
        <>
          {leftIcon}
          <Text style={[
            styles.textBase,
            styles[`${variant}Text`],
            styles[`${size}Text`],
          ]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || isLoading}
      style={[
        styles.base,
        styles[`${size}Container`],
        !isPrimary && !isGlass && styles[`${variant}Container`],
        (disabled || isLoading) ? styles.disabled : null,
        style,
      ]}
      {...props}
    >
      {isPrimary ? (
        <LinearGradient
          colors={theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : isGlass ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]} />
      ) : null}
      {Content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.spacing.borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textBase: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.6,
  },
  
  // Variants
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
    borderWidth: 2,
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
  glassText: {
    color: theme.colors.black,
  },

  // Sizes
  smContainer: { height: 40, paddingHorizontal: 16 },
  smText: { fontSize: 13 },
  mdContainer: { height: 52, paddingHorizontal: 24 },
  mdText: { fontSize: 15 },
  lgContainer: { height: 60, paddingHorizontal: 32 },
  lgText: { fontSize: 17 },
});
