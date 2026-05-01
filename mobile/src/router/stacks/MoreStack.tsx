import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../types/navigation';
import { MoreScreen } from '../../features/more/screens/MoreScreen';
import { RewardsScreen } from '../../features/rewards/screens/RewardsScreen';
import { MessagesScreen } from '../../features/messages/screens/MessagesScreen';
import { UsersScreen } from '../../features/users/screens/UsersScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { PurchasesScreen } from '../../features/purchases/screens/PurchasesScreen';
import { theme } from '../../theme';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="MoreHome" component={MoreScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Reward Tiers' }} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Staff Users' }} />
      <Stack.Screen name="Purchases" component={PurchasesScreen} options={{ title: 'Purchases' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

