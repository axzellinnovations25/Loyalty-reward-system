import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PurchasesStackParamList } from '../../types/navigation';
import { NewPurchaseScreen } from '../../features/purchases/screens/NewPurchaseScreen';
import { theme } from '../../theme';

const Stack = createNativeStackNavigator<PurchasesStackParamList>();

export function PosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="NewPurchase" component={NewPurchaseScreen} options={{ title: 'Record Purchase' }} />
    </Stack.Navigator>
  );
}

