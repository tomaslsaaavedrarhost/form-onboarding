import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/form-onboarding/',
  server: {
    port: 3000,
    strictPort: true,
    open: true
  }
}) 