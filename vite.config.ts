import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // The admin panel runs on :5174 — the storefront owns :5173 (see sonali-foshol-storefront).
    // This also matches SANCTUM_STATEFUL_DOMAINS on the API side.
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://192.168.0.108:8000',
        // `changeOrigin: true` rewrote the Host header to the API host, and with it the
        // Origin/Referer the browser sent. Sanctum only starts a session for requests whose
        // Origin is in SANCTUM_STATEFUL_DOMAINS, so a rewritten Origin turned the request into
        // a stateless one and the session was lost. Keeping the original origin lets Sanctum
        // see "http://localhost:5174" and attach the session.
        changeOrigin: false,
        secure: false,
      },
      '/sanctum': {
        target: 'http://192.168.0.108:8000',
        changeOrigin: false,
        secure: false,
      },
    },
  },
})
