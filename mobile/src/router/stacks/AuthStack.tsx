import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { ForceChangePasswordScreen } from '../../features/auth/screens/ForceChangePasswordScreen';
import { theme } from '../../theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack({ initialRouteName }: { initialRouteName?: keyof AuthStackParamList }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName ?? 'Login'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="ForceChangePassword"
        component={ForceChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}
