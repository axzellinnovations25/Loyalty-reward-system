import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../types/navigation';
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { CustomersScreen } from '../../features/customers/screens/CustomersScreen';
import { GiftCardsScreen } from '../../features/giftCards/screens/GiftCardsScreen';
import { MessagesScreen } from '../../features/messages/screens/MessagesScreen';
import { PurchasesScreen } from '../../features/purchases/screens/PurchasesScreen';
import { RewardsScreen } from '../../features/rewards/screens/RewardsScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';

const Tabs = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Customers" component={CustomersScreen} />
      <Tabs.Screen name="GiftCards" component={GiftCardsScreen} options={{ title: 'Gift Cards' }} />
      <Tabs.Screen name="Messages" component={MessagesScreen} />
      <Tabs.Screen name="Purchases" component={PurchasesScreen} />
      <Tabs.Screen name="Rewards" component={RewardsScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

