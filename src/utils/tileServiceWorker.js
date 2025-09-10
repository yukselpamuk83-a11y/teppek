// Tile Service Worker Registration and Management
export class TileServiceWorker {
  constructor() {
    this.registered = false
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0
    }
  }

  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('🚫 Service Worker not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/tile-sw.js', {
        scope: '/'
      })

      console.log('✅ Tile Service Worker registered:', registration)
      this.registered = true

      // Handle updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Tile Service Worker update found')
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 New Tile Service Worker available')
              // Could show update notification to user
            }
          })
        }
      })

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'TILE_CACHE_STATS') {
          this.stats = { ...this.stats, ...event.data.data }
        }
      })

      return registration

    } catch (error) {
      console.error('❌ Tile Service Worker registration failed:', error)
      return false
    }
  }

  async getCacheStats() {
    if (!this.registered || !navigator.serviceWorker.controller) {
      return null
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      )
    })
  }

  async clearCache() {
    if (!this.registered) return false

    try {
      const cacheNames = await caches.keys()
      const tileCache = cacheNames.filter(name => name.startsWith('teppek-tiles-v'))
      
      await Promise.all(tileCache.map(name => caches.delete(name)))
      console.log('🧹 Tile cache cleared')
      return true
      
    } catch (error) {
      console.error('❌ Cache clear failed:', error)
      return false
    }
  }

  // Performance monitoring
  logTileRequest(url, fromCache = false) {
    this.stats.totalRequests++
    
    if (fromCache) {
      this.stats.cacheHits++
    } else {
      this.stats.cacheMisses++
    }

    // Log performance every 100 requests
    if (this.stats.totalRequests % 100 === 0) {
      const hitRate = ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(1)
      console.log(`📊 Tile Cache Performance: ${hitRate}% hit rate (${this.stats.totalRequests} requests)`)
    }
  }
}

// Singleton instance
export const tileServiceWorker = new TileServiceWorker()

// Auto-register on import
if (typeof window !== 'undefined') {
  tileServiceWorker.register()
}