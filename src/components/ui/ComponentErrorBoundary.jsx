import React from 'react'
import { toast } from '../../stores/toastStore'

/**
 * Component-specific error boundary for graceful error handling
 * Shows a fallback UI instead of crashing the entire app
 */
export class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error(`Error in ${this.props.componentName}:`, error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Show toast notification for user
    if (this.props.showToast !== false) {
      const componentName = this.props.componentName || 'Component'
      toast.error(`${componentName} yüklenirken hata oluştu`, {
        duration: 7000
      })
    }

    // Send to analytics/error tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${this.props.componentName}: ${error.message}`,
        fatal: false
      })
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      // Default fallback UI
      return (
        <div className="border border-red-200 rounded-lg p-6 m-4 bg-red-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {this.props.componentName || 'Bu bölüm'} yüklenemedi
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Teknik bir sorun oluştu. Tekrar deneyebilir veya sayfayı yenileyebilirsiniz.
              </p>
              
              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-red-600">
                    Hata Detayları (Geliştirici)
                  </summary>
                  <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="mt-4 space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Tekrar Dene
                </button>
                
                {this.props.onError && (
                  <button
                    onClick={() => this.props.onError(this.state.error)}
                    className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    Sorunu Bildir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Async error boundary for handling async operations
 */
export function AsyncErrorBoundary({ children, fallback, onError }) {
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      setError(event.reason)
      
      if (onError) {
        onError(event.reason)
      }

      // Show toast notification
      toast.error('Beklenmeyen bir hata oluştu', {
        duration: 7000
      })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [onError])

  if (error) {
    if (fallback) {
      return fallback(error)
    }

    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50 m-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              İşlem tamamlanamadı
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Bir işlem sırasında hata oluştu. Lütfen tekrar deneyin.
            </p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}