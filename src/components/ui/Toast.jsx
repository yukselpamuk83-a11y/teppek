// DENEYSEL PROJE - Toast Notification System
import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

// Toast types and their configurations
const toastConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-600'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-600'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-600'
  }
}

// Single Toast Component
function ToastItem({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  
  const config = toastConfig[toast.type] || toastConfig.info
  const Icon = config.icon

  useEffect(() => {
    // Enter animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto dismiss
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(toast.id)
    }, 300) // Animation duration
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 max-w-md',
        config.className,
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClassName)} />
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-medium mb-1">
            {toast.title}
          </h4>
        )}
        <p className="text-sm">
          {toast.message}
        </p>
      </div>

      <button
        onClick={handleClose}
        className={cn(
          'flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors',
          config.iconClassName
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[20000] space-y-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={removeToast}
        />
      ))}
    </div>
  )
}