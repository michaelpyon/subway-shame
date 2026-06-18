import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
  // `vite preview` serves the production build but needs the same /api proxy as
  // dev so the built app talks to the local API shim (scripts/local-api.mjs),
  // which serves real MTA data on port 5001.
  preview: {
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
})
