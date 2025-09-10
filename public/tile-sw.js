/**
 * 🚀 ADVANCED TILE CACHING SERVICE WORKER
 * CloudFlare proxy + Vector tiles + Smart preloading + 100MB cache management
 * Features: Offline support, Retry logic, Vector tile optimization
 */

const CACHE_VERSION = '2.0'
const RASTER_CACHE = `teppek-raster-tiles-v${CACHE_VERSION}`
const VECTOR_CACHE = `teppek-vector-tiles-v${CACHE_VERSION}`
const FALLBACK_CACHE = `teppek-fallback-tiles-v${CACHE_VERSION}`

const MAX_CACHE_SIZE_MB = 100
const TILE_CACHE_DAYS = 30
const VECTOR_TILE_CACHE_DAYS = 7
const MAX_RETRY_ATTEMPTS = 3
const PRELOAD_BATCH_SIZE = 10

// CloudFlare proxy endpoints
const CF_PROXY_BASE = 'https://tiles.teppek.com'
const TILE_SERVERS = {
  osm: `${CF_PROXY_BASE}/osm/{z}/{x}/{y}.png`,
  osmRetina: `${CF_PROXY_BASE}/osm/{z}/{x}/{y}@2x.png`,
  satellite: `${CF_PROXY_BASE}/satellite/{z}/{x}/{y}.jpg`,
  vector: `${CF_PROXY_BASE}/vector/{z}/{x}/{y}.pbf`,
  // Fallback servers
  osmFallback: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satelliteFallback: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
}

// Performance monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  vectorHits: 0,
  vectorMisses: 0,
  preloadedTiles: 0,
  retries: 0,
  fallbacks: 0,
  networkErrors: 0
}

self.addEventListener('install', event => {
  console.log('🚀 Advanced Tile Service Worker v2.0 installing...')
  event.waitUntil(
    Promise.all([
      caches.open(RASTER_CACHE),
      caches.open(VECTOR_CACHE),
      caches.open(FALLBACK_CACHE)
    ]).then(() => {
      console.log('📦 All tile caches initialized')
      self.skipWaiting()
    })
  )
})

self.addEventListener('activate', event => {
  console.log('✅ Advanced Tile Service Worker activated')
  event.waitUntil(
    Promise.all([
      cleanupOldCaches(),
      self.clients.claim()
    ])
  )
})

async function cleanupOldCaches() {
  const cacheNames = await caches.keys()
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('teppek-') && 
    !name.includes(`v${CACHE_VERSION}`)
  )
  
  if (oldCaches.length > 0) {
    console.log('🗑️ Cleaning old caches:', oldCaches)
    await Promise.all(oldCaches.map(name => caches.delete(name)))
  }
}

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  
  if (isTileRequest(url)) {
    event.respondWith(handleAdvancedTileRequest(request))
  }
})

function isTileRequest(url) {
  // Enhanced tile detection for raster, vector, and proxy tiles
  return (
    url.hostname.includes('tiles.teppek.com') ||
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('arcgisonline.com') ||
    url.pathname.match(/\/\d+\/\d+\/\d+\.(png|jpg|jpeg|webp|pbf)$/) ||
    url.pathname.includes('/vector/') ||
    url.pathname.includes('/satellite/')
  )
}

function isVectorTile(url) {
  return url.pathname.endsWith('.pbf') || url.pathname.includes('/vector/')
}

function isSatelliteTile(url) {
  return url.pathname.includes('/satellite/') || 
         url.hostname.includes('arcgisonline.com')
}

function isRetinaRequest(url) {
  return url.pathname.includes('@2x')
}

/**
 * Advanced tile request handler with CloudFlare proxy, vector tiles, and fallbacks
 */
async function handleAdvancedTileRequest(request) {
  const url = new URL(request.url)
  const isVector = isVectorTile(url)
  const cacheName = isVector ? VECTOR_CACHE : RASTER_CACHE
  const maxAge = isVector ? VECTOR_TILE_CACHE_DAYS : TILE_CACHE_DAYS
  
  try {
    // 1. Try cache first (with smart cache validation)
    const cachedResponse = await getCachedTileIfValid(request, cacheName, maxAge)
    if (cachedResponse) {
      isVector ? cacheStats.vectorHits++ : cacheStats.hits++
      return cachedResponse
    }
    
    // 2. Cache miss - fetch with retry and fallback logic
    isVector ? cacheStats.vectorMisses++ : cacheStats.misses++
    const response = await fetchTileWithRetryAndFallback(request, url)
    
    // 3. Cache successful response
    if (response.ok) {
      await cacheTileResponse(request, response, cacheName)
      await manageCacheSize(cacheName)
    }
    
    return response
    
  } catch (error) {
    console.error('❌ Advanced tile fetch failed:', error)
    cacheStats.networkErrors++
    
    // Final fallback - try any cached version
    const fallbackResponse = await getFallbackCachedTile(request)
    if (fallbackResponse) {
      console.log('🔄 Using fallback cached tile')
      return fallbackResponse
    }
    
    // Return placeholder tile
    return createPlaceholderTile(isVector)
  }
}

/**
 * Get cached tile if still valid
 */
async function getCachedTileIfValid(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  if (!cachedResponse) return null
  
  const cacheDate = new Date(cachedResponse.headers.get('sw-cached-date'))
  const daysDiff = (Date.now() - cacheDate.getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysDiff < maxAge) {
    console.log(`📦 Cache HIT (${cacheName}):`, request.url)
    return cachedResponse
  }
  
  console.log(`⏰ Cache EXPIRED (${daysDiff.toFixed(1)} days):`, request.url)
  return null
}

/**
 * Fetch tile with retry logic and CloudFlare proxy fallbacks
 */
async function fetchTileWithRetryAndFallback(request, url) {
  let attempt = 0
  let lastError
  
  // Try CloudFlare proxy first
  const proxyUrl = convertToProxyUrl(url)
  const urls = [proxyUrl, request.url]
  
  for (const fetchUrl of urls) {
    for (attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`🌐 Fetching (attempt ${attempt}):`, fetchUrl)
        
        const fetchRequest = new Request(fetchUrl, {
          method: request.method,
          headers: {
            'User-Agent': 'TeppekMap/2.0',
            'Accept': isVectorTile(url) ? 'application/x-protobuf' : 'image/*',
            'Cache-Control': 'max-age=3600'
          },
          mode: 'cors',
          credentials: 'omit'
        })
        
        const response = await fetchWithTimeout(fetchRequest, 10000)
        
        if (response.ok) {
          if (fetchUrl !== request.url) {
            console.log('✅ CloudFlare proxy success')
          }
          return response
        }
        
        if (response.status === 404) {
          // Don't retry 404s
          break
        }
        
      } catch (error) {
        lastError = error
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message)
        cacheStats.retries++
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await delay(Math.pow(2, attempt) * 1000) // Exponential backoff
        }
      }
    }
    
    // If first URL failed, try fallback
    if (fetchUrl === proxyUrl) {
      console.log('🔄 CloudFlare proxy failed, trying fallback...')
      cacheStats.fallbacks++
    }
  }
  
  throw lastError || new Error('All tile fetch attempts failed')
}

/**
 * Convert regular tile URL to CloudFlare proxy URL
 */
function convertToProxyUrl(url) {
  const tileMatch = url.pathname.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg|pbf)$/)
  if (!tileMatch) return url.href
  
  const [, z, x, y, format] = tileMatch
  
  if (format === 'pbf') {
    return TILE_SERVERS.vector.replace('{z}', z).replace('{x}', x).replace('{y}', y)
  }
  
  if (url.hostname.includes('arcgisonline.com')) {
    return TILE_SERVERS.satellite.replace('{z}', z).replace('{x}', x).replace('{y}', y)
  }
  
  if (isRetinaRequest(url)) {
    return TILE_SERVERS.osmRetina.replace('{z}', z).replace('{x}', x).replace('{y}', y)
  }
  
  return TILE_SERVERS.osm.replace('{z}', z).replace('{x}', x).replace('{y}', y)
}

/**
 * Cache tile response with metadata
 */
async function cacheTileResponse(request, response, cacheName) {
  const cache = await caches.open(cacheName)
  const responseToCache = response.clone()
  
  // Add cache metadata
  const headers = new Headers(responseToCache.headers)
  headers.set('sw-cached-date', new Date().toISOString())
  headers.set('sw-cache-version', CACHE_VERSION)
  headers.set('sw-tile-type', isVectorTile(new URL(request.url)) ? 'vector' : 'raster')
  
  const cachedResponse = new Response(responseToCache.body, {
    status: responseToCache.status,
    statusText: responseToCache.statusText,
    headers: headers
  })
  
  await cache.put(request, cachedResponse)
  console.log(`💾 Cached (${cacheName}):`, request.url)
}

/**
 * Advanced cache size management with 100MB limit
 */
async function manageCacheSize(targetCacheName) {
  try {
    const allCaches = await Promise.all([
      caches.open(RASTER_CACHE),
      caches.open(VECTOR_CACHE),
      caches.open(FALLBACK_CACHE)
    ])
    
    let totalEstimatedSize = 0
    const cacheInfo = []
    
    for (const [index, cache] of allCaches.entries()) {
      const requests = await cache.keys()
      const cacheName = [RASTER_CACHE, VECTOR_CACHE, FALLBACK_CACHE][index]
      const estimatedSize = requests.length * (cacheName.includes('vector') ? 20 : 50) // KB per tile
      
      totalEstimatedSize += estimatedSize
      cacheInfo.push({ cache, cacheName, requests, size: estimatedSize })
    }
    
    const totalSizeMB = totalEstimatedSize / 1024
    console.log(`📊 Total cache size: ${totalSizeMB.toFixed(1)}MB`)
    
    // Clean if over 100MB
    if (totalSizeMB > MAX_CACHE_SIZE_MB) {
      console.log('🧹 Cache size exceeded 100MB, cleaning...')
      
      // Clean oldest tiles from largest cache
      const largestCache = cacheInfo.sort((a, b) => b.size - a.size)[0]
      const tilesToDelete = Math.ceil(largestCache.requests.length * 0.3) // Remove 30%
      
      const oldestTiles = largestCache.requests.slice(0, tilesToDelete)
      await Promise.all(oldestTiles.map(request => largestCache.cache.delete(request)))
      
      console.log(`✨ Cleaned ${tilesToDelete} tiles from ${largestCache.cacheName}`)
    }
    
    // Individual cache limits
    for (const { cache, cacheName, requests } of cacheInfo) {
      const maxTiles = cacheName.includes('vector') ? 500 : 1500
      
      if (requests.length > maxTiles) {
        const tilesToDelete = requests.length - maxTiles
        const oldestTiles = requests.slice(0, tilesToDelete)
        await Promise.all(oldestTiles.map(request => cache.delete(request)))
        
        console.log(`✨ Cleaned ${tilesToDelete} tiles from ${cacheName}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Cache management error:', error)
  }
}

/**
 * Get fallback cached tile from any cache
 */
async function getFallbackCachedTile(request) {
  const caches = [RASTER_CACHE, VECTOR_CACHE, FALLBACK_CACHE]
  
  for (const cacheName of caches) {
    try {
      const cache = await caches.open(cacheName)
      const cachedResponse = await cache.match(request)
      if (cachedResponse) return cachedResponse
    } catch (error) {
      // Continue to next cache
    }
  }
  
  return null
}

/**
 * Create placeholder tile for failed requests
 */
function createPlaceholderTile(isVector = false) {
  if (isVector) {
    // Empty vector tile
    return new Response(new ArrayBuffer(0), {
      status: 200,
      headers: { 'Content-Type': 'application/x-protobuf' }
    })
  }
  
  // 1x1 transparent PNG
  const transparentPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA8jj7SQAAAABJRU5ErkJggg=='
  return fetch(transparentPng)
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request, timeout = 10000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Fetch timeout')), timeout)
    )
  ])
}

/**
 * Delay utility
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Advanced message handling for cache control and preloading
 */
self.addEventListener('message', event => {
  const { type, data } = event.data || {}
  
  switch (type) {
    case 'GET_CACHE_STATS':
      getAdvancedCacheStats().then(stats => {
        event.ports[0].postMessage(stats)
      })
      break
      
    case 'PRELOAD_TILES':
      preloadTiles(data.tiles, data.priority)
      break
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    case 'PRELOAD_CRITICAL':
      preloadCriticalTiles(data.lat, data.lng, data.zoom)
      break
      
    case 'SET_CACHE_STRATEGY':
      updateCacheStrategy(data.strategy)
      break
  }
})

/**
 * Preload critical tiles around a location
 */
async function preloadCriticalTiles(lat, lng, zoom = 12) {
  console.log(`🚀 Preloading critical tiles: ${lat}, ${lng} @ zoom ${zoom}`)
  
  const { x: centerX, y: centerY } = latLngToTile(lat, lng, zoom)
  const tilesToPreload = []
  
  // Create 5x5 grid around center (25 tiles)
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const x = centerX + dx
      const y = centerY + dy
      
      if (isValidTileCoord(x, y, zoom)) {
        // Raster tile
        tilesToPreload.push({
          url: TILE_SERVERS.osm.replace('{z}', zoom).replace('{x}', x).replace('{y}', y),
          priority: Math.abs(dx) + Math.abs(dy) // Distance from center
        })
        
        // Vector tile for higher zooms
        if (zoom >= 10) {
          tilesToPreload.push({
            url: TILE_SERVERS.vector.replace('{z}', zoom).replace('{x}', x).replace('{y}', y),
            priority: Math.abs(dx) + Math.abs(dy) + 10 // Lower priority
          })
        }
      }
    }
  }
  
  // Sort by priority and preload in batches
  tilesToPreload.sort((a, b) => a.priority - b.priority)
  
  for (let i = 0; i < tilesToPreload.length; i += PRELOAD_BATCH_SIZE) {
    const batch = tilesToPreload.slice(i, i + PRELOAD_BATCH_SIZE)
    await preloadTileBatch(batch)
    
    // Small delay between batches to avoid overwhelming network
    await delay(100)
  }
  
  cacheStats.preloadedTiles += tilesToPreload.length
  console.log(`✅ Preloaded ${tilesToPreload.length} critical tiles`)
}

/**
 * Preload a batch of tiles
 */
async function preloadTileBatch(tiles) {
  const promises = tiles.map(async ({ url }) => {
    try {
      const request = new Request(url, { mode: 'cors', credentials: 'omit' })
      const response = await fetchTileWithRetryAndFallback(request, new URL(url))
      
      if (response.ok) {
        const cacheName = url.endsWith('.pbf') ? VECTOR_CACHE : RASTER_CACHE
        await cacheTileResponse(request, response, cacheName)
      }
    } catch (error) {
      console.warn('⚠️ Preload failed:', url, error.message)
    }
  })
  
  await Promise.allSettled(promises)
}

/**
 * Lat/lng to tile coordinate conversion
 */
function latLngToTile(lat, lng, zoom) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
  return { x, y }
}

/**
 * Validate tile coordinates
 */
function isValidTileCoord(x, y, zoom) {
  const maxTile = Math.pow(2, zoom)
  return x >= 0 && x < maxTile && y >= 0 && y < maxTile
}

/**
 * Get comprehensive cache statistics
 */
async function getAdvancedCacheStats() {
  try {
    const [rasterCache, vectorCache, fallbackCache] = await Promise.all([
      caches.open(RASTER_CACHE),
      caches.open(VECTOR_CACHE),
      caches.open(FALLBACK_CACHE)
    ])
    
    const [rasterKeys, vectorKeys, fallbackKeys] = await Promise.all([
      rasterCache.keys(),
      vectorCache.keys(),
      fallbackCache.keys()
    ])
    
    const totalRequests = cacheStats.hits + cacheStats.misses + cacheStats.vectorHits + cacheStats.vectorMisses
    const hitRate = totalRequests > 0 ? ((cacheStats.hits + cacheStats.vectorHits) / totalRequests * 100).toFixed(1) : '0'
    
    const estimatedSize = {
      raster: (rasterKeys.length * 50 / 1024).toFixed(1), // 50KB per raster tile
      vector: (vectorKeys.length * 20 / 1024).toFixed(1), // 20KB per vector tile
      fallback: (fallbackKeys.length * 30 / 1024).toFixed(1), // 30KB per fallback tile
      total: ((rasterKeys.length * 50 + vectorKeys.length * 20 + fallbackKeys.length * 30) / 1024).toFixed(1)
    }
    
    return {
      version: CACHE_VERSION,
      caches: {
        raster: rasterKeys.length,
        vector: vectorKeys.length,
        fallback: fallbackKeys.length,
        total: rasterKeys.length + vectorKeys.length + fallbackKeys.length
      },
      performance: {
        hitRate: `${hitRate}%`,
        rasterHits: cacheStats.hits,
        rasterMisses: cacheStats.misses,
        vectorHits: cacheStats.vectorHits,
        vectorMisses: cacheStats.vectorMisses,
        retries: cacheStats.retries,
        fallbacks: cacheStats.fallbacks,
        networkErrors: cacheStats.networkErrors,
        preloadedTiles: cacheStats.preloadedTiles
      },
      storage: {
        estimatedSizeMB: estimatedSize,
        utilization: `${(parseFloat(estimatedSize.total) / MAX_CACHE_SIZE_MB * 100).toFixed(1)}%`
      },
      lastUpdated: new Date().toISOString()
    }
    
  } catch (error) {
    return { error: error.message, timestamp: new Date().toISOString() }
  }
}

/**
 * Clear all tile caches
 */
async function clearAllCaches() {
  console.log('🧹 Clearing all tile caches...')
  
  await Promise.all([
    caches.delete(RASTER_CACHE),
    caches.delete(VECTOR_CACHE),
    caches.delete(FALLBACK_CACHE)
  ])
  
  // Reset stats
  cacheStats = {
    hits: 0,
    misses: 0,
    vectorHits: 0,
    vectorMisses: 0,
    preloadedTiles: 0,
    retries: 0,
    fallbacks: 0,
    networkErrors: 0
  }
  
  console.log('✅ All caches cleared')
}