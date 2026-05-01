import type { PropsWithChildren } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { theme } from '../theme';
import { AppText } from './AppText';

export type AppInputProps = PropsWithChildren<
  TextInputProps & {
    label?: string;
    error?: string | null;
  }
>;

export function AppInput({ label, error, style, ...props }: AppInputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="caption" dim style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, !!error && styles.inputError, style]}
      />
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    marginLeft: 2,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSubtle,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  error: {
    color: theme.colors.error,
  },
});
