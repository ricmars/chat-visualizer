import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Plugin to make TinyMCE available globally for icon modules
const tinymcePlugin = () => {
  return {
    name: 'tinymce-global',
    transform(code, id) {
      // Inject global tinymce reference for icon modules
      if (id.includes('tinymce/icons') && (id.endsWith('.js') || id.includes('icons.js'))) {
        // Prepend a global tinymce declaration for CommonJS icon modules
        const globalDecl = `var tinymce = (typeof window !== 'undefined' && window.tinymce) || (typeof global !== 'undefined' && global.tinymce) || (typeof self !== 'undefined' && self.tinymce) || (function() { try { return require('tinymce'); } catch(e) { return {}; } })();\n`
        if (!code.includes('var tinymce') && !code.includes('const tinymce') && !code.includes('let tinymce')) {
          return globalDecl + code
        }
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tinymcePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['tinymce'],
  },
  define: {
    'process.env': {},
  },
  build: {
    commonjsOptions: {
      include: [/tinymce/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
})

