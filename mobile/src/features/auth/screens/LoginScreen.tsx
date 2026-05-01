import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../hooks/useAuth';
import { theme } from '../../../theme';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen>
      <Text style={styles.title}>Shop Login</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="Email"
        placeholderTextColor={theme.colors.textDim}
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={theme.colors.textDim}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title="Sign in"
        color={theme.colors.primary}
        onPress={async () => {
          setError(null);
          try {
            if (!email || !password) throw new Error('Enter email and password.');
            // TODO: replace with real API call
            await signIn('dev-token');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign in failed');
          }
        }}
      />
      <View style={{ height: theme.spacing.itemGap }} />
      <Text style={styles.note}>This app is for shop-side users (non-admin).</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
  },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    fontSize: theme.typography.sizes.sm,
  },
  note: {
    color: theme.colors.textDim,
    fontSize: theme.typography.sizes.sm,
  },
});

