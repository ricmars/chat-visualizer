import React from 'react'
import ReactDOM from 'react-dom/client'
// Import TinyMCE first to ensure it's available globally before other modules
import tinymce from 'tinymce'

// Make TinyMCE available globally for icon modules that expect it
if (typeof window !== 'undefined') {
  (window as any).tinymce = tinymce
}
// Also set on global for Node.js environments
if (typeof global !== 'undefined') {
  (global as any).tinymce = tinymce
}

import App from './App'
import './app/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

