import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'path'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcPath,
      '@/components': path.join(srcPath, 'components'),
      '@/features': path.join(srcPath, 'features'),
      '@/types': path.join(srcPath, 'types'),
      '@/assets': path.join(srcPath, 'assets'),
      '@/app': path.join(srcPath, 'app'),
    },
  },
})
