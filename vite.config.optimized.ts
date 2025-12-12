import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      esbuild: {
        drop: ['console', 'debugger'],
      },
      build: {
        // 优化构建输出
        minify: 'esbuild',
        // 代码分割
        rollupOptions: {
          output: {
            manualChunks: {
              // 将第三方库拆分为单独的chunk
              'react-vendor': ['react', 'react-dom'],
              'framer-motion': ['framer-motion'],
              'lucide-react': ['lucide-react'],
              'google-genai': ['@google/genai'],
            },
          },
        },
        // 启用sourcemap（可选，用于调试）
        sourcemap: false,
      },
    };
});