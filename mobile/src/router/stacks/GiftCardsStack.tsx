import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GiftCardsStackParamList } from '../../types/navigation';
import { GiftCardsScreen } from '../../features/giftCards/screens/GiftCardsScreen';
import { ScanGiftCardScreen } from '../../features/giftCards/screens/ScanGiftCardScreen';
import { theme } from '../../theme';

const Stack = createNativeStackNavigator<GiftCardsStackParamList>();

export function GiftCardsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="GiftCardsHome" component={GiftCardsScreen} options={{ title: 'Gift Cards' }} />
      <Stack.Screen name="ScanGiftCard" component={ScanGiftCardScreen} options={{ title: 'Scan / Redeem' }} />
    </Stack.Navigator>
  );
}

