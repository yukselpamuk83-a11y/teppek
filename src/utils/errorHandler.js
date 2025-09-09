// Enhanced Error Handler for Production Apps
import { logger } from './logger'

class ErrorHandler {
  constructor() {
    this.setupGlobalErrorHandling()
    this.errorCounts = new Map()
    this.maxRetries = 3
  }

  setupGlobalErrorHandling() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandled_promise_rejection'
      })
    })
  }

  handleError(error, context = {}) {
    const errorKey = `${error.name || 'Unknown'}_${error.message || 'No message'}`
    
    // Rate limiting: Don't spam the same error
    const currentCount = this.errorCounts.get(errorKey) || 0
    if (currentCount >= 5) {
      logger.debug('Error rate limited:', errorKey)
      return
    }
    this.errorCounts.set(errorKey, currentCount + 1)

    const errorInfo = {
      name: error.name || 'Unknown Error',
      message: error.message || 'No error message',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      logger.error('🚨 Application Error:', errorInfo)
    }

    // In production, you might want to send to error tracking service
    if (import.meta.env.PROD) {
      this.sendErrorToService(errorInfo)
    }

    return errorInfo
  }

  sendErrorToService(errorInfo) {
    // Placeholder for error tracking service (Sentry, LogRocket, etc.)
    logger.error('Production Error:', {
      error: errorInfo.name,
      message: errorInfo.message,
      url: errorInfo.url
    })
  }

  // Async operation with retry logic
  async withRetry(operation, retries = this.maxRetries, context = '') {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === retries) {
          this.handleError(error, {
            type: 'retry_exhausted',
            context,
            attempts: attempt
          })
          throw error
        }
        
        logger.warn(`Retry ${attempt}/${retries} failed for ${context}:`, error.message)
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        )
      }
    }
  }

  // API call wrapper with error handling
  async apiCall(url, options = {}) {
    return this.withRetry(async () => {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }
      
      return response.json()
    }, 2, `API call to ${url}`)
  }
}

export const errorHandler = new ErrorHandler()
export default errorHandler