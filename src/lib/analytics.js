// DENEYSEL PROJE - Vercel Analytics Integration
// Mevcut canlı sitenizde zaten çalışan analytics'e benzer yapı

import logger from '../utils/logger.js'

// Development mode için analytics mock
export const analytics = {
  track: (event, properties = {}) => {
    if (import.meta.env.DEV) {
      logger.debug('📊 Analytics Event [DEV]:', event, properties)
      return
    }
    
    // Production'da gerçek Vercel Analytics çalışacak
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', event, properties)
    }
  },

  // Özel event'ler
  events: {
    pageView: (page) => {
      analytics.track('page_view', { page })
    },
    
    jobSearch: (query, filters) => {
      analytics.track('job_search', { query, filters })
    },
    
    jobClick: (jobId, source) => {
      analytics.track('job_click', { job_id: jobId, source })
    },
    
    authAction: (action, userType) => {
      analytics.track('auth_action', { action, user_type: userType })
    },
    
    mapInteraction: (action, location) => {
      analytics.track('map_interaction', { action, location })
    },
    
    filterUsage: (filterType, value) => {
      analytics.track('filter_usage', { filter_type: filterType, value })
    }
  }
}

// Speed Insights için helper
export const speedInsights = {
  // Performans metrikleri takip et
  measurePageLoad: () => {
    if (typeof window !== 'undefined') {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        const loadTime = endTime - startTime
        
        analytics.track('page_load_time', { 
          load_time: Math.round(loadTime),
          page: window.location.pathname 
        })
      }
    }
  },
  
  // Büyük veri yüklenme süreleri
  measureDataLoad: (dataType) => {
    const startTime = performance.now()
    
    return (itemCount) => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      analytics.track('data_load_time', {
        data_type: dataType,
        load_time: Math.round(loadTime),
        item_count: itemCount
      })
    }
  }
}

// Global speedInsights fallback to prevent errors
if (typeof window !== 'undefined' && !window.speedInsights) {
  window.speedInsights = speedInsights
}

// Analytics kuruldu