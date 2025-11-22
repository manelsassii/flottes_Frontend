// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agilfleet.driver',        // CHANGE ÇA SI TU VEUX
  appName: 'Agil Fleet Driver',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      // CES 3 LIGNES SONT LA CLÉ MAGIQUE
      permissions: ['camera', 'photos'],
      android: {
        allowMixedContent: true
      }
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    // Pour iOS (si tu veux plus tard)
    backgroundColor: '#ffffff'
  }
};

export default config;