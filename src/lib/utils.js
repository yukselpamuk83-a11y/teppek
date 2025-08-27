// DENEYSEL PROJE - Modern UI Utilities
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Toast notifications utility - now powered by real toast store
import { toast as toastStore } from '../stores/toastStore'

export const toast = toastStore

// Format utilities
export const formatters = {
  date: (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },
  
  currency: (amount, currency = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  },
  
  distance: (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${Math.round(distance)}km`
  }
}

// Validation utilities
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  password: (password) => {
    return password.length >= 6
  },
  
  required: (value) => {
    return value && value.toString().trim().length > 0
  }
}