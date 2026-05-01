import { Text } from 'react-native';
import { Screen } from '../../../components/Screen';
import { theme } from '../../../theme';

export function RewardsScreen() {
  return (
    <Screen>
      <Text
        style={{
          fontSize: theme.typography.sizes.xl,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text,
        }}
      >
        Rewards
      </Text>
    </Screen>
  );
}

