import React from 'react'
import ReactDOM from 'react-dom/client'
import SimpleApp from './SimpleApp.jsx'
import './styles/index.css'

// Environment indicator
console.log(`🚀 Teppek Simple ${import.meta.env.PROD ? 'Production' : 'Development'} Mode`)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>,
)