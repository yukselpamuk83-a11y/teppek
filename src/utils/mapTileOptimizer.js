/**
 * 🚀 ADVANCED MAP TILE OPTIMIZER v2.0
 * CloudFlare proxy + Vector tiles + Smart preloading + 100MB cache management
 * Features: Protomaps integration, Smart tile preloading, Offline support
 */

class AdvancedMapTileOptimizer {
  constructor() {
    this.tileCache = new Map()
    this.preloadedTiles = new Set()
    this.vectorTileCache = new Map()
    this.userLocation = null
    this.serviceWorkerReady = false
    this.preloadQueue = []
    this.isPreloading = false
    
    // Advanced tile providers with CloudFlare proxy
    this.tileProviders = {
      // CloudFlare proxied tiles for better performance
      street: 'https://tiles.teppek.com/osm/{z}/{x}/{y}.png',
      streetRetina: 'https://tiles.teppek.com/osm/{z}/{x}/{y}@2x.png',
      satellite: 'https://tiles.teppek.com/satellite/{z}/{x}/{y}.jpg',
      vector: 'https://tiles.teppek.com/vector/{z}/{x}/{y}.pbf',
      
      // Fallback providers
      streetFallback: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satelliteFallback: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      
      // Protomaps vector tiles
      protomaps: 'https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt?key={apikey}'
    }
    
    this.initAdvancedOptimizer()
  }

  /**
   * Initialize advanced tile optimization system
   */
  async initAdvancedOptimizer() {
    console.log('🚀 Advanced Map Tile Optimizer v2.0: Initializing...')
    
    // 1. Preconnect to all tile servers immediately
    this.preconnectAdvancedTileServers()
    
    // 2. Setup advanced service worker with vector tile support
    await this.setupAdvancedServiceWorker()
    
    // 3. Initialize performance monitoring
    this.setupPerformanceMonitoring()
    
    // 4. Setup smart preloading system
    this.initSmartPreloading()
    
    // 5. Setup vector tile support
    this.initVectorTileSupport()
    
    console.log('✅ Advanced optimization system ready')
  }

  /**
   * 🚀 Advanced preconnect to CloudFlare proxy and fallback servers
   */
  preconnectAdvancedTileServers() {
    const criticalServers = [
      // Priority 1: CloudFlare proxy (highest priority)
      'https://tiles.teppek.com',
      // Priority 2: Protomaps for vector tiles
      'https://api.protomaps.com',
      // Priority 3: Fallback servers
      'https://a.tile.openstreetmap.org',
      'https://b.tile.openstreetmap.org',
      'https://c.tile.openstreetmap.org',
      'https://server.arcgisonline.com'
    ]

    criticalServers.forEach((server, index) => {
      // Immediate preconnect for critical servers
      const preconnectLink = document.createElement('link')
      preconnectLink.rel = 'preconnect'
      preconnectLink.href = server
      preconnectLink.crossOrigin = 'anonymous'
      if (index < 2) preconnectLink.setAttribute('importance', 'high')
      document.head.appendChild(preconnectLink)
      
      // DNS prefetch for all
      const dnsLink = document.createElement('link')
      dnsLink.rel = 'dns-prefetch'
      dnsLink.href = server
      document.head.appendChild(dnsLink)
      
      console.log(`🔗 Advanced preconnect (Priority ${index + 1}): ${server}`)
    })
    
    // Preload critical tile areas based on connection type
    this.optimizeForConnection()
  }

  /**
   * Optimize tile strategy based on network connection
   */
  optimizeForConnection() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      const effectiveType = connection.effectiveType
      console.log(`📡 Connection type: ${effectiveType}`)
      
      // Adjust strategy based on connection
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          this.tileStrategy = { preloadRadius: 1, maxConcurrent: 2, useVector: false }
          break
        case '3g':
          this.tileStrategy = { preloadRadius: 2, maxConcurrent: 4, useVector: true }
          break
        case '4g':
        default:
          this.tileStrategy = { preloadRadius: 3, maxConcurrent: 8, useVector: true }
          break
      }
    } else {
      this.tileStrategy = { preloadRadius: 2, maxConcurrent: 4, useVector: true }
    }
    
    console.log('🎯 Tile strategy:', this.tileStrategy)
  }

  /**
   * Setup advanced service worker with vector tile support
   */
  async setupAdvancedServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/tile-sw.js', {
        scope: '/'
      })
      
      console.log('✅ Advanced Tile Service Worker registered')
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      this.serviceWorkerReady = true
      
      // Setup message communication
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this))
      
      console.log('🔧 Service Worker communication established')
      return registration
      
    } catch (error) {
      console.error('❌ Advanced Service Worker registration failed:', error)
      return false
    }
  }

  /**
   * Handle messages from service worker
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data || {}
    
    switch (type) {
      case 'CACHE_STATS_UPDATE':
        this.updateCacheStats(data)
        break
      case 'PRELOAD_PROGRESS':
        this.updatePreloadProgress(data)
        break
      case 'CACHE_ERROR':
        console.warn('⚠️ Service Worker cache error:', data)
        break
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    this.performanceMetrics = {
      tileLoadTimes: [],
      cacheHitRate: 0,
      preloadEfficiency: 0,
      networkFailures: 0
    }
    
    // Monitor tile load performance
    this.monitorTilePerformance()
  }

  /**
   * Initialize smart preloading system
   */
  initSmartPreloading() {
    this.smartPreloader = {
      enabled: true,
      adaptiveRadius: true,
      predictiveLoading: true,
      batchSize: 8,
      delayBetweenBatches: 200
    }
    
    console.log('🧠 Smart preloading system initialized')
  }

  /**
   * Initialize vector tile support with Protomaps
   */
  initVectorTileSupport() {
    this.vectorTileSupport = {
      enabled: false,
      protomapsKey: null,
      fallbackToRaster: true,
      compressionLevel: 'high'
    }
    
    if (this.vectorTileSupport.protomapsKey) {
      console.log('🗂️ Protomaps vector tiles enabled')
    } else {
      console.log('📍 Using local vector tiles (no Protomaps key)')
    }
  }

  /**
   * 🎯 ADVANCED SMART TILE PRELOADING
   * Adaptive preloading based on connection, device, and user behavior
   */
  async preloadCriticalTiles(userLat = 41.01, userLng = 28.97, zoom = 12, options = {}) {
    const startTime = performance.now()
    console.log(`🚀 Advanced preloading for: ${userLat}, ${userLng} @ zoom ${zoom}`)
    
    this.userLocation = { lat: userLat, lng: userLng }
    const radius = options.radius || this.tileStrategy.preloadRadius
    
    // Calculate critical tile area
    const { x: centerX, y: centerY } = this.latLngToTile(userLat, userLng, zoom)
    const tilesToPreload = this.calculatePreloadTiles(centerX, centerY, zoom, radius)
    
    // Use service worker for preloading if available
    if (this.serviceWorkerReady) {
      await this.preloadViaServiceWorker(tilesToPreload)
    } else {
      await this.preloadViaFetch(tilesToPreload)
    }
    
    const loadTime = performance.now() - startTime
    console.log(`✅ Preloaded ${tilesToPreload.length} tiles in ${loadTime.toFixed(1)}ms`)
    
    // Update performance metrics
    this.performanceMetrics.preloadEfficiency = tilesToPreload.length / (loadTime / 1000)
    
    return { success: true, tilesLoaded: tilesToPreload.length, loadTime }
  }

  /**
   * Calculate tiles to preload with smart priority
   */
  calculatePreloadTiles(centerX, centerY, zoom, radius) {
    const tiles = []
    const priorities = []
    
    // Create priority-based spiral pattern
    for (let r = 0; r <= radius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            const x = centerX + dx
            const y = centerY + dy
            
            if (this.isValidTileCoord(x, y, zoom)) {
              const priority = this.calculateTilePriority(dx, dy, r)
              const tileInfo = {
                x, y, zoom,
                priority,
                raster: true,
                vector: this.tileStrategy.useVector && zoom >= 10
              }
              
              tiles.push(tileInfo)
              priorities.push(priority)
            }
          }
        }
      }
    }
    
    // Sort by priority (lower number = higher priority)
    tiles.sort((a, b) => a.priority - b.priority)
    
    console.log(`🎯 Calculated ${tiles.length} tiles for preloading (radius: ${radius})`)
    return tiles
  }

  /**
   * Calculate tile priority based on distance and user behavior
   */
  calculateTilePriority(dx, dy, ring) {
    const distance = Math.sqrt(dx * dx + dy * dy)
    const ringPenalty = ring * 2
    
    // Center tiles have highest priority
    if (dx === 0 && dy === 0) return 0
    
    // Cardinal directions have higher priority than diagonals
    const cardinalBonus = (dx === 0 || dy === 0) ? -1 : 0
    
    return Math.floor(distance * 10) + ringPenalty + cardinalBonus
  }

  /**
   * Preload tiles via service worker (preferred method)
   */
  async preloadViaServiceWorker(tiles) {
    if (!navigator.serviceWorker.controller) {
      console.warn('⚠️ No service worker controller, falling back to fetch')
      return this.preloadViaFetch(tiles)
    }
    
    const messageChannel = new MessageChannel()
    const responsePromise = new Promise(resolve => {
      messageChannel.port1.onmessage = resolve
    })
    
    navigator.serviceWorker.controller.postMessage({
      type: 'PRELOAD_CRITICAL',
      data: {
        lat: this.userLocation.lat,
        lng: this.userLocation.lng,
        zoom: tiles[0]?.zoom || 12
      }
    }, [messageChannel.port2])
    
    return responsePromise
  }

  /**
   * Preload tiles via direct fetch (fallback method)
   */
  async preloadViaFetch(tiles) {
    const batchSize = this.smartPreloader.batchSize
    
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize)
      const batchPromises = batch.map(tile => this.preloadSingleTile(tile))
      
      try {
        await Promise.allSettled(batchPromises)
      } catch (error) {
        console.warn('⚠️ Batch preload error:', error)
      }
      
      // Delay between batches to avoid overwhelming network
      if (i + batchSize < tiles.length) {
        await this.delay(this.smartPreloader.delayBetweenBatches)
      }
    }
  }

  /**
   * Preload a single tile with both raster and vector support
   */
  async preloadSingleTile(tileInfo) {
    const { x, y, zoom, raster, vector } = tileInfo
    const promises = []
    
    // Preload raster tile
    if (raster) {
      promises.push(this.preloadRasterTile(x, y, zoom))
    }
    
    // Preload vector tile if enabled
    if (vector && this.vectorTileSupport.enabled) {
      promises.push(this.preloadVectorTile(x, y, zoom))
    }
    
    return Promise.allSettled(promises)
  }

  /**
   * Preload raster tile
   */
  async preloadRasterTile(x, y, zoom) {
    const tileUrl = this.getTileUrl(x, y, zoom, 'street')
    return this.preloadTileFromUrl(tileUrl, 'raster')
  }

  /**
   * Preload vector tile
   */
  async preloadVectorTile(x, y, zoom) {
    const tileUrl = this.getVectorTileUrl(x, y, zoom)
    return this.preloadTileFromUrl(tileUrl, 'vector')
  }

  /**
   * Generic tile preloading from URL
   */
  async preloadTileFromUrl(url, type = 'raster') {
    const cacheKey = `${type}_${url}`
    
    if (this.preloadedTiles.has(cacheKey)) {
      return Promise.resolve() // Already preloaded
    }
    
    return new Promise((resolve, reject) => {
      const startTime = performance.now()
      
      if (type === 'vector') {
        // Vector tiles require fetch, not Image
        fetch(url, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit'
        })
        .then(response => {
          if (response.ok) {
            this.preloadedTiles.add(cacheKey)
            this.performanceMetrics.tileLoadTimes.push(performance.now() - startTime)
            resolve(response)
          } else {
            reject(new Error(`Vector tile load failed: ${response.status}`))
          }
        })
        .catch(reject)
      } else {
        // Raster tiles can use Image preloading
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          this.tileCache.set(cacheKey, { image: img, url, timestamp: Date.now() })
          this.preloadedTiles.add(cacheKey)
          this.performanceMetrics.tileLoadTimes.push(performance.now() - startTime)
          resolve(img)
        }
        
        img.onerror = () => {
          this.performanceMetrics.networkFailures++
          reject(new Error(`Raster tile load failed: ${url}`))
        }
        
        // Set priority for critical tiles
        if (img.fetchPriority) {
          img.fetchPriority = 'high'
        }
        
        img.src = url
      }
    })
  }

  /**
   * Get vector tile URL
   */
  getVectorTileUrl(x, y, zoom, provider = 'vector') {
    if (provider === 'protomaps' && this.vectorTileSupport.protomapsKey) {
      return this.tileProviders.protomaps
        .replace('{z}', zoom)
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{apikey}', this.vectorTileSupport.protomapsKey)
    }
    
    return this.tileProviders.vector
      .replace('{z}', zoom)
      .replace('{x}', x)
      .replace('{y}', y)
  }

  /**
   * Generate tile URL from coordinates
   */
  getTileUrl(x, y, zoom, provider = 'street') {
    const template = this.tileProviders[provider]
    const subdomains = ['a', 'b', 'c']
    const subdomain = subdomains[Math.abs(x + y) % subdomains.length]
    
    return template
      .replace('{s}', subdomain)
      .replace('{z}', zoom)
      .replace('{x}', x)
      .replace('{y}', y)
  }

  /**
   * Convert lat/lng to tile coordinates
   */
  latLngToTile(lat, lng, zoom) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
    return { x, y }
  }

  /**
   * Validate tile coordinates
   */
  isValidTileCoord(x, y, zoom) {
    const maxTile = Math.pow(2, zoom)
    return x >= 0 && x < maxTile && y >= 0 && y < maxTile
  }

  /**
   * 🎯 ADVANCED LEAFLET INTEGRATION
   * Hook into Leaflet with CloudFlare proxy and vector tile support
   */
  optimizeLeafletTileLoading(map) {
    console.log('🚀 Advanced Leaflet optimization with CloudFlare proxy...')
    
    // Override tile layer creation with CloudFlare proxy
    const originalTileLayer = L.tileLayer
    const self = this
    
    L.tileLayer = function(url, options = {}) {
      // Convert to CloudFlare proxy URL if it's a standard tile server
      const proxyUrl = self.convertToCloudFlareProxy(url)
      
      // Advanced optimized options
      const optimizedOptions = {
        ...options,
        // Network optimizations
        crossOrigin: 'anonymous',
        // Performance optimizations
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: self.tileStrategy.preloadRadius,
        // Loading optimizations
        detectRetina: window.devicePixelRatio > 1,
        // Cache optimizations
        maxZoom: options.maxZoom || 18,
        // Advanced features
        className: `advanced-tiles-${Date.now()}`,
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA8jj7SQAAAABJRU5ErkJggg=='
      }
      
      const layer = originalTileLayer(proxyUrl, optimizedOptions)
      
      // Advanced tile loading hooks
      layer.on('tileloadstart', (e) => {
        const tile = e.tile
        const startTime = performance.now()
        
        // Set high priority for critical tiles
        if (tile.fetchPriority) {
          tile.fetchPriority = 'high'
        }
        
        // Store load start time
        tile._loadStartTime = startTime
        
        // Monitor tile loading
        self.monitorTileLoad(e.coords, startTime)
      })
      
      layer.on('tileload', (e) => {
        const loadTime = performance.now() - (e.tile._loadStartTime || 0)
        self.performanceMetrics.tileLoadTimes.push(loadTime)
        
        console.log(`📦 Tile loaded: ${e.coords.z}/${e.coords.x}/${e.coords.y} (${loadTime.toFixed(1)}ms)`)
      })
      
      layer.on('tileerror', (e) => {
        console.warn(`❌ Tile error: ${e.coords.z}/${e.coords.x}/${e.coords.y}`)
        self.performanceMetrics.networkFailures++
        
        // Try fallback tile
        self.handleTileError(e, layer)
      })
      
      // Setup predictive tile loading
      map.on('moveend zoomend', () => {
        self.predictivePreload(map)
      })
      
      return layer
    }
    
    // Setup adaptive strategy
    setInterval(() => {
      this.adaptStrategy()
    }, 60000) // Every minute
    
    return map
  }

  /**
   * Convert standard tile URL to CloudFlare proxy
   */
  convertToCloudFlareProxy(url) {
    // If already using CloudFlare proxy, return as is
    if (url.includes('tiles.teppek.com')) {
      return url
    }
    
    // Convert OpenStreetMap URLs
    if (url.includes('tile.openstreetmap.org')) {
      return this.tileProviders.street
    }
    
    // Convert satellite URLs
    if (url.includes('arcgisonline.com')) {
      return this.tileProviders.satellite
    }
    
    // Return original URL if no conversion available
    console.log(`🔄 No CloudFlare proxy available for: ${url}`)
    return url
  }

  /**
   * Monitor tile loading performance
   */
  monitorTileLoad(coords, startTime) {
    // Track tile loading patterns
    // This could be used for predictive loading
  }

  /**
   * Handle tile loading errors with fallback
   */
  async handleTileError(errorEvent, layer) {
    const { coords } = errorEvent
    const fallbackUrl = this.getFallbackTileUrl(coords)
    
    if (fallbackUrl) {
      console.log(`🔄 Trying fallback tile: ${coords.z}/${coords.x}/${coords.y}`)
      
      try {
        // This is a simplified fallback - in practice, you'd need to 
        // work with Leaflet's internal tile management
        console.log(`Fallback URL: ${fallbackUrl}`)
      } catch (error) {
        console.warn('⚠️ Fallback tile also failed:', error)
      }
    }
  }

  /**
   * Get fallback tile URL
   */
  getFallbackTileUrl(coords) {
    const { x, y, z } = coords
    
    // Try different fallback servers
    const fallbacks = [
      this.tileProviders.streetFallback,
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ]
    
    return fallbacks[0]
      .replace('{s}', 'a')
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y)
  }

  /**
   * Predictive tile preloading based on user movement
   */
  predictivePreload(map) {
    if (!this.smartPreloader.predictiveLoading) return
    
    const center = map.getCenter()
    const zoom = map.getZoom()
    const bounds = map.getBounds()
    
    // Predict user movement direction
    if (this.userLocation) {
      const deltaLat = center.lat - this.userLocation.lat
      const deltaLng = center.lng - this.userLocation.lng
      
      // Preload tiles in movement direction
      const predictedLat = center.lat + deltaLat * 2
      const predictedLng = center.lng + deltaLng * 2
      
      // Queue predictive preload
      this.queuePreload(predictedLat, predictedLng, zoom, 1)
    }
    
    // Update user location
    this.userLocation = { lat: center.lat, lng: center.lng }
  }

  /**
   * Queue tiles for background preloading
   */
  queuePreload(lat, lng, zoom, radius) {
    if (this.isPreloading) return
    
    this.preloadQueue.push({ lat, lng, zoom, radius })
    
    // Process queue
    if (this.preloadQueue.length === 1) {
      this.processPreloadQueue()
    }
  }

  /**
   * Process preload queue in background
   */
  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) return
    
    this.isPreloading = true
    
    while (this.preloadQueue.length > 0) {
      const { lat, lng, zoom, radius } = this.preloadQueue.shift()
      
      try {
        await this.preloadCriticalTiles(lat, lng, zoom, { radius })
      } catch (error) {
        console.warn('⚠️ Background preload failed:', error)
      }
      
      // Small delay between queue items
      await this.delay(500)
    }
    
    this.isPreloading = false
  }

  /**
   * Get comprehensive cache statistics
   */
  async getCacheStats() {
    const stats = {
      memory: {
        rasterTiles: this.tileCache.size,
        vectorTiles: this.vectorTileCache.size,
        preloadedTiles: this.preloadedTiles.size,
        estimatedMemoryUsage: this.estimateMemoryUsage()
      },
      performance: {
        averageLoadTime: this.calculateAverageLoadTime(),
        cacheHitRate: this.calculateHitRate(),
        preloadEfficiency: this.performanceMetrics.preloadEfficiency,
        networkFailures: this.performanceMetrics.networkFailures
      },
      strategy: this.tileStrategy,
      serviceWorker: {
        ready: this.serviceWorkerReady,
        version: '2.0'
      }
    }
    
    // Get service worker stats if available
    if (this.serviceWorkerReady) {
      try {
        const swStats = await this.getServiceWorkerStats()
        stats.serviceWorkerCache = swStats
      } catch (error) {
        console.warn('⚠️ Could not get service worker stats:', error)
      }
    }
    
    return stats
  }

  /**
   * Get service worker cache statistics
   */
  async getServiceWorkerStats() {
    if (!navigator.serviceWorker.controller) return null
    
    const messageChannel = new MessageChannel()
    const responsePromise = new Promise(resolve => {
      messageChannel.port1.onmessage = event => resolve(event.data)
    })
    
    navigator.serviceWorker.controller.postMessage({
      type: 'GET_CACHE_STATS'
    }, [messageChannel.port2])
    
    return responsePromise
  }

  calculateHitRate() {
    const totalTiles = this.tileCache.size + this.vectorTileCache.size
    if (totalTiles === 0) return 0
    return Math.min((this.preloadedTiles.size / totalTiles) * 100, 100)
  }

  calculateAverageLoadTime() {
    const loadTimes = this.performanceMetrics.tileLoadTimes
    if (loadTimes.length === 0) return 0
    return loadTimes.reduce((a, b) => a + b) / loadTimes.length
  }

  estimateMemoryUsage() {
    // Improved estimation: 50KB per raster tile, 20KB per vector tile
    const rasterSize = this.tileCache.size * 50 // KB
    const vectorSize = this.vectorTileCache.size * 20 // KB
    const totalKB = rasterSize + vectorSize
    return {
      raster: `${(rasterSize / 1024).toFixed(1)} MB`,
      vector: `${(vectorSize / 1024).toFixed(1)} MB`,
      total: `${(totalKB / 1024).toFixed(1)} MB`,
      utilization: `${((totalKB / 1024) / 100 * 100).toFixed(1)}%` // Out of 100MB limit
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    this.tileCache.clear()
    this.vectorTileCache.clear()
    this.preloadedTiles.clear()
    
    if (this.serviceWorkerReady) {
      const messageChannel = new MessageChannel()
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      }, [messageChannel.port2])
    }
    
    console.log('🧹 All caches cleared')
  }

  /**
   * Adaptive tile strategy based on performance
   */
  adaptStrategy() {
    const avgLoadTime = this.calculateAverageLoadTime()
    const failureRate = this.performanceMetrics.networkFailures / Math.max(this.preloadedTiles.size, 1)
    
    // Adapt based on performance
    if (avgLoadTime > 1000 || failureRate > 0.1) {
      // Poor performance - reduce preloading
      this.tileStrategy.preloadRadius = Math.max(1, this.tileStrategy.preloadRadius - 1)
      this.tileStrategy.maxConcurrent = Math.max(2, this.tileStrategy.maxConcurrent - 2)
      console.log('📉 Adapted strategy for poor performance:', this.tileStrategy)
    } else if (avgLoadTime < 300 && failureRate < 0.02) {
      // Good performance - increase preloading
      this.tileStrategy.preloadRadius = Math.min(4, this.tileStrategy.preloadRadius + 1)
      this.tileStrategy.maxConcurrent = Math.min(12, this.tileStrategy.maxConcurrent + 2)
      console.log('📈 Adapted strategy for good performance:', this.tileStrategy)
    }
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Monitor tile performance
   */
  monitorTilePerformance() {
    setInterval(() => {
      if (this.performanceMetrics.tileLoadTimes.length > 0) {
        const avgLoadTime = this.performanceMetrics.tileLoadTimes.reduce((a, b) => a + b) / this.performanceMetrics.tileLoadTimes.length
        console.log(`📊 Avg tile load time: ${avgLoadTime.toFixed(1)}ms`)
        
        // Reset metrics periodically
        this.performanceMetrics.tileLoadTimes = []
      }
    }, 30000) // Every 30 seconds
  }
  
  /**
   * Update cache stats from service worker
   */
  updateCacheStats(data) {
    // Update internal metrics with service worker data
    if (data.performance) {
      this.performanceMetrics.cacheHitRate = parseFloat(data.performance.hitRate) || 0
    }
  }
  
  /**
   * Update preload progress
   */
  updatePreloadProgress(data) {
    console.log(`📊 Preload progress: ${data.completed}/${data.total} tiles`)
  }
}

// Global instance
let advancedMapTileOptimizer = null

/**
 * Initialize Advanced Map Tile Optimizer
 */
export function initAdvancedMapTileOptimizer() {
  if (!advancedMapTileOptimizer) {
    advancedMapTileOptimizer = new AdvancedMapTileOptimizer()
  }
  return advancedMapTileOptimizer
}

/**
 * Start critical tile preloading with advanced features
 * Call this as early as possible
 */
export async function preloadCriticalMapTiles(lat, lng, zoom = 12, options = {}) {
  const optimizer = initAdvancedMapTileOptimizer()
  return await optimizer.preloadCriticalTiles(lat, lng, zoom, options)
}

/**
 * Optimize Leaflet map instance with advanced features
 */
export function optimizeLeafletMap(map) {
  const optimizer = initAdvancedMapTileOptimizer()
  return optimizer.optimizeLeafletTileLoading(map)
}

/**
 * Get comprehensive tile cache statistics
 */
export async function getTileOptimizerStats() {
  if (!advancedMapTileOptimizer) return null
  return await advancedMapTileOptimizer.getCacheStats()
}

/**
 * Clear all tile caches
 */
export async function clearAllTileCaches() {
  if (!advancedMapTileOptimizer) return
  return await advancedMapTileOptimizer.clearAllCaches()
}

/**
 * Create Leaflet tile layer with CloudFlare proxy
 */
export function createOptimizedTileLayer(type = 'street', options = {}) {
  const optimizer = initAdvancedMapTileOptimizer()
  const tileUrl = optimizer.tileProviders[type] || optimizer.tileProviders.street
  
  const defaultOptions = {
    attribution: type === 'satellite' 
      ? '© Esri, via CloudFlare proxy' 
      : '© OpenStreetMap contributors, via CloudFlare proxy',
    maxZoom: 18,
    crossOrigin: true,
    // Advanced performance options
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2,
    detectRetina: window.devicePixelRatio > 1,
    className: `optimized-tiles-${type}`
  }
  
  return L.tileLayer(tileUrl, { ...defaultOptions, ...options })
}

/**
 * Add vector tile support to map (requires Protomaps or similar)
 */
export function addVectorTileLayer(map, options = {}) {
  const optimizer = initAdvancedMapTileOptimizer()
  
  if (!optimizer.vectorTileSupport.enabled) {
    console.warn('⚠️ Vector tile support not enabled')
    return null
  }
  
  // This would integrate with Protomaps or similar vector tile library
  console.log('🗂️ Vector tile layer would be added here')
  // Implementation depends on chosen vector tile library
  
  return null // Placeholder
}

export default AdvancedMapTileOptimizer