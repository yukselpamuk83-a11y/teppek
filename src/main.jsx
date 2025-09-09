import React from 'react'
import ReactDOM from 'react-dom/client'
import ModernApp from './ModernApp.jsx'
import { ErrorBoundary } from './components/ui/ErrorAlert.jsx'
import logger from './utils/logger.js'
import './utils/errorHandler' // Initialize global error handling
import './i18n'
import './styles/index.css'
import './styles/popups.css'

// Environment indicator
logger.info(`🚀 Teppek Modern ${import.meta.env.PROD ? 'Production' : 'Development'} Mode`)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ModernApp />
    </ErrorBoundary>
  </React.StrictMode>,
)