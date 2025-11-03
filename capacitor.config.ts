import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lwb.bible',     // bundle id (say the word if you want a different one)
  appName: 'LWB',             // app display name
  webDir: 'www',
  server: { iosScheme: 'https' } // keeps ATS happy
};
export default config;
