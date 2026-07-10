import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tmk4men.okusureminder',
  appName: 'おくすリマインダー',
  webDir: 'dist',
  android: {
    backgroundColor: '#faf3e3',
  },
  ios: {
    backgroundColor: '#faf3e3',
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#faf3e3',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#faf3e3',
      style: 'LIGHT',
      overlaysWebView: false,
    },
    LocalNotifications: {
      iconColor: '#34d399',
      smallIcon: 'ic_stat_icon',
    },
  },
}

export default config
