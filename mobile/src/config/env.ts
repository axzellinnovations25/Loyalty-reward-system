import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: string;
};

export const env = {
  apiBaseUrl: (Constants.expoConfig?.extra as ExpoExtra | undefined)?.apiBaseUrl ?? '',
} as const;

