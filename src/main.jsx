import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ModernApp from './ModernApp.jsx'
import { queryClient } from './lib/queryClient.js'
import { ErrorBoundary } from './components/ui/ErrorAlert.jsx'
import './styles/index.css'
import './styles/popups.css'

// Environment indicator
console.log(`🚀 Teppek Modern ${import.meta.env.PROD ? 'Production' : 'Development'} Mode`)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ModernApp />
        {/* Show React Query DevTools only in development */}
        {!import.meta.env.PROD && (
          <ReactQueryDevtools 
            initialIsOpen={false} 
            position="bottom-right"
          />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)