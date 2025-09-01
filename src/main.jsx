import React from 'react'
import ReactDOM from 'react-dom/client'
import ModernApp from './ModernApp.jsx'
import { ErrorBoundary } from './components/ui/ErrorAlert.jsx'
import './i18n'
import './styles/index.css'
import './styles/popups.css'

// Environment indicator
console.log(`🚀 Teppek Modern ${import.meta.env.PROD ? 'Production' : 'Development'} Mode`)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ModernApp />
    </ErrorBoundary>
  </React.StrictMode>,
)