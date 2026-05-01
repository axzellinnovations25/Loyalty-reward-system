import { Button, Text } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../hooks/useAuth';
import { theme } from '../../../theme';

export function DashboardScreen() {
  const { signOut } = useAuth();
  return (
    <Screen>
      <Text
        style={{
          fontSize: theme.typography.sizes.xl,
          fontWeight: theme.typography.weights.bold,
          marginBottom: theme.spacing.md,
          color: theme.colors.text,
        }}
      >
        Dashboard
      </Text>
      <Button title="Sign out" onPress={() => signOut()} color={theme.colors.danger} />
    </Screen>
  );
}

