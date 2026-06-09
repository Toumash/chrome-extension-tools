import { crx } from '../../plugin-testOptionsProvider'
import { defineConfig, type Plugin } from 'vite'
import manifest from './manifest.json'

const wildcardFullReloadPlugin = (): Plugin => ({
  name: 'test:wildcard-full-reload',
  apply: 'serve' as const,
  handleHotUpdate({ file, server }) {
    if (file.replace(/\\/g, '/').endsWith('/wildcard-full-reload.css')) {
      server.ws.send({
        type: 'full-reload',
        path: '*',
      })
    }
  },
})

export default defineConfig({
  build: { minify: false },
  clearScreen: false,
  logLevel: 'error',
  plugins: [crx({ manifest }), wildcardFullReloadPlugin()],
})
