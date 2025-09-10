/**
 * CloudFlare Worker for teppek.com - Optimized Tile Proxy Service
 * Domain: tiles.teppek.com
 * Purpose: High-performance tile proxy with edge caching and CORS support
 * Region: Optimized for Turkey/Europe
 * 
 * Features:
 * - OpenStreetMap tile proxying
 * - 7-day aggressive caching
 * - CORS support for React applications
 * - Retry logic and error handling
 * - Compression and optimization
 * - Analytics tracking
 * - Mobile/desktop optimization
 */

// 🌍 Tile provider configurations
const TILE_PROVIDERS = {
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: 'OpenStreetMap',
    cacheTtl: 604800, // 7 days
    retryAttempts: 3
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: 'Esri',
    cacheTtl: 604800, // 7 days
    retryAttempts: 2
  }
};

// 🚀 Performance and caching configuration
const CACHE_CONFIG = {
  // Browser cache (client-side)
  browserCache: 86400, // 24 hours
  
  // CloudFlare edge cache (CDN)
  edgeCache: 604800, // 7 days
  
  // Stale while revalidate
  staleWhileRevalidate: 86400, // 24 hours
  
  // Error cache (failed requests)
  errorCache: 300 // 5 minutes
};

// 🌍 CORS configuration for teppek.com
const CORS_CONFIG = {
  allowedOrigins: [
    'https://teppek.com',
    'https://www.teppek.com',
    'https://teppek.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours preflight cache
};

// 🎯 Main request handler
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // ✅ Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCorsOptions(request);
  }
  
  // 🗺️ Handle tile requests
  if (url.pathname.match(/^\/(osm|satellite)\/\d+\/\d+\/\d+\.(png|jpg|jpeg)$/)) {
    return handleTileRequest(request, url);
  }
  
  // 📊 Health check and status endpoint
  if (url.pathname === '/health' || url.pathname === '/status') {
    return handleHealthCheck();
  }
  
  // ❌ Invalid request
  return new Response('Invalid tile request', { 
    status: 404,
    headers: getCorsHeaders(request)
  });
}

// 🗺️ Tile request handler with caching and optimization
async function handleTileRequest(request, url) {
  const startTime = Date.now();
  
  try {
    // Parse tile parameters
    const pathParts = url.pathname.split('/');
    const [, provider, z, x, y] = pathParts;
    const tileFile = pathParts[4]; // e.g., "123.png"
    const extension = tileFile.split('.')[1];
    
    // Validate tile parameters
    if (!validateTileParams(provider, z, x, y)) {
      return createErrorResponse('Invalid tile parameters', 400, request);
    }
    
    // Create cache key
    const cacheKey = `tile:${provider}:${z}:${x}:${y}:${extension}`;
    const cache = caches.default;
    
    // 🚀 Try cache first (CloudFlare edge cache)
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      // Add cache hit headers
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set('X-Cache-Status', 'HIT');
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      addCorsHeaders(response, request);
      return response;
    }
    
    // 📡 Fetch from upstream with retry logic
    const tileResponse = await fetchTileWithRetry(provider, z, x, y, extension);
    
    if (!tileResponse.ok) {
      return createErrorResponse(`Upstream error: ${tileResponse.status}`, tileResponse.status, request);
    }
    
    // 🎯 Create optimized response with caching headers
    const optimizedResponse = await createOptimizedTileResponse(
      tileResponse, 
      provider, 
      extension, 
      request
    );
    
    // 💾 Cache the response
    const responseToCache = optimizedResponse.clone();
    responseToCache.headers.set('Cache-Control', `public, max-age=${CACHE_CONFIG.edgeCache}`);
    
    // Store in CloudFlare edge cache
    event.waitUntil(cache.put(cacheKey, responseToCache));
    
    // Add performance headers
    optimizedResponse.headers.set('X-Cache-Status', 'MISS');
    optimizedResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    
    return optimizedResponse;
    
  } catch (error) {
    console.error('Tile request error:', error);
    
    // 🔄 Try to serve stale content if available
    const staleResponse = await getStaleResponse(url.pathname);
    if (staleResponse) {
      staleResponse.headers.set('X-Cache-Status', 'STALE');
      addCorsHeaders(staleResponse, request);
      return staleResponse;
    }
    
    return createErrorResponse('Tile service temporarily unavailable', 503, request);
  }
}

// 🔄 Fetch tile with retry logic and failover
async function fetchTileWithRetry(provider, z, x, y, extension) {
  const config = TILE_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown tile provider: ${provider}`);
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      // Build upstream URL
      const upstreamUrl = config.url
        .replace('{z}', z)
        .replace('{x}', x)
        .replace('{y}', y);
      
      // Add jitter to prevent thundering herd
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 * attempt));
      }
      
      const response = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'teppek.com-tile-proxy/1.0 (+https://teppek.com)',
          'Accept': extension === 'png' ? 'image/png' : 'image/jpeg',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        cf: {
          // CloudFlare-specific optimizations
          cacheEverything: true,
          cacheTtl: config.cacheTtl,
          polish: 'lossy', // Image optimization
          minify: {
            javascript: false,
            css: false,
            html: false
          }
        }
      });
      
      if (response.ok) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error;
      console.warn(`Tile fetch attempt ${attempt} failed:`, error.message);
    }
  }
  
  throw lastError;
}

// 🎯 Create optimized tile response with proper headers
async function createOptimizedTileResponse(upstreamResponse, provider, extension, originalRequest) {
  const config = TILE_PROVIDERS[provider];
  
  // Determine content type
  const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';
  
  // Create response with optimized headers
  const response = new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${CACHE_CONFIG.browserCache}, s-maxage=${CACHE_CONFIG.edgeCache}, stale-while-revalidate=${CACHE_CONFIG.staleWhileRevalidate}`,
      'Expires': new Date(Date.now() + CACHE_CONFIG.browserCache * 1000).toUTCString(),
      'ETag': `"${provider}-${Date.now()}"`,
      'Vary': 'Accept-Encoding',
      
      // Performance headers
      'X-Tile-Provider': provider,
      'X-Max-Zoom': config.maxZoom.toString(),
      'X-Served-By': 'cloudflare-worker-teppek.com',
      
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Compression
      'Content-Encoding': upstreamResponse.headers.get('Content-Encoding') || 'identity'
    }
  });
  
  // Add CORS headers
  addCorsHeaders(response, originalRequest);
  
  return response;
}

// ✅ Validate tile parameters
function validateTileParams(provider, z, x, y) {
  // Check provider
  if (!TILE_PROVIDERS[provider]) {
    return false;
  }
  
  // Parse and validate coordinates
  const zoom = parseInt(z);
  const tileX = parseInt(x);
  const tileY = parseInt(y);
  
  // Validate zoom level
  if (zoom < 0 || zoom > TILE_PROVIDERS[provider].maxZoom) {
    return false;
  }
  
  // Validate tile coordinates for zoom level
  const maxTileIndex = Math.pow(2, zoom) - 1;
  if (tileX < 0 || tileX > maxTileIndex || tileY < 0 || tileY > maxTileIndex) {
    return false;
  }
  
  return true;
}

// 🌐 Handle CORS preflight requests
function handleCorsOptions(request) {
  const origin = request.headers.get('Origin');
  
  if (isAllowedOrigin(origin)) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': CORS_CONFIG.allowedMethods.join(', '),
        'Access-Control-Allow-Headers': CORS_CONFIG.allowedHeaders.join(', '),
        'Access-Control-Max-Age': CORS_CONFIG.maxAge.toString(),
        'Vary': 'Origin'
      }
    });
  }
  
  return new Response('CORS not allowed', { status: 403 });
}

// 🌐 Add CORS headers to response
function addCorsHeaders(response, request) {
  const origin = request.headers.get('Origin');
  
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '));
    response.headers.set('Vary', 'Origin');
  }
}

// 🌐 Get CORS headers object
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const headers = {};
  
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = CORS_CONFIG.allowedMethods.join(', ');
    headers['Access-Control-Allow-Headers'] = CORS_CONFIG.allowedHeaders.join(', ');
    headers['Vary'] = 'Origin';
  }
  
  return headers;
}

// ✅ Check if origin is allowed
function isAllowedOrigin(origin) {
  if (!origin) return false;
  
  // Allow exact matches
  if (CORS_CONFIG.allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Allow localhost with any port for development
  if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
    return true;
  }
  
  return false;
}

// 📊 Health check endpoint
function handleHealthCheck() {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'teppek.com-tile-proxy',
    version: '1.0.0',
    region: 'Turkey/Europe optimized',
    providers: Object.keys(TILE_PROVIDERS),
    cache_config: CACHE_CONFIG,
    uptime: Date.now()
  };
  
  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

// ❌ Create error response
function createErrorResponse(message, status, request) {
  const errorResponse = new Response(
    JSON.stringify({
      error: message,
      status: status,
      timestamp: new Date().toISOString(),
      service: 'teppek.com-tile-proxy'
    }), 
    {
      status: status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_CONFIG.errorCache}`,
        ...getCorsHeaders(request)
      }
    }
  );
  
  return errorResponse;
}

// 🔄 Try to get stale response
async function getStaleResponse(pathname) {
  try {
    const cache = caches.default;
    const cacheKey = `stale:${pathname}`;
    return await cache.match(cacheKey);
  } catch (error) {
    console.warn('Failed to retrieve stale response:', error);
    return null;
  }
}

// 📈 Analytics tracking (optional - can be connected to CloudFlare Analytics)
function trackTileRequest(provider, z, x, y, cacheStatus, responseTime) {
  // This can be extended to send data to CloudFlare Analytics API
  // or other analytics services
  console.log(`Tile request: ${provider}/${z}/${x}/${y} - ${cacheStatus} - ${responseTime}ms`);
}