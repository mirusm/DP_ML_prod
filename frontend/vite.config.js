import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: "./",  // <-- Add this line

  plugins: [    tailwindcss(),
    react()],
    define: {
      'process.env': {}, // Fixes "process is not defined"
    },
    build: {
      outDir: "dist",
    },
    server: {
      proxy: {
      // Target is your backend API
        '/api': {
            target: process.env.VITE_API_URL || 'http://127.0.0.1:8000', // Default to local if not defined
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            
            configure: (proxy, options) => {
               proxy.on('error', (err, _req, _res) => {
                console.log('error', err);
               });
               proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Request sent to target:', req.method, req.url);
               });
               proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Response received from target:', proxyRes.statusCode, req.url);
               });
         },
      },
    },
  },
})
