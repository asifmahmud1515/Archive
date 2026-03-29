import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.archive.neuralinterface',
  appName: 'Archive Neural Interface',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
