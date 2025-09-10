/**
 * 🗂️ VECTOR TILE LAYER INTEGRATION
 * Protomaps and vector tile support for advanced mapping
 */

/**
 * Vector Tile Layer Manager
 * Handles Protomaps integration and vector tile rendering
 */
class VectorTileLayerManager {
  constructor() {
    this.layers = new Map()
    this.protomapsLoaded = false
    this.fallbackToRaster = true
    this.init()
  }

  /**
   * Initialize vector tile support
   */
  async init() {
    try {
      // Check if Protomaps is available
      if (typeof window !== 'undefined' && window.protomaps) {
        this.protomapsLoaded = true
        console.log('🗂️ Protomaps library detected')
      } else {
        console.log('📍 Protomaps not available, using raster tiles')
      }
    } catch (error) {
      console.warn('⚠️ Vector tile initialization failed:', error)
    }
  }

  /**
   * Create vector tile layer
   */
  createVectorLayer(options = {}) {
    const {
      apiKey = process.env.VITE_PROTOMAPS_API_KEY,
      style = 'light',
      theme = 'default',
      language = 'en'
    } = options

    if (!this.protomapsLoaded || !apiKey) {
      console.warn('⚠️ Cannot create vector layer: Protomaps not available or no API key')
      return this.createFallbackLayer(options)
    }

    try {
      // Create Protomaps layer
      const vectorLayer = new window.protomaps.LeafletLayer({
        url: `https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt?key=${apiKey}`,
        style: this.getProtomapsStyle(style, theme),
        attribution: '© OpenStreetMap contributors, © Protomaps'
      })

      console.log('🗂️ Vector tile layer created with Protomaps')
      return vectorLayer

    } catch (error) {
      console.error('❌ Vector layer creation failed:', error)
      return this.createFallbackLayer(options)
    }
  }

  /**
   * Create fallback raster layer
   */
  createFallbackLayer(options = {}) {
    if (!this.fallbackToRaster) {
      return null
    }

    console.log('🔄 Creating fallback raster layer')
    
    return L.tileLayer('https://tiles.teppek.com/osm/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors, via CloudFlare proxy',
      maxZoom: 18,
      crossOrigin: true,
      className: 'vector-fallback-layer'
    })
  }

  /**
   * Get Protomaps style configuration
   */
  getProtomapsStyle(style = 'light', theme = 'default') {
    const styles = {
      light: {
        background: '#f8f9fa',
        water: '#74b9ff',
        land: '#ffffff',
        roads: '#ddd',
        buildings: '#e0e0e0',
        parks: '#a4de6c'
      },
      dark: {
        background: '#1a1a1a',
        water: '#2d3748',
        land: '#2d3748',
        roads: '#4a5568',
        buildings: '#718096',
        parks: '#48bb78'
      },
      satellite: {
        // Hybrid style for satellite overlay
        background: 'transparent',
        water: 'transparent',
        land: 'transparent',
        roads: '#ffcc00',
        buildings: 'rgba(255, 255, 255, 0.8)',
        parks: 'rgba(164, 222, 108, 0.6)'
      }
    }

    return styles[style] || styles.light
  }

  /**
   * Add vector layer to map
   */
  addToMap(map, layerId = 'default', options = {}) {
    try {
      // Remove existing layer if present
      this.removeFromMap(map, layerId)

      const layer = this.createVectorLayer(options)
      if (!layer) {
        console.warn('⚠️ Could not create vector layer')
        return null
      }

      // Add to map
      layer.addTo(map)
      this.layers.set(layerId, layer)

      console.log(`🗂️ Vector layer '${layerId}' added to map`)
      return layer

    } catch (error) {
      console.error('❌ Failed to add vector layer to map:', error)
      return null
    }
  }

  /**
   * Remove vector layer from map
   */
  removeFromMap(map, layerId = 'default') {
    const layer = this.layers.get(layerId)
    if (layer && map.hasLayer(layer)) {
      map.removeLayer(layer)
      this.layers.delete(layerId)
      console.log(`🗂️ Vector layer '${layerId}' removed from map`)
    }
  }

  /**
   * Switch between vector and raster tiles
   */
  switchLayer(map, type = 'vector', options = {}) {
    this.removeFromMap(map, 'current')

    let layer
    if (type === 'vector') {
      layer = this.createVectorLayer(options)
    } else {
      layer = this.createFallbackLayer(options)
    }

    if (layer) {
      layer.addTo(map)
      this.layers.set('current', layer)
      console.log(`🔄 Switched to ${type} tiles`)
    }

    return layer
  }

  /**
   * Check if device supports vector tiles
   */
  isVectorTileSupported() {
    // Check for WebGL support (required for smooth vector rendering)
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    
    if (!gl) {
      console.log('📱 WebGL not supported, vector tiles may be slow')
      return false
    }

    // Check device memory
    const deviceMemory = navigator.deviceMemory || 4
    if (deviceMemory < 2) {
      console.log('📱 Low memory device, vector tiles disabled')
      return false
    }

    // Check connection speed
    const connection = navigator.connection
    if (connection && connection.effectiveType && connection.effectiveType.includes('2g')) {
      console.log('📱 Slow connection, vector tiles disabled')
      return false
    }

    return true
  }

  /**
   * Optimize vector tiles for mobile
   */
  getMobileOptimizedOptions() {
    return {
      simplifyFactor: 2, // Simplify geometry more aggressively
      maxZoom: 16, // Limit max zoom on mobile
      buffer: 32, // Smaller buffer
      vectorTileLayerStyles: {
        // Simplified styling for better performance
        'roads': {
          weight: 2,
          opacity: 0.8
        },
        'buildings': {
          fillOpacity: 0.6,
          weight: 0
        },
        'water': {
          fillOpacity: 0.8,
          weight: 0
        }
      }
    }
  }

  /**
   * Load Protomaps library dynamically
   */
  async loadProtomapsLibrary() {
    if (this.protomapsLoaded || typeof window === 'undefined') {
      return this.protomapsLoaded
    }

    try {
      // Load Protomaps script
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/protomaps-leaflet@latest/dist/protomaps-leaflet.js'
      script.async = true

      const loadPromise = new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
      })

      document.head.appendChild(script)
      await loadPromise

      this.protomapsLoaded = true
      console.log('✅ Protomaps library loaded successfully')
      return true

    } catch (error) {
      console.error('❌ Failed to load Protomaps library:', error)
      return false
    }
  }

  /**
   * Get layer statistics
   */
  getStats() {
    return {
      protomapsLoaded: this.protomapsLoaded,
      activeLayers: this.layers.size,
      layerIds: Array.from(this.layers.keys()),
      vectorTileSupported: this.isVectorTileSupported(),
      fallbackEnabled: this.fallbackToRaster
    }
  }
}

// Global instance
let vectorTileLayerManager = null

/**
 * Initialize vector tile layer manager
 */
export function initVectorTileLayerManager() {
  if (!vectorTileLayerManager) {
    vectorTileLayerManager = new VectorTileLayerManager()
  }
  return vectorTileLayerManager
}

/**
 * Create vector tile layer for Leaflet
 */
export function createVectorTileLayer(options = {}) {
  const manager = initVectorTileLayerManager()
  return manager.createVectorLayer(options)
}

/**
 * Add vector tile layer to map
 */
export function addVectorTileLayer(map, options = {}) {
  const manager = initVectorTileLayerManager()
  return manager.addToMap(map, 'default', options)
}

/**
 * Check if vector tiles are supported on this device
 */
export function isVectorTileSupported() {
  const manager = initVectorTileLayerManager()
  return manager.isVectorTileSupported()
}

/**
 * Load Protomaps library if not already loaded
 */
export async function loadProtomapsLibrary() {
  const manager = initVectorTileLayerManager()
  return await manager.loadProtomapsLibrary()
}

/**
 * Switch between vector and raster tiles
 */
export function switchTileLayer(map, type, options = {}) {
  const manager = initVectorTileLayerManager()
  return manager.switchLayer(map, type, options)
}

/**
 * Get vector tile layer statistics
 */
export function getVectorTileStats() {
  if (!vectorTileLayerManager) return null
  return vectorTileLayerManager.getStats()
}

export default VectorTileLayerManager