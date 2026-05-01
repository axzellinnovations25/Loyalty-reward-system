import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../types/navigation';
import { theme } from '../../theme';
import { DashboardStack } from '../stacks/DashboardStack';
import { CustomersStack } from '../stacks/CustomersStack';
import { PosStack } from '../stacks/PosStack';
import { GiftCardsStack } from '../stacks/GiftCardsStack';
import { MoreStack } from '../stacks/MoreStack';
import { Platform } from 'react-native';

const Tabs = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: () => null,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 12,
          ...theme.spacing.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tabs.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Home' }} />
      <Tabs.Screen name="CustomersTab" component={CustomersStack} options={{ title: 'Clients' }} />
      <Tabs.Screen name="PosTab" component={PosStack} options={{ title: 'POS' }} />
      <Tabs.Screen name="GiftCardsTab" component={GiftCardsStack} options={{ title: 'Gifts' }} />
      <Tabs.Screen name="MoreTab" component={MoreStack} options={{ title: 'More' }} />
    </Tabs.Navigator>
  );
}
