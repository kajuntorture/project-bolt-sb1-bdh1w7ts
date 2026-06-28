import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marinenavigator.app',
  appName: 'Marine Navigator',
  webDir: 'dist',
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: true,
  },
  plugins: {
    Geolocation: {
      permissions: ['location', 'locationAlways', 'locationWhenInUse'],
    },
  },
};

export default config;
