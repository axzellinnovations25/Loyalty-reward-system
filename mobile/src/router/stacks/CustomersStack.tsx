import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CustomersStackParamList } from '../../types/navigation';
import { CustomersScreen } from '../../features/customers/screens/CustomersScreen';
import { CustomerDetailScreen } from '../../features/customers/screens/CustomerDetailScreen';
import { theme } from '../../theme';

const Stack = createNativeStackNavigator<CustomersStackParamList>();

export function CustomersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="CustomersHome" component={CustomersScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{ title: 'Customer' }} />
    </Stack.Navigator>
  );
}

