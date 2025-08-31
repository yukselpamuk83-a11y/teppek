// Harita performans optimizasyon utilities

// Marker chunking - büyük veri setlerini parçalara böl
export const chunkData = (data, chunkSize = 100) => {
  const chunks = []
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize))
  }
  return chunks
}

// Viewport based filtering - sadece görünür alandaki marker'ları göster
export const filterDataByViewport = (data, bounds, padding = 0.1) => {
  if (!bounds || !data) return data
  
  const { _southWest, _northEast } = bounds
  const latPadding = (_northEast.lat - _southWest.lat) * padding
  const lngPadding = (_northEast.lng - _southWest.lng) * padding
  
  return data.filter(item => {
    const { lat, lng } = item.location
    return (
      lat >= _southWest.lat - latPadding &&
      lat <= _northEast.lat + latPadding &&
      lng >= _southWest.lng - lngPadding &&
      lng <= _northEast.lng + lngPadding
    )
  })
}

// Marker pooling - marker'ları yeniden kullan
export class MarkerPool {
  constructor() {
    this.pool = []
    this.activeMarkers = new Set()
  }
  
  getMarker() {
    if (this.pool.length > 0) {
      const marker = this.pool.pop()
      this.activeMarkers.add(marker)
      return marker
    }
    return null
  }
  
  releaseMarker(marker) {
    if (this.activeMarkers.has(marker)) {
      this.activeMarkers.delete(marker)
      this.pool.push(marker)
    }
  }
  
  clear() {
    this.pool = []
    this.activeMarkers.clear()
  }
}

// Debounced marker update
export const createDebouncedMarkerUpdate = (updateFn, delay = 300) => {
  let timeoutId = null
  
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      updateFn.apply(null, args)
      timeoutId = null
    }, delay)
  }
}

// Progressive loading - marker'ları kademeli yükle
export const progressiveLoadMarkers = (data, clusterGroup, L, chunkSize = 50, delay = 100) => {
  return new Promise((resolve) => {
    const chunks = chunkData(data, chunkSize)
    let currentChunk = 0
    
    const loadNextChunk = () => {
      if (currentChunk >= chunks.length) {
        resolve()
        return
      }
      
      const chunk = chunks[currentChunk]
      const markers = chunk.map(item => {
        const marker = L.marker([item.location.lat, item.location.lng])
        return marker
      })
      
      clusterGroup.addLayers(markers)
      currentChunk++
      
      setTimeout(loadNextChunk, delay)
    }
    
    loadNextChunk()
  })
}