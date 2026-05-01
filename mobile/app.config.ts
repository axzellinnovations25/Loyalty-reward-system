import 'dotenv/config';

import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Shop App',
  slug: 'shop-app',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  splash: {
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: { supportsTablet: true },
  android: ({
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ffffff' },
    // Allow http://192.168.x.x calls in development (Android 9+ blocks cleartext by default)
    usesCleartextTraffic: true,
  } as any),
  web: { favicon: './assets/favicon.png' },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  },
};

export default config;
