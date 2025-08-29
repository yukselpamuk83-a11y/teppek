import React from 'react'

/**
 * Animated loading spinner component
 */
export function LoadingSpinner({ size = 'md', className = '', color = 'blue' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600'
  }

  return (
    <div 
      className={`
        animate-spin rounded-full border-2 border-gray-300 
        ${colorClasses[color]} 
        ${sizeClasses[size]} 
        ${className}
      `} 
      style={{ borderTopColor: 'transparent' }}
      role="status"
      aria-label="Loading"
    />
  )
}

/**
 * Button with integrated loading state
 */
export function LoadingButton({ 
  loading = false, 
  disabled = false,
  children, 
  className = '',
  loadingText = 'Yükleniyor...',
  ...props 
}) {
  const isDisabled = loading || disabled

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        flex items-center justify-center gap-2 transition-all duration-200
        ${isDisabled ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}
        ${className}
      `}
    >
      {loading && <LoadingSpinner size="sm" color="white" />}
      {loading ? loadingText : children}
    </button>
  )
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({ 
  lines = 3, 
  className = '',
  animate = true 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`
            h-4 bg-gray-200 rounded 
            ${animate ? 'animate-pulse' : ''}
            ${i === lines - 1 ? 'w-3/4' : 'w-full'}
          `}
        />
      ))}
    </div>
  )
}

/**
 * Card skeleton for job listings
 */
export function JobCardSkeleton({ count = 1, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Full page loading overlay
 */
export function LoadingOverlay({ visible = false, message = 'Yükleniyor...' }) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-xl">
        <LoadingSpinner size="lg" />
        <span className="text-lg font-medium text-gray-700">{message}</span>
      </div>
    </div>
  )
}

/**
 * Inline loading state for sections
 */
export function InlineLoader({ 
  loading = false, 
  children, 
  fallback = null,
  className = ''
}) {
  if (loading) {
    return fallback || (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return children
}