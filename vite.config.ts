import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into vendor chunks
          if (id.includes('node_modules')) {
            // React and React DOM
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            
            // Pega Cosmos (likely large)
            if (id.includes('@pega/cosmos-react-core')) {
              return 'vendor-cosmos'
            }
            
            // CodeMirror packages
            if (id.includes('@codemirror') || id.includes('@uiw/react-codemirror')) {
              return 'vendor-codemirror'
            }
            
            // React Markdown
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
              return 'vendor-markdown'
            }
            
            // Styled Components
            if (id.includes('styled-components')) {
              return 'vendor-styled'
            }
            
            // Other vendor libraries
            return 'vendor-other'
          }
        },
      },
    },
  },
})

