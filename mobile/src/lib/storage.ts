import AsyncStorage from '@react-native-async-storage/async-storage';

const keys = {
  authToken: 'auth_token',
} as const;

export async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem(keys.authToken);
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(keys.authToken, token);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(keys.authToken);
}

