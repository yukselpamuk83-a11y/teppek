import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          // Sadece Leaflet'ı ayır (çünkü CDN'den yükleniyor)
          leaflet: ['leaflet', 'leaflet.markercluster']
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Tek vendor chunk için
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    sourcemap: false,
    cssCodeSplit: true,
  },
  server: {
    port: 3000,
    open: true
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['leaflet']
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
})