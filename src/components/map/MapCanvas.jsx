import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * MapCanvas - Core map rendering component
 * Handles: Map initialization, tile layers, user location, basic map controls
 */
function MapCanvas({ 
  userLocation, 
  onMapReady,
  tileProvider = 'street',
  className = '',
  performanceMode = 'balanced'
}) {
  const { t } = useTranslation()
  
  // Refs
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circleRef = useRef(null)
  const userMarkerRef = useRef(null)
  const [tileLayer, setTileLayer] = useState(null)
  
  // Leaflet instances
  const [L, setL] = useState(null)
  
  // Tile providers
  const tileProviders = {
    street: { 
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
    },
    satellite: { 
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
      attribution: 'Tiles &copy; Esri' 
    }
  }

  // Load Leaflet dynamically
  const loadLeaflet = async () => {
    if (typeof window !== 'undefined' && !window.L) {
      try {
        // Load CSS files
        const cssFiles = [
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        ]
        
        await Promise.all(cssFiles.map(href => {
          return new Promise((resolve) => {
            if (!document.querySelector(`link[href="${href}"]`)) {
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = href
              link.onload = resolve
              document.head.appendChild(link)
            } else {
              resolve()
            }
          })
        }))
        
        // Load Leaflet JS
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
        
        setL(window.L)
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
      }
    } else if (window.L) {
      setL(window.L)
    }
  }

  // Inject custom styles
  const injectStyles = () => {
    if (document.getElementById('map-canvas-styles')) return
    
    const style = document.createElement('style')
    style.id = 'map-canvas-styles'
    style.textContent = `
      .user-location-icon {
        color: #3b82f6;
        font-size: 24px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        z-index: 1000;
      }
      .map-canvas-container {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .leaflet-container {
        background: #f8fafc;
      }
    `
    document.head.appendChild(style)
  }

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      await loadLeaflet()
      
      if (mapRef.current && !mapInstance.current && L && userLocation) {
        try {
          injectStyles()
          
          const lat = userLocation?.lat || 41.01
          const lng = userLocation?.lng || 28.97
        
          mapInstance.current = L.map(mapRef.current, {
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0,
            minZoom: 2,
            maxZoom: 18
          }).setView([lat, lng], 10)
        
          const initialLayer = L.tileLayer(tileProviders[tileProvider].url, {
            attribution: tileProviders[tileProvider].attribution,
            noWrap: true,
            bounds: [[-90, -180], [90, 180]]
          }).addTo(mapInstance.current)
          setTileLayer(initialLayer)

          // User location circle
          circleRef.current = L.circle([lat, lng], {
            radius: 50000, 
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.1,
            weight: 1
          }).addTo(mapInstance.current)

          // User marker
          const userIcon = L.divIcon({
            html: `<i class="fa-solid fa-location-pin user-location-icon"></i>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
          userMarkerRef.current = L.marker([lat, lng], { 
            icon: userIcon, 
            zIndexOffset: 1000 
          }).addTo(mapInstance.current)

          // Notify parent that map is ready
          if (onMapReady) {
            onMapReady(mapInstance.current, L)
          }

          console.log('✅ MapCanvas: Initialized successfully')
        } catch (error) {
          console.error('❌ MapCanvas: Initialization failed:', error)
        }
      }
    }

    initMap()
  }, [L, userLocation, tileProvider, onMapReady])

  // Change tile provider
  const changeTileProvider = useCallback((provider) => {
    if (!mapInstance.current || !L || !tileProviders[provider]) return
    
    if (tileLayer) {
      mapInstance.current.removeLayer(tileLayer)
    }
    
    const newLayer = L.tileLayer(tileProviders[provider].url, {
      attribution: tileProviders[provider].attribution,
      noWrap: true,
      bounds: [[-90, -180], [90, 180]]
    }).addTo(mapInstance.current)
    
    setTileLayer(newLayer)
  }, [L, mapInstance.current, tileLayer])

  // Update user location
  const updateUserLocation = useCallback((newLocation) => {
    if (!mapInstance.current || !L || !newLocation) return
    
    const { lat, lng } = newLocation
    
    // Update circle
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng])
    }
    
    // Update marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng])
    }
    
    // Pan to new location
    mapInstance.current.panTo([lat, lng])
  }, [L, mapInstance.current])

  // Expose methods to parent
  React.useImperativeHandle(onMapReady, () => ({
    getMapInstance: () => mapInstance.current,
    getLeaflet: () => L,
    changeTileProvider,
    updateUserLocation,
    panTo: (lat, lng, zoom) => {
      if (mapInstance.current) {
        mapInstance.current.setView([lat, lng], zoom || mapInstance.current.getZoom())
      }
    }
  }), [L, mapInstance.current, changeTileProvider, updateUserLocation])

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  return (
    <div className={`map-canvas-container ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ minHeight: '300px' }}
      />
    </div>
  )
}

export default MapCanvas