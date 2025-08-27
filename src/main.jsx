import React from 'react'
import ReactDOM from 'react-dom/client'
import ModernApp from './ModernApp.jsx'
import './styles/index.css'

// Environment indicator
console.log(`🚀 Teppek Modern ${import.meta.env.PROD ? 'Production' : 'Development'} Mode`)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModernApp />
  </React.StrictMode>,
)