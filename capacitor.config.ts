import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifesciprep.app',
  appName: 'LifeSci Prep',
  webDir: 'out',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Web uses this:
      serverClientId: '1019446850266-en7328n3v3nc7v4ndhhk36a80hhk8gs5.apps.googleusercontent.com',
      // Android native plugin requires this:
      clientId: '1019446850266-en7328n3v3nc7v4ndhhk36a80hhk8gs5.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
