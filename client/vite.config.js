import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'monaco-editor/esm/vs/editor/editor.api.js': 'monaco-editor'
    }
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true
      }
    }
  }
})
