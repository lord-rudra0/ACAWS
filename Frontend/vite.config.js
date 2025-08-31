import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ai: ['@google/generative-ai', '@tensorflow/tfjs', 'brain.js'],
          charts: ['recharts'],
          utils: ['axios', 'framer-motion', 'lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@tensorflow/tfjs', 'face-api.js', 'brain.js']
  }
})