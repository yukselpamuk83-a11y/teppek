import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'leaflet': ['leaflet', 'leaflet.markercluster'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    port: 3000
  }
})