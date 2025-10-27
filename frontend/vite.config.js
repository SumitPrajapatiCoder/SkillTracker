// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react-swc';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': 'http://localhost:8080',
//     },
//     port: 5137,
//   },
//   build: {
//     outDir: 'dist',
//     chunkSizeWarningLimit: 3000,
//   },
// });

















import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { copyFileSync, existsSync } from 'fs';


function copyRedirects() {
  return {
    name: 'copy-redirects',
    closeBundle() {
      const src = 'public/_redirects';
      const dest = 'dist/_redirects';
      if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log('Copied _redirects file to dist/');
      } else {
        console.warn('_redirects file not found in public/');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyRedirects()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
    port: 5137,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 3000,
  },
});
