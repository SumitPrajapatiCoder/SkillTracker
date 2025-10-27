
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
    port: 5137,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) return 'chartjs';
            if (id.includes('highlight.js')) return 'highlightjs';
            if (id.includes('react')) return 'react';
            return 'vendor';
          }
        },
      },
    },
  },
});
