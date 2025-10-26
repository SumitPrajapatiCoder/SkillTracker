import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
    port: 3000,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 3000, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) return 'chartjs';
            if (id.includes('highlight.js')) return 'highlightjs';
            return 'vendor';
          }
        },
      },
    },
  },
});
