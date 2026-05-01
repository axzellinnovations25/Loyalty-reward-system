import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../types/navigation';
import { theme } from '../../theme';
import { DashboardStack } from '../stacks/DashboardStack';
import { CustomersStack } from '../stacks/CustomersStack';
import { PosStack } from '../stacks/PosStack';
import { GiftCardsStack } from '../stacks/GiftCardsStack';
import { MoreStack } from '../stacks/MoreStack';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tabs = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;

          if (route.name === 'DashboardTab') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'CustomersTab') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'PosTab') iconName = focused ? 'calculator' : 'calculator-outline';
          else if (route.name === 'GiftCardsTab') iconName = focused ? 'gift' : 'gift-outline';
          else iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          display: route.name === 'PosTab' ? 'none' : 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.03)',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          ...theme.spacing.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
        },
      })}
    >
      <Tabs.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="CustomersTab" component={CustomersStack} options={{ title: 'Clients' }} />
      <Tabs.Screen name="PosTab" component={PosStack} options={{ title: 'POS' }} />
      <Tabs.Screen name="GiftCardsTab" component={GiftCardsStack} options={{ title: 'Vouchers' }} />
      <Tabs.Screen name="MoreTab" component={MoreStack} options={{ title: 'Settings' }} />
    </Tabs.Navigator>
  );
}
