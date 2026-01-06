import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Local src alias
      '@': path.resolve(__dirname, './src'),
      // Workspace package aliases
      '@dejavu/core': path.resolve(__dirname, '../../packages/core/src'),
      '@dejavu/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@dejavu/web3': path.resolve(__dirname, '../../packages/web3/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/polymarket': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/polymarket/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
