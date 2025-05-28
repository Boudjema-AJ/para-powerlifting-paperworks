import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginRaw from 'vite-plugin-raw'

export default defineConfig({
  plugins: [
    react(),
    vitePluginRaw({
      match: /\.pdf$/ // All .pdf files will be imported as raw strings
    })
  ],
  assetsInclude: ['**/*.pdf', '**/*.pdf?raw']
})