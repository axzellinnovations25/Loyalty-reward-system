import { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { GradientView } from '../../../components/GradientView';
import { useAuth } from '../../../hooks/useAuth';
import { authApi } from '../../../api/auth';
import { theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

export function LoginScreen() {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({ username: email, password });
      const payload = (res as any).data ?? res;
      await setAuth(payload.user, payload.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen padded={false}>
      <GradientView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="storefront" size={56} color={theme.colors.white} />
              </View>
              <Text style={styles.title}>Shop Pro</Text>
              <Text style={styles.subtitle}>Loyalty Management System</Text>
            </View>

            <View style={styles.glassCard}>
              <Text style={styles.formTitle}>Staff Sign In</Text>
              
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@shop.com"
                style={styles.input}
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                error={error || undefined}
                style={styles.input}
              />

              <Button
                title="Continue"
                onPress={handleLogin}
                isLoading={isLoading}
                style={styles.button}
              />

              <Text style={styles.footerNote}>
                Contact your administrator if you&apos;ve lost access.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </GradientView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  glassCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: theme.spacing.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...theme.spacing.shadows.lg,
  },
  formTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  button: {
    marginTop: 10,
    ...theme.spacing.shadows.md,
  },
  footerNote: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.xs,
    marginTop: 24,
  },
});
