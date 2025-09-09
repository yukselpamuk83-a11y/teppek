import React, { createContext, useContext, useState } from 'react'

const LazyAuthContext = createContext({})

export const useLazyAuth = () => {
  const context = useContext(LazyAuthContext)
  if (!context) {
    throw new Error('useLazyAuth must be used within a LazyAuthProvider')
  }
  return context
}

export const LazyAuthProvider = ({ children }) => {
  const [authModule, setAuthModule] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  
  const loadAuth = async () => {
    if (authModule) return authModule
    
    setAuthLoading(true)
    try {
      const { AuthProvider, useAuth } = await import('./AuthContext')
      setAuthModule({ AuthProvider, useAuth })
      return { AuthProvider, useAuth }
    } catch (error) {
      console.error('Auth module loading failed:', error)
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  const value = {
    authModule,
    authLoading,
    loadAuth,
    isAuthLoaded: !!authModule
  }

  return (
    <LazyAuthContext.Provider value={value}>
      {children}
    </LazyAuthContext.Provider>
  )
}