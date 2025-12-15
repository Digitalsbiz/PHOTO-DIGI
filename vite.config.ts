import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Determine how env vars are handled. 
    // In local dev, we often use .env files. Vite exposes VITE_ prefixed vars.
    // However, the existing code uses process.env.API_KEY.
    // We can polyfill it or users should update code to import.meta.env.
    // For compatibility with the provided code structure:
    'process.env': process.env
  }
});