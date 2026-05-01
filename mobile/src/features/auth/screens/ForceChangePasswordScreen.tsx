import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { authApi } from '../../../api/auth';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../hooks/useAuth';
import { theme } from '../../../theme';

export function ForceChangePasswordScreen() {
  const { clearAuth } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.header}>
        <AppText variant="h2">Update your password</AppText>
        <AppText dim>You must change your password before continuing.</AppText>
      </View>

      <Card>
        <AppInput
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <View style={{ height: theme.spacing.itemGap }} />
        <AppInput
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="At least 8 characters"
        />
        <View style={{ height: theme.spacing.itemGap }} />
        <AppInput
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Re-enter new password"
        />

        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <View style={{ height: theme.spacing.lg }} />
        <AppButton
          title="Save and continue"
          loading={loading}
          onPress={async () => {
              setError(null);
              setLoading(true);
              try {
                if (!currentPassword || !newPassword) throw new Error('Enter current and new password.');
                if (newPassword !== confirm) throw new Error('New password and confirmation do not match.');
                await authApi.changePassword({ oldPassword: currentPassword, newPassword });
                // Backend should clear forcePasswordChange on next /me refresh; simplest is to sign out and sign back in.
                await clearAuth();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Password update failed');
              } finally {
              setLoading(false);
            }
          }}
        />
      </Card>

      <View style={styles.footer}>
        <AppButton title="Sign out" variant="secondary" onPress={() => clearAuth()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  header: {
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  error: {
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.lg,
  },
});
