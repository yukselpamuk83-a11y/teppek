// DENEYSEL PROJE - Toast Store with Zustand
import { create } from 'zustand'
import logger from '../utils/logger.js'

let toastId = 0

export const useToastStore = create((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = ++toastId
    const newToast = {
      id,
      type: 'info',
      duration: 5000, // 5 seconds default
      ...toast
    }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    return id
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
  },
  
  clearToasts: () => {
    set({ toasts: [] })
  },
  
  // Convenience methods
  success: (message, options = {}) => {
    return get().addToast({ 
      type: 'success', 
      message,
      title: 'Success!',
      ...options 
    })
  },
  
  error: (message, options = {}) => {
    return get().addToast({ 
      type: 'error', 
      message,
      title: 'Error!',
      duration: 7000, // Errors stay longer
      ...options 
    })
  },
  
  warning: (message, options = {}) => {
    return get().addToast({ 
      type: 'warning', 
      message,
      title: 'Warning!',
      ...options 
    })
  },
  
  info: (message, options = {}) => {
    return get().addToast({ 
      type: 'info', 
      message,
      ...options 
    })
  }
}))

// Export convenience toast function for easy use
export const toast = {
  success: (message, options) => useToastStore.getState().success(message, options),
  error: (message, options) => useToastStore.getState().error(message, options),
  warning: (message, options) => useToastStore.getState().warning(message, options),
  info: (message, options) => useToastStore.getState().info(message, options),
}

logger.info('🧪 Modern Toast Store initialized')