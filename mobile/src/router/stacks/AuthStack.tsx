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
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in' }} />
      <Stack.Screen
        name="ForceChangePassword"
        component={ForceChangePasswordScreen}
        options={{ title: 'Update password', headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
