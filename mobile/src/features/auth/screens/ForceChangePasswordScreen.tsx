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
import { Ionicons } from '@expo/vector-icons';

export function ForceChangePasswordScreen() {
  const { clearAuth } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Screen scroll contentStyle={styles.screen}>
      <Card style={styles.card}>
        <AppInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="••••••••"
          icon="key-outline"
        />
        <View style={{ height: theme.spacing.md }} />
        <AppInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="At least 8 characters"
          icon="lock-closed-outline"
        />
        <View style={{ height: theme.spacing.md }} />
        <AppInput
          label="Confirm New Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Re-enter new password"
          icon="checkmark-circle-outline"
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
            <AppText variant="caption" style={styles.error}>{error}</AppText>
          </View>
        ) : null}

        <View style={{ height: theme.spacing.xl }} />
        <AppButton
          title="Save and Continue"
          size="lg"
          loading={loading}
          onPress={async () => {
            setError(null);
            setLoading(true);
            try {
              if (!currentPassword || !newPassword) throw new Error('Enter current and new password.');
              if (newPassword !== confirm) throw new Error('New password and confirmation do not match.');
              await authApi.changePassword({ oldPassword: currentPassword, newPassword });
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
        <AppButton title="Sign Out Instead" variant="ghost" onPress={() => clearAuth()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  card: {
    ...theme.spacing.shadows.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.error + '08',
    borderRadius: theme.spacing.borderRadius.md,
  },
  error: {
    color: theme.colors.error,
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
});
