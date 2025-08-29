import { useState, useCallback } from 'react'

/**
 * Custom hook for managing API call states
 * Provides loading, error, and success state management for async operations
 */
export function useApiState() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const execute = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const result = await apiCall()
      setSuccess(true)
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Bir hata oluştu'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setSuccess(false)
  }, [])

  const setErrorMessage = useCallback((message) => {
    setError(message)
  }, [])

  return {
    loading,
    error,
    success,
    execute,
    reset,
    setError: setErrorMessage
  }
}

/**
 * Hook for managing multiple API states (useful for forms with multiple async operations)
 */
export function useMultiApiState() {
  const [states, setStates] = useState({})

  const createState = useCallback((key) => {
    if (!states[key]) {
      setStates(prev => ({
        ...prev,
        [key]: {
          loading: false,
          error: null,
          success: false
        }
      }))
    }
  }, [states])

  const updateState = useCallback((key, updates) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates
      }
    }))
  }, [])

  const execute = useCallback(async (key, apiCall) => {
    createState(key)
    updateState(key, { loading: true, error: null, success: false })
    
    try {
      const result = await apiCall()
      updateState(key, { loading: false, success: true })
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Bir hata oluştu'
      updateState(key, { loading: false, error: errorMessage })
      throw err
    }
  }, [createState, updateState])

  const reset = useCallback((key) => {
    if (key) {
      updateState(key, { loading: false, error: null, success: false })
    } else {
      setStates({})
    }
  }, [updateState])

  return {
    states,
    execute,
    reset,
    createState
  }
}