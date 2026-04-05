import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    proxy: {
      // ── Artifact Comparison backend (port 5000) ──────────────────────
      // Must be listed before the generic /api rule to take priority
      '/api/artifacts': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/compare': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },

      // ── Scenario Generation backend (port 5001) ──────────────────────
      '/api/scenarios': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/generate': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/scenario-status': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/model-status': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          konva: ['konva', 'react-konva'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
})
