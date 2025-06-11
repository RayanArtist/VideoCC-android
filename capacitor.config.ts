import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.videocc.app',
  appName: 'Video CC',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['https://localhost/*'],
    cleartext: false
  },
  android: {
    buildOptions: {
      keystorePassword: '',
      keystoreAlias: '',
      keystoreAliasPassword: ''
    },
    webContentsDebuggingEnabled: false
  },
  ios: {
    scheme: 'Video CC'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    }
  }
};

export default config;
