import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const frontendPort = Number(process.env.FRONTEND_PORT || env.FRONTEND_PORT || env.VITE_PORT || 3000);
  const backendPort = process.env.PORT || env.PORT || 3001;
  const backendUrl = process.env.VITE_BACKEND_URL || env.VITE_BACKEND_URL || `http://127.0.0.1:${backendPort}`;

  return {
    server: {
      port: frontendPort,
      strictPort: true,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/audio': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/editor': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/blog': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/demucs-web': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
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
    }
  };
});
