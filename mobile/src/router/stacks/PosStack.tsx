import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PurchasesStackParamList } from '../../types/navigation';
import { PosScreen } from '../../features/pos/screens/PosScreen';
import { theme } from '../../theme';

const Stack = createNativeStackNavigator<PurchasesStackParamList>();

export function PosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="NewPurchase" component={PosScreen} options={{ title: 'POS' }} />
    </Stack.Navigator>
  );
}

