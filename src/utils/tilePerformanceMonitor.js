/**
 * 🚀 TILE PERFORMANCE MONITOR
 * Comprehensive monitoring system for tile caching and loading performance
 */

class TilePerformanceMonitor {
  constructor() {
    this.metrics = {
      // Loading performance
      tileLoadTimes: [],
      cacheHitRate: 0,
      networkFailures: 0,
      
      // Service Worker metrics
      swCacheHits: 0,
      swCacheMisses: 0,
      swCacheSize: 0,
      
      // CloudFlare proxy metrics
      proxyHits: 0,
      proxyMisses: 0,
      proxyErrors: 0,
      
      // Vector tile metrics
      vectorTileLoads: 0,
      vectorTileErrors: 0,
      vectorTileSize: 0,
      
      // User experience metrics
      mapLoadTime: 0,
      firstTileTime: 0,
      allTilesTime: 0,
      
      // Connection info
      connectionType: this.getConnectionType(),
      deviceMemory: navigator.deviceMemory || 'unknown'
    }
    
    this.observers = []
    this.startTime = performance.now()
    this.initializeMonitoring()
  }
  
  /**
   * Initialize performance monitoring
   */
  initializeMonitoring() {
    // Monitor Service Worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this))
    }
    
    // Monitor network changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', this.updateConnectionInfo.bind(this))
    }
    
    // Setup periodic reporting
    setInterval(() => this.generateReport(), 60000) // Every minute
    
    console.log('📊 Tile Performance Monitor initialized')
  }
  
  /**
   * Record tile load start
   */
  recordTileLoadStart(url, source = 'unknown') {
    const startTime = performance.now()
    return {
      url,
      source,
      startTime,
      endTime: null,
      fromCache: false
    }
  }
  
  /**
   * Record tile load completion
   */
  recordTileLoadEnd(loadRecord, fromCache = false, error = null) {
    const endTime = performance.now()
    const loadTime = endTime - loadRecord.startTime
    
    loadRecord.endTime = endTime
    loadRecord.fromCache = fromCache
    
    // Update metrics
    this.metrics.tileLoadTimes.push(loadTime)
    
    if (error) {
      this.metrics.networkFailures++
    } else if (fromCache) {
      if (loadRecord.source === 'service-worker') {
        this.metrics.swCacheHits++
      } else if (loadRecord.source === 'cloudflare') {
        this.metrics.proxyHits++
      }
    } else {
      if (loadRecord.source === 'service-worker') {
        this.metrics.swCacheMisses++
      } else if (loadRecord.source === 'cloudflare') {
        this.metrics.proxyMisses++
      }
    }
    
    // Keep only recent load times
    if (this.metrics.tileLoadTimes.length > 1000) {
      this.metrics.tileLoadTimes = this.metrics.tileLoadTimes.slice(-500)
    }
    
    // Notify observers
    this.notifyObservers('tile-load', {
      loadTime,
      fromCache,
      source: loadRecord.source,
      error
    })
    
    return loadTime
  }
  
  /**
   * Record vector tile metrics
   */
  recordVectorTileLoad(size, loadTime, error = null) {
    this.metrics.vectorTileLoads++
    this.metrics.vectorTileSize += size
    
    if (error) {
      this.metrics.vectorTileErrors++
    }
    
    this.notifyObservers('vector-tile-load', {
      size,
      loadTime,
      error
    })
  }
  
  /**
   * Record map load milestones
   */
  recordMapMilestone(milestone, time = null) {
    const timestamp = time || performance.now()
    const relativeTime = timestamp - this.startTime
    
    switch (milestone) {
      case 'first-tile':
        this.metrics.firstTileTime = relativeTime
        break
      case 'all-tiles':
        this.metrics.allTilesTime = relativeTime
        break
      case 'map-ready':
        this.metrics.mapLoadTime = relativeTime
        break
    }
    
    this.notifyObservers('milestone', { milestone, time: relativeTime })
  }
  
  /**
   * Handle Service Worker messages
   */
  handleSWMessage(event) {
    const { type, data } = event.data || {}
    
    switch (type) {
      case 'CACHE_STATS':
        this.metrics.swCacheSize = data.cacheSize || 0
        break
      case 'TILE_CACHED':
        this.metrics.swCacheHits++
        break
      case 'CACHE_MISS':
        this.metrics.swCacheMisses++
        break
    }
  }
  
  /**
   * Update connection information
   */
  updateConnectionInfo() {
    this.metrics.connectionType = this.getConnectionType()
    console.log('📱 Connection changed to:', this.metrics.connectionType)
  }
  
  /**
   * Get connection type
   */
  getConnectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (!connection) return 'unknown'
    
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    }
  }
  
  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate() {
    const totalRequests = this.metrics.swCacheHits + this.metrics.swCacheMisses + this.metrics.proxyHits + this.metrics.proxyMisses
    const totalHits = this.metrics.swCacheHits + this.metrics.proxyHits
    
    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0
  }
  
  /**
   * Calculate average load time
   */
  calculateAverageLoadTime() {
    if (this.metrics.tileLoadTimes.length === 0) return 0
    
    const sum = this.metrics.tileLoadTimes.reduce((a, b) => a + b, 0)
    return sum / this.metrics.tileLoadTimes.length
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    const cacheHitRate = this.calculateCacheHitRate()
    const avgLoadTime = this.calculateAverageLoadTime()
    const p95LoadTime = this.calculatePercentile(this.metrics.tileLoadTimes, 95)
    
    return {\n      performance: {\n        averageLoadTime: avgLoadTime,\n        p95LoadTime: p95LoadTime,\n        cacheHitRate: cacheHitRate,\n        networkFailures: this.metrics.networkFailures,\n        totalTileLoads: this.metrics.tileLoadTimes.length\n      },\n      \n      caching: {\n        serviceWorker: {\n          hits: this.metrics.swCacheHits,\n          misses: this.metrics.swCacheMisses,\n          size: this.metrics.swCacheSize\n        },\n        cloudflare: {\n          hits: this.metrics.proxyHits,\n          misses: this.metrics.proxyMisses,\n          errors: this.metrics.proxyErrors\n        }\n      },\n      \n      vectorTiles: {\n        loads: this.metrics.vectorTileLoads,\n        errors: this.metrics.vectorTileErrors,\n        totalSize: this.metrics.vectorTileSize\n      },\n      \n      milestones: {\n        firstTile: this.metrics.firstTileTime,\n        allTiles: this.metrics.allTilesTime,\n        mapReady: this.metrics.mapLoadTime\n      },\n      \n      environment: {\n        connection: this.metrics.connectionType,\n        deviceMemory: this.metrics.deviceMemory,\n        userAgent: navigator.userAgent\n      },\n      \n      timestamp: new Date().toISOString()\n    }\n  }\n  \n  /**\n   * Calculate percentile\n   */\n  calculatePercentile(values, percentile) {\n    if (values.length === 0) return 0\n    \n    const sorted = [...values].sort((a, b) => a - b)\n    const index = Math.ceil((percentile / 100) * sorted.length) - 1\n    return sorted[Math.max(0, index)]\n  }\n  \n  /**\n   * Generate performance report\n   */\n  generateReport() {\n    const stats = this.getStats()\n    \n    // Log summary\n    console.log('📊 Tile Performance Report:', {\n      avgLoadTime: `${stats.performance.averageLoadTime.toFixed(1)}ms`,\n      cacheHitRate: `${stats.performance.cacheHitRate.toFixed(1)}%`,\n      totalTiles: stats.performance.totalTileLoads,\n      failures: stats.performance.networkFailures\n    })\n    \n    // Send to analytics if configured\n    this.sendToAnalytics(stats)\n    \n    return stats\n  }\n  \n  /**\n   * Send metrics to analytics\n   */\n  sendToAnalytics(stats) {\n    // Send to your analytics service\n    if (window.gtag) {\n      window.gtag('event', 'tile_performance', {\n        average_load_time: Math.round(stats.performance.averageLoadTime),\n        cache_hit_rate: Math.round(stats.performance.cacheHitRate),\n        total_tiles: stats.performance.totalTileLoads,\n        connection_type: stats.environment.connection?.effectiveType || 'unknown'\n      })\n    }\n    \n    // Could also send to Vercel Analytics, PostHog, etc.\n    if (window.va) {\n      window.va('track', 'tile_performance', stats.performance)\n    }\n  }\n  \n  /**\n   * Add performance observer\n   */\n  addObserver(callback) {\n    this.observers.push(callback)\n    return () => {\n      const index = this.observers.indexOf(callback)\n      if (index > -1) {\n        this.observers.splice(index, 1)\n      }\n    }\n  }\n  \n  /**\n   * Notify observers\n   */\n  notifyObservers(event, data) {\n    this.observers.forEach(callback => {\n      try {\n        callback(event, data)\n      } catch (error) {\n        console.warn('Observer error:', error)\n      }\n    })\n  }\n  \n  /**\n   * Reset metrics\n   */\n  reset() {\n    this.metrics = {\n      tileLoadTimes: [],\n      cacheHitRate: 0,\n      networkFailures: 0,\n      swCacheHits: 0,\n      swCacheMisses: 0,\n      swCacheSize: 0,\n      proxyHits: 0,\n      proxyMisses: 0,\n      proxyErrors: 0,\n      vectorTileLoads: 0,\n      vectorTileErrors: 0,\n      vectorTileSize: 0,\n      mapLoadTime: 0,\n      firstTileTime: 0,\n      allTilesTime: 0,\n      connectionType: this.getConnectionType(),\n      deviceMemory: navigator.deviceMemory || 'unknown'\n    }\n    \n    this.startTime = performance.now()\n    console.log('🔄 Performance metrics reset')\n  }\n  \n  /**\n   * Export metrics for debugging\n   */\n  exportMetrics() {\n    const stats = this.getStats()\n    const blob = new Blob([JSON.stringify(stats, null, 2)], {\n      type: 'application/json'\n    })\n    \n    const url = URL.createObjectURL(blob)\n    const a = document.createElement('a')\n    a.href = url\n    a.download = `tile-performance-${Date.now()}.json`\n    document.body.appendChild(a)\n    a.click()\n    document.body.removeChild(a)\n    URL.revokeObjectURL(url)\n    \n    console.log('📥 Performance metrics exported')\n  }\n}\n\n// Global instance\nlet tilePerformanceMonitor = null\n\n/**\n * Initialize tile performance monitor\n */\nexport function initTilePerformanceMonitor() {\n  if (!tilePerformanceMonitor) {\n    tilePerformanceMonitor = new TilePerformanceMonitor()\n  }\n  return tilePerformanceMonitor\n}\n\n/**\n * Get tile performance monitor instance\n */\nexport function getTilePerformanceMonitor() {\n  return tilePerformanceMonitor || initTilePerformanceMonitor()\n}\n\n/**\n * Record tile load start\n */\nexport function recordTileLoadStart(url, source) {\n  const monitor = getTilePerformanceMonitor()\n  return monitor.recordTileLoadStart(url, source)\n}\n\n/**\n * Record tile load end\n */\nexport function recordTileLoadEnd(loadRecord, fromCache, error) {\n  const monitor = getTilePerformanceMonitor()\n  return monitor.recordTileLoadEnd(loadRecord, fromCache, error)\n}\n\n/**\n * Record map milestone\n */\nexport function recordMapMilestone(milestone, time) {\n  const monitor = getTilePerformanceMonitor()\n  return monitor.recordMapMilestone(milestone, time)\n}\n\n/**\n * Get performance statistics\n */\nexport function getTilePerformanceStats() {\n  const monitor = getTilePerformanceMonitor()\n  return monitor.getStats()\n}\n\nexport default TilePerformanceMonitor