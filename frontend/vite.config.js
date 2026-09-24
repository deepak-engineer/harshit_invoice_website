import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/invoice_backend/api': {
        target: 'http://localhost/harshit_invoice_website',
        changeOrigin: true,
      },
      '/invoice_backend/uploads': {
        target: 'http://localhost/harshit_invoice_website',
        changeOrigin: true,
      }
    }
  }
})
