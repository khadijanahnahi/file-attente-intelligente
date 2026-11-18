import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// En développement, /api et /ws sont redirigés vers le backend Spring Boot (port 8080) :
// pas de problème de CORS, et SockJS/STOMP utilise la même origine que la page.
const BACKEND = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { global: 'globalThis' }, // requis par sockjs-client
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/ws': { target: BACKEND, changeOrigin: true, ws: true },
    },
  },
});
