import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const ProtectedRoute = ({ 
  children, 
  fallback = null, 
  requireAuth = true,
  redirectTo = null 
}) => {
  const { user, loading, initializing } = useAuth()

  // Show loading spinner while auth is initializing
  if (initializing || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // If we require auth but user is not authenticated
  if (requireAuth && !user) {
    if (redirectTo) {
      window.location.href = redirectTo
      return null
    }

    if (fallback) {
      return fallback
    }

    // Default fallback - show login prompt
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Giriş Gerekli
            </h2>
            <p className="text-gray-600">
              Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full"
          >
            Ana Sayfaya Git
          </button>
        </div>
      </div>
    )
  }

  // If we don't require auth but user is authenticated (rare case)
  if (!requireAuth && user && redirectTo) {
    window.location.href = redirectTo
    return null
  }

  // Render children if auth requirements are met
  return children
}

// Higher-order component for protecting components
export const withAuthProtection = (WrappedComponent, options = {}) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for conditional rendering based on auth
export const useAuthGuard = () => {
  const { user, loading, initializing } = useAuth()
  
  return {
    isAuthenticated: !!user,
    isLoading: loading || initializing,
    user,
    canAccess: (requireAuth = true) => {
      if (loading || initializing) return false
      return requireAuth ? !!user : true
    }
  }
}

export default ProtectedRoute