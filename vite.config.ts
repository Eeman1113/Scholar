import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/agents': path.resolve(__dirname, './src/agents'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          editor: ['@tiptap/react', '@tiptap/starter-kit'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3000,
  },
})
