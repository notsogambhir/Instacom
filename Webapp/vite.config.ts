import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // @ts-ignore
  plugins: [react()],
  optimizeDeps: {
    exclude: ['socket.io-client']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  }
})
