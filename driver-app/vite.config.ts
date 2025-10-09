import { defineConfig } from 'vite';

export default defineConfig({
  logLevel: 'warn', // Réduit les warnings
  optimizeDeps: {
    exclude: ['@ionic/pwa-elements', '@stencil/core'],
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  build: {
    rollupOptions: {
      onwarn: (warning, warn) => {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return; // Ignore certains warnings
        warn(warning);
      }
    }
  }
});