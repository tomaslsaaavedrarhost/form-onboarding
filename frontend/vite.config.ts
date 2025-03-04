import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    hmr: {
      overlay: true,
      timeout: 1000,
      clientPort: 3000,
      host: 'localhost',
    },
    watch: {
      usePolling: true,
      interval: 50,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  }
}) 