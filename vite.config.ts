import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // 将所有通过 CDN 引入的库标记为 external
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
        'leaflet'
      ],
      output: {
        format: 'esm',
        manualChunks: undefined,
      },
    },
  },
});