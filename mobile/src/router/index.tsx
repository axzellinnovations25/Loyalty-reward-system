import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import type { RootStackParamList } from '../types/navigation';
import { AuthStack } from './stacks/AuthStack';
import { MainTabs } from './tabs/MainTabs';
import { Screen } from '../components/Screen';
import { ActivityIndicator } from 'react-native';
import { theme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isReady, token, user } = useAuth();

  if (!isReady) {
    return (
      <Screen>
        <ActivityIndicator color={theme.colors.primary} />
      </Screen>
    );
  }

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          user?.forcePasswordChange ? (
            <Stack.Screen name="Auth">{() => <AuthStack initialRouteName="ForceChangePassword" />}</Stack.Screen>
          ) : (
            <Stack.Screen name="Main" component={MainTabs} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
