import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface GradientViewProps extends ViewProps {
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function GradientView({
  children,
  colors = theme.colors.primaryGradient,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  ...props
}: GradientViewProps) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.base, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
