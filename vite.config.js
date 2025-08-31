import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    modulePreload: {
      // Sadece kritik modülleri preload et
      polyfill: false
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem birlikte olmalı
          'vendor': ['react', 'react-dom'],
          // Supabase ayrı
          'supabase': ['@supabase/supabase-js'],
          // UI kütüphaneleri ayrı
          'ui-libs': ['zustand'],
          // Leaflet ayrı chunk'ta
          'leaflet': ['leaflet', 'leaflet.markercluster']
        }
      }
    },
    chunkSizeWarningLimit: 500, // Daha küçük chunk'lar için
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
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
    include: ['react', 'react-dom', 'leaflet', 'leaflet.markercluster'],
    exclude: []
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
})