import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { debounce } from '../utils/debounce'

// Performance hook for large dataset map rendering (500k+ markers)
export function useMapPerformance(mapInstance, data, options = {}) {
  const {
    chunkSize = 100,           // Markers per chunk
    renderDelay = 16,          // Delay between chunks (ms)
    viewportPadding = 0.2,     // Viewport padding multiplier
    enableViewportFiltering = true,
    enableProgressiveLoading = true,
    maxMarkersInView = 1000,   // Max markers to render at once
    clusterThreshold = 15      // Zoom level to start clustering
  } = options

  const [visibleData, setVisibleData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const renderQueue = useRef([])
  const viewportBounds = useRef(null)
  const lastZoomLevel = useRef(null)
  const animationFrameId = useRef(null)

  // Debounced viewport change handler
  const debouncedViewportUpdate = useCallback(
    debounce(() => {
      if (!mapInstance || !enableViewportFiltering) return
      
      const bounds = mapInstance.getBounds()
      const zoom = mapInstance.getZoom()
      
      viewportBounds.current = bounds
      lastZoomLevel.current = zoom
      
      // Filter data based on viewport
      filterDataByViewport()
    }, 150),
    [mapInstance, data, enableViewportFiltering]
  )

  // Filter data based on current viewport
  const filterDataByViewport = useCallback(() => {
    if (!viewportBounds.current || !data) return

    const bounds = viewportBounds.current
    const zoom = lastZoomLevel.current
    
    // Calculate padding based on zoom level
    const padding = Math.max(viewportPadding * (20 - zoom) / 20, 0.1)
    
    const filteredData = data.filter(item => {
      if (!item.location) return false
      
      const { lat, lng } = item.location
      const latRange = bounds.getNorth() - bounds.getSouth()
      const lngRange = bounds.getEast() - bounds.getWest()
      
      const latPadding = latRange * padding
      const lngPadding = lngRange * padding
      
      return (
        lat >= bounds.getSouth() - latPadding &&
        lat <= bounds.getNorth() + latPadding &&
        lng >= bounds.getWest() - lngPadding &&
        lng <= bounds.getEast() + lngPadding
      )
    })

    // Limit markers based on zoom level and performance
    const shouldCluster = zoom < clusterThreshold
    const maxMarkers = shouldCluster ? maxMarkersInView * 2 : maxMarkersInView
    
    const limitedData = filteredData.slice(0, maxMarkers)
    
    setVisibleData(limitedData)
    
    // Update render progress
    setRenderProgress((limitedData.length / filteredData.length) * 100)
  }, [data, viewportPadding, maxMarkersInView, clusterThreshold])

  // Progressive loading with chunking
  const progressiveLoadData = useCallback(() => {
    if (!enableProgressiveLoading || !data.length) {
      setVisibleData(data)
      return
    }

    setIsLoading(true)
    setRenderProgress(0)
    
    // Clear previous render queue
    renderQueue.current = []
    
    // Split data into chunks
    for (let i = 0; i < data.length; i += chunkSize) {
      renderQueue.current.push(data.slice(i, i + chunkSize))
    }

    let processedChunks = 0
    const totalChunks = renderQueue.current.length

    const processNextChunk = () => {
      if (processedChunks >= totalChunks) {
        setIsLoading(false)
        setRenderProgress(100)
        return
      }

      const chunk = renderQueue.current[processedChunks]
      
      setVisibleData(prev => [...prev, ...chunk])
      setRenderProgress(((processedChunks + 1) / totalChunks) * 100)
      
      processedChunks++

      // Schedule next chunk
      animationFrameId.current = requestAnimationFrame(() => {
        setTimeout(processNextChunk, renderDelay)
      })
    }

    // Start processing
    setVisibleData([])
    processNextChunk()
  }, [data, chunkSize, renderDelay, enableProgressiveLoading])

  // Map event listeners
  useEffect(() => {
    if (!mapInstance) return

    const handleViewportChange = () => {
      debouncedViewportUpdate()
    }

    mapInstance.on('moveend', handleViewportChange)
    mapInstance.on('zoomend', handleViewportChange)
    mapInstance.on('resize', handleViewportChange)

    // Initial viewport setup
    if (mapInstance.getBounds()) {
      handleViewportChange()
    }

    return () => {
      mapInstance.off('moveend', handleViewportChange)
      mapInstance.off('zoomend', handleViewportChange)
      mapInstance.off('resize', handleViewportChange)
    }
  }, [mapInstance, debouncedViewportUpdate])

  // Data change handler
  useEffect(() => {
    if (enableProgressiveLoading) {
      progressiveLoadData()
    } else {
      filterDataByViewport()
    }

    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [data, progressiveLoadData, filterDataByViewport])

  // Performance metrics
  const metrics = useMemo(() => ({
    totalItems: data.length,
    visibleItems: visibleData.length,
    renderProgress,
    isLoading,
    currentZoom: lastZoomLevel.current,
    viewportBounds: viewportBounds.current
  }), [data.length, visibleData.length, renderProgress, isLoading])

  // Control functions
  const controls = {
    pauseRendering: () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      setIsLoading(false)
    },
    
    resumeRendering: () => {
      if (renderQueue.current.length > 0) {
        progressiveLoadData()
      }
    },
    
    refreshViewport: () => {
      debouncedViewportUpdate.cancel()
      debouncedViewportUpdate()
    },
    
    clearRendering: () => {
      setVisibleData([])
      renderQueue.current = []
      setRenderProgress(0)
      setIsLoading(false)
    }
  }

  return {
    visibleData,
    metrics,
    controls
  }
}

// Marker pooling hook for reusing marker instances
export function useMarkerPool(leafletInstance) {
  const markerPool = useRef([])
  const activeMarkers = useRef(new Set())

  const getMarker = useCallback((lat, lng, icon) => {
    let marker = markerPool.current.pop()
    
    if (!marker && leafletInstance) {
      marker = leafletInstance.marker([lat, lng], { icon })
    } else if (marker) {
      marker.setLatLng([lat, lng])
      if (icon) marker.setIcon(icon)
    }
    
    if (marker) {
      activeMarkers.current.add(marker)
    }
    
    return marker
  }, [leafletInstance])

  const releaseMarker = useCallback((marker) => {
    if (activeMarkers.current.has(marker)) {
      activeMarkers.current.delete(marker)
      markerPool.current.push(marker)
      
      // Clear event listeners to prevent memory leaks
      marker.off()
      
      // Hide marker
      if (marker._map) {
        marker.removeFrom(marker._map)
      }
    }
  }, [])

  const releaseAllMarkers = useCallback(() => {
    activeMarkers.current.forEach(marker => {
      marker.off()
      if (marker._map) {
        marker.removeFrom(marker._map)
      }
    })
    
    markerPool.current = [...markerPool.current, ...Array.from(activeMarkers.current)]
    activeMarkers.current.clear()
  }, [])

  const getPoolStats = useCallback(() => ({
    poolSize: markerPool.current.length,
    activeMarkers: activeMarkers.current.size,
    totalMarkers: markerPool.current.length + activeMarkers.current.size
  }), [])

  return {
    getMarker,
    releaseMarker,
    releaseAllMarkers,
    getPoolStats
  }
}

// Memory optimization hook
export function useMemoryOptimization(maxMemoryUsage = 100) { // MB
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const checkInterval = useRef(null)

  // Check memory usage
  const checkMemoryUsage = useCallback(() => {
    if (performance.memory) {
      const usage = performance.memory.usedJSHeapSize / (1024 * 1024) // MB
      setMemoryUsage(usage)
      
      if (usage > maxMemoryUsage && !isOptimizing) {
        triggerOptimization()
      }
    }
  }, [maxMemoryUsage, isOptimizing])

  // Trigger memory optimization
  const triggerOptimization = useCallback(() => {
    setIsOptimizing(true)
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }
    
    // Clear image caches
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (!img.dataset.critical) {
        img.src = ''
      }
    })
    
    // Clear leaflet tile cache
    if (window.L && window.L.Browser) {
      // Clear tile cache implementation would go here
    }
    
    setTimeout(() => {
      setIsOptimizing(false)
    }, 1000)
  }, [])

  // Start memory monitoring
  useEffect(() => {
    checkInterval.current = setInterval(checkMemoryUsage, 5000) // Check every 5s
    
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
      }
    }
  }, [checkMemoryUsage])

  return {
    memoryUsage,
    isOptimizing,
    triggerOptimization,
    maxMemoryUsage
  }
}

// Performance statistics hook
export function usePerformanceStats() {
  const [stats, setStats] = useState({
    renderTime: 0,
    frameRate: 0,
    markers: {
      total: 0,
      visible: 0,
      clustered: 0
    },
    memory: {
      used: 0,
      limit: 0
    }
  })

  const frameCount = useRef(0)
  const lastFrameTime = useRef(performance.now())
  const measurementInterval = useRef(null)

  // Measure render performance
  const measureRenderTime = useCallback((callback) => {
    const startTime = performance.now()
    
    const result = callback()
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    setStats(prev => ({
      ...prev,
      renderTime
    }))
    
    return result
  }, [])

  // Start performance monitoring
  useEffect(() => {
    const updateStats = () => {
      const now = performance.now()
      const deltaTime = now - lastFrameTime.current
      frameCount.current++
      
      if (deltaTime >= 1000) { // Update every second
        const fps = Math.round((frameCount.current * 1000) / deltaTime)
        
        setStats(prev => ({
          ...prev,
          frameRate: fps,
          memory: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)),
            limit: Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024))
          } : prev.memory
        }))
        
        frameCount.current = 0
        lastFrameTime.current = now
      }
    }

    measurementInterval.current = setInterval(updateStats, 100)
    
    return () => {
      if (measurementInterval.current) {
        clearInterval(measurementInterval.current)
      }
    }
  }, [])

  const updateMarkerStats = useCallback((total, visible, clustered = 0) => {
    setStats(prev => ({
      ...prev,
      markers: { total, visible, clustered }
    }))
  }, [])

  return {
    stats,
    measureRenderTime,
    updateMarkerStats
  }
}