/**
 * 🚀 TILE CACHE SERVICE WORKER
 * Aggressive caching for map tiles to eliminate loading delays
 * Target: Cache tiles for instant LCP rendering
 */

const CACHE_NAME = 'teppek-tiles-v1'
const TILES_CACHE = 'teppek-map-tiles-v1'
const MAX_CACHE_SIZE = 50 // MB
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Tile server domains to cache
const TILE_DOMAINS = [
  'tile.openstreetmap.org',
  'a.tile.openstreetmap.org', 
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
  'server.arcgisonline.com'
]

self.addEventListener('install', (event) => {
  console.log('🔧 Tile Cache Worker: Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('🔧 Tile Cache Worker: Activated')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== TILES_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  
  // Only handle tile requests
  if (isTileRequest(url)) {
    event.respondWith(handleTileRequest(request))
  }
})

/**
 * Check if request is for map tiles
 */
function isTileRequest(url) {
  return TILE_DOMAINS.some(domain => url.hostname.includes(domain)) &&
         (url.pathname.includes('.png') || url.pathname.includes('.jpg'))
}

/**
 * Handle tile requests with aggressive caching
 */
async function handleTileRequest(request) {
  const cache = await caches.open(TILES_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Return cached tile immediately if available
  if (cachedResponse) {
    console.log('📦 Tile cache HIT:', request.url)
    
    // Check if cache is fresh (optional refresh in background)
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date'))
    const isStale = Date.now() - cacheDate.getTime() > CACHE_DURATION
    
    if (isStale) {
      // Refresh in background (stale-while-revalidate)
      fetchAndCache(request, cache).catch(() => {})
    }
    
    return cachedResponse
  }
  
  // Cache MISS - fetch and cache
  console.log('❌ Tile cache MISS:', request.url)
  return await fetchAndCache(request, cache)
}

/**
 * Fetch tile and cache it
 */
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request, {
      // Optimize tile fetching
      mode: 'cors',
      credentials: 'omit',
      priority: 'high'
    })
    
    if (response.ok) {
      // Clone response for caching
      const responseToCache = response.clone()
      
      // Add cache metadata
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cache-date', new Date().toISOString())
      headers.set('sw-cached', 'true')
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })
      
      // Cache the tile
      await cache.put(request, cachedResponse)
      console.log('💾 Tile cached:', request.url)
      
      // Cleanup old cache entries if needed
      await cleanupCache(cache)
      
      return response
    }
  } catch (error) {
    console.error('❌ Tile fetch failed:', error)
  }
  
  // Fallback to network without caching
  return fetch(request)
}

/**
 * Cleanup cache to prevent unlimited growth
 */
async function cleanupCache(cache) {
  const keys = await cache.keys()
  
  if (keys.length > 200) { // Max 200 tiles
    console.log('🧹 Cleaning up tile cache...')
    
    // Remove oldest 50 entries
    const keysToDelete = keys
      .slice(0, 50)
      .map(key => cache.delete(key))
    
    await Promise.all(keysToDelete)
  }
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'PRELOAD_TILES':
      preloadTiles(payload.urls)
      break
      
    case 'CLEAR_TILE_CACHE':
      clearTileCache()
      break
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats)
      })
      break
  }
})

/**
 * Preload specific tiles
 */
async function preloadTiles(urls) {
  console.log(`🚀 Preloading ${urls.length} tiles...`)
  
  const cache = await caches.open(TILES_CACHE)
  const preloadPromises = urls.map(url => {
    const request = new Request(url, { mode: 'cors', credentials: 'omit' })
    return fetchAndCache(request, cache)
  })
  
  try {
    await Promise.all(preloadPromises)
    console.log('✅ Tile preloading completed')
  } catch (error) {
    console.error('❌ Tile preloading failed:', error)
  }
}

/**
 * Clear all cached tiles
 */
async function clearTileCache() {
  console.log('🧹 Clearing tile cache...')
  await caches.delete(TILES_CACHE)
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const cache = await caches.open(TILES_CACHE)
  const keys = await cache.keys()
  
  return {
    cachedTiles: keys.length,
    cacheSize: keys.length * 50 + ' KB (estimated)',
    lastUpdated: new Date().toISOString()
  }
}