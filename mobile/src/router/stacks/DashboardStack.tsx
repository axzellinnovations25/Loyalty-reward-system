import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from '../../types/navigation';
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { theme } from '../../theme';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    </Stack.Navigator>
  );
}

