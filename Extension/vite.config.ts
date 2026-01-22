import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync } from 'fs'

// Plugin to copy manifest and icons to dist
const copyExtensionAssets = () => {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      // Copy manifest
      copyFileSync('manifest.json', 'dist/manifest.json')
      console.log('✓ Copied manifest.json to dist/')

      // Copy icons from public to dist
      const icons = ['icon-16.png', 'icon-48.png', 'icon-128.png']
      icons.forEach(icon => {
        const src = `public/${icon}`
        const dest = `dist/${icon}`
        if (existsSync(src)) {
          copyFileSync(src, dest)
          console.log(`✓ Copied ${icon} to dist/`)
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  // @ts-ignore
  plugins: [react(), copyExtensionAssets()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: 'src/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: []
  }
})
