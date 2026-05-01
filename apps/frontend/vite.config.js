import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/storage': 'http://localhost:3000',
      '/DATA': 'http://localhost:3000',
    },
  },
  optimizeDeps: {
    include: ['leaflet', 'leaflet.markercluster'],
  },
});
