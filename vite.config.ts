import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// This configuration fixes the "Blank Page" issue by passing the API_KEY
// from Vercel to your browser code.
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // This line replaces 'process.env.API_KEY' in your code with the actual key value during build
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY)
    },
    build: {
      outDir: 'dist',
    }
  };
});