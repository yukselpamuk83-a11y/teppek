// Production-ready logger utility
// Conditional logging based on environment

const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

// Logger levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

// Current log level based on environment
const CURRENT_LOG_LEVEL = isDev ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR

class Logger {
  constructor(context = '') {
    this.context = context
  }

  /**
   * Format log message with context
   */
  _formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString().slice(11, 23) // HH:MM:SS.mmm
    const contextStr = this.context ? `[${this.context}]` : ''
    const levelStr = level.padEnd(5)
    
    if (isDev) {
      return [`${timestamp} ${levelStr} ${contextStr}`, message, ...args]
    }
    
    return [message, ...args]
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(...this._formatMessage('DEBUG', message, ...args))
    }
  }

  /**
   * Log info messages (only in development)
   */
  info(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.info(...this._formatMessage('INFO', message, ...args))
    }
  }

  /**
   * Log warnings (conditional based on environment)
   */
  warn(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(...this._formatMessage('WARN', message, ...args))
    }
  }

  /**
   * Log errors (always logged, even in production)
   */
  error(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(...this._formatMessage('ERROR', message, ...args))
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(childContext) {
    const newContext = this.context ? `${this.context}:${childContext}` : childContext
    return new Logger(newContext)
  }
}

// Create default logger instance
const logger = new Logger()

// Export both the class and a default instance
export { Logger }
export default logger

// Convenience functions for backward compatibility
export const log = {
  debug: (message, ...args) => logger.debug(message, ...args),
  info: (message, ...args) => logger.info(message, ...args),
  warn: (message, ...args) => logger.warn(message, ...args),
  error: (message, ...args) => logger.error(message, ...args)
}

// Development-only helper for enabling all logs
if (isDev) {
  window.__logger = logger
  window.__enableAllLogs = () => {
    console.log('🔧 All logging levels enabled for debugging')
  }
}