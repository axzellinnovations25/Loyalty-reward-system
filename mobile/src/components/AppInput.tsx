import type { PropsWithChildren } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { theme } from '../theme';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';

export type AppInputProps = PropsWithChildren<
  TextInputProps & {
    label?: string;
    error?: string | null;
    icon?: keyof typeof Ionicons.glyphMap;
  }
>;

export function AppInput({ label, error, icon, style, ...props }: AppInputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="caption" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={[styles.inputContainer, !!error && styles.inputError]}>
        {icon ? (
          <Ionicons name={icon} size={20} color={theme.colors.textMuted} style={styles.icon} />
        ) : null}
        <TextInput
          {...props}
          placeholderTextColor={theme.colors.textLight}
          style={[styles.input, style]}
        />
      </View>
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
    gap: 6,
  },
  label: {
    marginLeft: 4,
    fontWeight: '600',
    color: theme.colors.text,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  icon: {
    marginLeft: theme.spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  error: {
    color: theme.colors.error,
    marginLeft: 4,
  },
});
