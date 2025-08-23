import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

// Vercel Toolbar (dev ve preview ortamlarında aktif)
const VercelToolbar = React.lazy(() => 
  import('@vercel/toolbar/react').then(module => ({ default: module.VercelToolbar }))
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <SpeedInsights />
    <Analytics />
    {/* Toolbar sadece development/preview'da görünür */}
    <React.Suspense fallback={null}>
      <VercelToolbar />
    </React.Suspense>
  </React.StrictMode>,
)