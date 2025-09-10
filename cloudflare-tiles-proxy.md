# CloudFlare Tile Proxy Configuration

This document describes how to set up CloudFlare as a proxy for map tiles to improve performance and reliability.

## Overview

The advanced tile caching system uses CloudFlare's edge network to:
- Cache tiles closer to users for faster loading
- Provide fallback servers for better reliability
- Compress tiles for reduced bandwidth
- Handle SSL/TLS termination
- Provide DDoS protection

## CloudFlare Worker Setup

### 1. Create a CloudFlare Worker

```javascript
// CloudFlare Worker for Tile Proxy (tile-proxy-worker.js)

const TILE_SERVERS = {
  osm: {
    primary: 'https://a.tile.openstreetmap.org',
    fallbacks: [
      'https://b.tile.openstreetmap.org',
      'https://c.tile.openstreetmap.org'
    ]
  },
  satellite: {
    primary: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile',
    fallbacks: []
  }
}

const CACHE_TTL = 7 * 24 * 60 * 60 // 7 days

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Parse tile request
    const pathMatch = url.pathname.match(/^\/(\w+)\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|pbf)$/)
    if (!pathMatch) {
      return new Response('Invalid tile request', { status: 400 })
    }
    
    const [, tileType, z, x, y, format] = pathMatch
    
    // Validate tile coordinates
    const zoom = parseInt(z)
    const maxTile = Math.pow(2, zoom)
    if (parseInt(x) >= maxTile || parseInt(y) >= maxTile) {
      return new Response('Invalid tile coordinates', { status: 400 })
    }
    
    // Build upstream URL
    let upstreamUrl
    if (tileType === 'osm') {
      upstreamUrl = `${TILE_SERVERS.osm.primary}/${z}/${x}/${y}.${format}`
    } else if (tileType === 'satellite') {
      upstreamUrl = `${TILE_SERVERS.satellite.primary}/${z}/${y}/${x}`
    } else if (tileType === 'vector') {
      // For vector tiles, you'd configure your vector tile server here
      return new Response('Vector tiles not configured', { status: 404 })
    } else {
      return new Response('Unknown tile type', { status: 400 })
    }
    
    // Check cache first
    const cacheKey = new Request(request.url, request)
    const cache = caches.default
    let response = await cache.match(cacheKey)
    
    if (response) {
      // Add cache hit header
      response = new Response(response.body, response)
      response.headers.set('CF-Cache-Status', 'HIT')
      return response
    }
    
    // Cache miss - fetch from upstream
    try {
      response = await fetchWithFallback(upstreamUrl, TILE_SERVERS[tileType]?.fallbacks)
      
      if (response.ok) {
        // Clone response for caching
        const responseToCache = response.clone()
        
        // Set cache headers
        const headers = new Headers(responseToCache.headers)
        headers.set('Cache-Control', `public, max-age=${CACHE_TTL}`)
        headers.set('CF-Cache-Status', 'MISS')
        headers.set('Access-Control-Allow-Origin', '*')
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        })
        
        // Cache the response
        ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()))
        
        return cachedResponse
      }
    } catch (error) {
      console.error('Tile fetch error:', error)
    }
    
    // Return 404 tile or error
    return new Response('Tile not found', { status: 404 })
  }
}

async function fetchWithFallback(primaryUrl, fallbackUrls = []) {
  // Try primary server
  try {
    const response = await fetch(primaryUrl, {
      headers: {
        'User-Agent': 'TeppekMap-CloudFlare-Proxy/2.0'
      }
    })
    
    if (response.ok) {
      return response
    }
  } catch (error) {
    console.warn('Primary server failed:', error)
  }
  
  // Try fallback servers
  for (const fallbackUrl of fallbackUrls) {
    try {
      const modifiedUrl = primaryUrl.replace(
        /https:\/\/[^\/]+/, 
        fallbackUrl
      )
      
      const response = await fetch(modifiedUrl, {
        headers: {
          'User-Agent': 'TeppekMap-CloudFlare-Proxy/2.0'
        }
      })
      
      if (response.ok) {
        return response
      }
    } catch (error) {
      console.warn('Fallback server failed:', error)
    }
  }
  
  throw new Error('All servers failed')
}
```

### 2. CloudFlare DNS Configuration

Set up DNS records for your tile proxy:

```
tiles.teppek.com CNAME your-worker.your-subdomain.workers.dev
```

### 3. CloudFlare Page Rules

Configure page rules for optimal caching:

1. **Rule 1: tiles.teppek.com/osm/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 7 days
   - Browser Cache TTL: 7 days

2. **Rule 2: tiles.teppek.com/satellite/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 30 days
   - Browser Cache TTL: 7 days

3. **Rule 3: tiles.teppek.com/vector/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 7 days
   - Browser Cache TTL: 1 day

## Alternative: CloudFlare Transform Rules

Instead of a Worker, you can use Transform Rules for simpler proxying:

### Request URL Transform Rule

```yaml
Rule Name: OSM Tile Proxy
When: hostname equals "tiles.teppek.com" and path starts with "/osm/"
Then: 
  - Rewrite URL: https://a.tile.openstreetmap.org${uri.path.replace("/osm/", "/")}
```

### Response Header Transform Rule

```yaml
Rule Name: Tile CORS Headers
When: hostname equals "tiles.teppek.com"
Then:
  - Set header "Access-Control-Allow-Origin" to "*"
  - Set header "Cache-Control" to "public, max-age=604800"
```

## Performance Benefits

Expected improvements with CloudFlare proxy:

1. **Reduced Latency**: 30-70% faster tile loading from edge locations
2. **Better Reliability**: Automatic failover to backup servers
3. **Bandwidth Savings**: Compression and caching reduce data usage
4. **DDoS Protection**: CloudFlare's protection shields tile servers
5. **Global CDN**: Tiles cached across CloudFlare's global network

## Monitoring

Monitor tile proxy performance:

1. **CloudFlare Analytics**
   - Cache hit ratio
   - Bandwidth savings
   - Response times
   - Error rates

2. **Application Metrics**
   - Tile load times
   - Cache hit rates
   - Fallback usage
   - Network errors

## Cost Optimization

CloudFlare pricing considerations:

- **Free Plan**: 100,000 requests/day (sufficient for most apps)
- **Pro Plan**: $20/month for higher limits
- **Workers**: $5/month for 10M requests
- **Bandwidth**: Free for cached content

## Security

Security measures for tile proxy:

1. **Rate Limiting**: Prevent abuse
2. **Referer Validation**: Only allow your domain
3. **User Agent Filtering**: Block suspicious requests
4. **IP Allowlisting**: Restrict to specific regions if needed

## Testing

Test the CloudFlare proxy setup:

```bash
# Test OSM tiles
curl -v "https://tiles.teppek.com/osm/12/2048/1362.png"

# Test satellite tiles  
curl -v "https://tiles.teppek.com/satellite/12/2048/1362.jpg"

# Check cache headers
curl -I "https://tiles.teppek.com/osm/12/2048/1362.png"
```

## Fallback Strategy

If CloudFlare proxy fails:

1. Service Worker detects failures
2. Automatically switches to direct tile servers
3. Logs errors for monitoring
4. Retries CloudFlare after cooldown period

This ensures maximum reliability for your map application.