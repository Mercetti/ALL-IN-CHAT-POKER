import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_BACKEND || 'http://localhost:3000';

  return {
    plugins: [react()],
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist/renderer',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/admin': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: proxyTarget,
        },
      },
    },
  };
});
