import React from 'react'
import ReactDOM from 'react-dom/client'
import ModernApp from './ModernApp.jsx'
import './styles/index.css'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

// Development mode indicator
console.log('🧪 Teppek Modern Development Mode - Canlı siteyi etkilemez')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModernApp />
    <SpeedInsights />
    <Analytics />
  </React.StrictMode>,
)