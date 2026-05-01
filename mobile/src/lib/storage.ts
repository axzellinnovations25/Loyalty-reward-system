import AsyncStorage from '@react-native-async-storage/async-storage';

const keys = {
  authToken: 'auth_token',
  authUser: 'auth_user',
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

export async function getAuthUserRaw(): Promise<string | null> {
  return await AsyncStorage.getItem(keys.authUser);
}

export async function setAuthUserRaw(userJson: string): Promise<void> {
  await AsyncStorage.setItem(keys.authUser, userJson);
}

export async function clearAuthUser(): Promise<void> {
  await AsyncStorage.removeItem(keys.authUser);
}
