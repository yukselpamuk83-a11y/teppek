import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { debounce } from '../utils/debounce'
import { createPopup, createPremiumPopup } from '../utils/popupGenerator'
import { createCVPopup, createCVPremiumPopup, CV_POPUP_STYLES } from '../utils/cvPopupGenerator'
import { CVMarker, CV_MARKER_STYLES } from './markers/CVMarker'
import { TimelineModal } from './timeline/TimelineModal'
import { LayerControls, CompactLayerControls } from './controls/LayerControls'
import { DualFilterSystem, CompactDualFilters } from './filters/DualFilterSystem'
import { useLayerContext, useTimelineModal } from '../contexts/LayerContext'
import { useMapPerformance, useMarkerPool, usePerformanceStats } from '../hooks/useMapPerformance'

// Enhanced Map Component with dual layer system (Jobs + CVs)
function EnhancedMapComponent({ 
  userLocation, 
  isSubscribed, 
  onPremiumClick,
  performanceMode = 'balanced' // 'performance' | 'balanced' | 'quality'
}) {
  const { t } = useTranslation()
  const { state, actions } = useLayerContext()
  const { open: openTimelineModal } = useTimelineModal()
  
  // Map refs
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const jobClusterGroupRef = useRef(null)
  const cvClusterGroupRef = useRef(null)
  const circleRef = useRef(null)
  const userMarkerRef = useRef(null)
  const [tileLayer, setTileLayer] = useState(null)

  // Leaflet instances
  const [L, setL] = useState(null)
  const [MarkerClusterGroup, setMarkerClusterGroup] = useState(null)

  // Performance hooks
  const performanceConfig = {
    performance: { chunkSize: 50, maxMarkersInView: 500, enableProgressiveLoading: true },
    balanced: { chunkSize: 100, maxMarkersInView: 1000, enableProgressiveLoading: true },
    quality: { chunkSize: 200, maxMarkersInView: 2000, enableProgressiveLoading: false }
  }

  const {
    visibleData: visibleJobData,
    metrics: jobMetrics,
    controls: jobControls
  } = useMapPerformance(mapInstance.current, state.jobs.data, performanceConfig[performanceMode])

  const {
    visibleData: visibleCVData,
    metrics: cvMetrics,
    controls: cvControls
  } = useMapPerformance(mapInstance.current, state.cvs.data, performanceConfig[performanceMode])

  const { getMarker, releaseMarker, releaseAllMarkers, getPoolStats } = useMarkerPool(L)
  const { stats, measureRenderTime, updateMarkerStats } = usePerformanceStats()

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
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
          'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
          'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css'
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
        
        // Load MarkerCluster JS
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
        
        setL(window.L)
        setMarkerClusterGroup(window.L.markerClusterGroup)
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
      }
    } else if (window.L) {
      setL(window.L)
      setMarkerClusterGroup(window.L.markerClusterGroup)
    }
  }

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      await loadLeaflet()
      
      if (mapRef.current && !mapInstance.current && L && userLocation) {
        try {
          // Inject styles
          injectStyles()
          
          const lat = userLocation?.lat || 41.01
          const lng = userLocation?.lng || 28.97
        
          mapInstance.current = L.map(mapRef.current, {
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0,
            minZoom: 2,
            maxZoom: 18
          }).setView([lat, lng], 10)
        
          const initialLayer = L.tileLayer(tileProviders.street.url, {
            attribution: tileProviders.street.attribution,
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

          // Create cluster groups for each layer
          jobClusterGroupRef.current = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            spiderfyDistanceMultiplier: 3,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
              const count = cluster.getChildCount()
              return L.divIcon({
                html: `
                  <div class="job-cluster-marker">
                    <div class="job-cluster-icon">
                      <i class="fa-solid fa-briefcase"></i>
                      <span class="job-cluster-count">${count}</span>
                    </div>
                  </div>
                `,
                className: 'cluster-icon',
                iconSize: L.point(40, 40)
              })
            }
          })

          cvClusterGroupRef.current = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            spiderfyDistanceMultiplier: 3,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
              const count = cluster.getChildCount()
              return L.divIcon({
                html: `
                  <div class="cv-cluster-marker">
                    <div class="cv-cluster-icon">
                      <i class="fa-solid fa-users"></i>
                      <span class="cv-cluster-count">${count}</span>
                    </div>
                  </div>
                `,
                className: 'cluster-icon',
                iconSize: L.point(40, 40)
              })
            }
          })

          // Add cluster groups to map
          mapInstance.current.addLayer(jobClusterGroupRef.current)
          mapInstance.current.addLayer(cvClusterGroupRef.current)

          // Map event handlers
          mapInstance.current.on('zoomend moveend', () => {
            setTimeout(() => {
              if (jobClusterGroupRef.current) jobClusterGroupRef.current.refreshClusters()
              if (cvClusterGroupRef.current) cvClusterGroupRef.current.refreshClusters()
            }, 100)
          })

          // Fit to circle bounds
          mapInstance.current.fitBounds(circleRef.current.getBounds())
          
        } catch (error) {
          console.error('Map initialization error:', error)
        }
      }
    }
    
    initMap()
  }, [L, userLocation])

  // Inject CSS styles
  const injectStyles = useCallback(() => {
    if (!document.querySelector('#cv-popup-styles')) {
      const styleElement = document.createElement('style')
      styleElement.id = 'cv-popup-styles'
      styleElement.innerHTML = CV_POPUP_STYLES + CV_MARKER_STYLES
      document.head.appendChild(styleElement)
    }
  }, [])

  // Render job markers
  useEffect(() => {
    if (!jobClusterGroupRef.current || !L || !state.jobs.visible) return

    measureRenderTime(() => {
      // Clear existing markers
      jobClusterGroupRef.current.clearLayers()

      visibleJobData.forEach((item) => {
        const canView = isSubscribed || item.source === 'manual'
        
        const iconClass = item.type === 'job' ? 'fa-briefcase' : 'fa-user'
        const iconColor = item.type === 'job' ? '#0097A7' : '#FB8C00'
        const markerHtml = `
          <div class="marker-container ${item.isSponsored ? 'sponsored-marker' : ''}">
            <div class="icon-wrapper" style="border-color: ${item.isSponsored ? '#FBBF24' : iconColor};">
              ${item.isSponsored ? '<i class="fa-solid fa-star absolute -top-2 -right-2 text-yellow-400 text-xl"></i>' : ''}
              <i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i>
            </div>
            <div class="marker-label">${item.title}</div>
          </div>
        `
        
        const customIcon = L.divIcon({ 
          html: markerHtml, 
          className: '', 
          iconSize: [120, 90], 
          iconAnchor: [60, 26] 
        })
        
        const leafletMarker = L.marker([item.location.lat, item.location.lng], { icon: customIcon })
        const popupContent = canView ? createPopup(item) : createPremiumPopup()
        
        leafletMarker.bindPopup(popupContent)
        leafletMarker.on('click', function(e) { this.openPopup() })
        
        if (!canView) {
          leafletMarker.on('popupopen', () => {
            const btn = document.getElementById(`subscribe-btn-${item.id}`)
            if (btn) btn.onclick = onPremiumClick
          })
        }
        
        jobClusterGroupRef.current.addLayer(leafletMarker)
      })

      updateMarkerStats(
        state.jobs.data.length,
        visibleJobData.length,
        jobMetrics.isLoading ? 0 : visibleJobData.length
      )
    })
  }, [visibleJobData, state.jobs.visible, L, isSubscribed, onPremiumClick])

  // Render CV markers
  useEffect(() => {
    if (!cvClusterGroupRef.current || !L || !state.cvs.visible) return

    measureRenderTime(() => {
      // Clear existing markers
      cvClusterGroupRef.current.clearLayers()

      visibleCVData.forEach((item) => {
        const canView = isSubscribed
        
        const markerHtml = `
          <div class="marker-container cv-marker">
            <div class="cv-icon-wrapper" style="border-color: #10B981;">
              ${item.profile_photo_url ? `
                <img src="${item.profile_photo_url}" alt="${item.name}" class="cv-marker-photo" />
              ` : `
                <i class="fa-solid fa-user-tie" style="color: #10B981;"></i>
              `}
              ${item.timeline_items_count > 0 ? `
                <div class="cv-timeline-badge">${item.timeline_items_count}</div>
              ` : ''}
            </div>
            <div class="cv-marker-label">${item.name}</div>
          </div>
        `
        
        const customIcon = L.divIcon({ 
          html: markerHtml, 
          className: '', 
          iconSize: [120, 90], 
          iconAnchor: [60, 26] 
        })
        
        const leafletMarker = L.marker([item.location.lat, item.location.lng], { icon: customIcon })
        const popupContent = canView ? createCVPopup(item) : createCVPremiumPopup()
        
        leafletMarker.bindPopup(popupContent)
        leafletMarker.on('click', function(e) { this.openPopup() })
        
        // Setup global functions for CV interactions
        window.openCVTimeline = (cvId) => {
          const cvProfile = visibleCVData.find(cv => cv.id === cvId)
          if (cvProfile) {
            openTimelineModal(cvProfile)
          }
        }

        window.contactCV = (contact) => {
          if (contact.includes('@')) {
            window.location.href = `mailto:${contact}`
          } else if (contact.startsWith('http')) {
            window.open(contact, '_blank')
          }
        }

        window.handlePremiumClick = onPremiumClick
        
        cvClusterGroupRef.current.addLayer(leafletMarker)
      })
    })
  }, [visibleCVData, state.cvs.visible, L, isSubscribed, onPremiumClick, openTimelineModal])

  // Handle layer visibility changes
  useEffect(() => {
    if (!mapInstance.current) return

    if (state.jobs.visible && jobClusterGroupRef.current && !mapInstance.current.hasLayer(jobClusterGroupRef.current)) {
      mapInstance.current.addLayer(jobClusterGroupRef.current)
    } else if (!state.jobs.visible && jobClusterGroupRef.current && mapInstance.current.hasLayer(jobClusterGroupRef.current)) {
      mapInstance.current.removeLayer(jobClusterGroupRef.current)
    }

    if (state.cvs.visible && cvClusterGroupRef.current && !mapInstance.current.hasLayer(cvClusterGroupRef.current)) {
      mapInstance.current.addLayer(cvClusterGroupRef.current)
    } else if (!state.cvs.visible && cvClusterGroupRef.current && mapInstance.current.hasLayer(cvClusterGroupRef.current)) {
      mapInstance.current.removeLayer(cvClusterGroupRef.current)
    }
  }, [state.jobs.visible, state.cvs.visible])

  // Change map layer
  const changeMapLayer = useCallback(debounce((layerKey) => {
    if (mapInstance.current && tileLayer) {
      mapInstance.current.removeLayer(tileLayer)
    }
    const newLayer = L.tileLayer(tileProviders[layerKey].url, {
      attribution: tileProviders[layerKey].attribution,
      noWrap: true
    }).addTo(mapInstance.current)
    setTileLayer(newLayer)
  }, 150), [L, tileLayer])

  // Go to user location
  const goToUserLocation = useCallback(() => {
    if (mapInstance.current && userLocation) {
      mapInstance.current.setView([userLocation.lat, userLocation.lng], 14)
    }
  }, [userLocation])

  return (
    <div className="enhanced-map-container relative h-full w-full">
      {/* Map */}
      <div ref={mapRef} className="h-full w-full" style={{ zIndex: 1 }} />
      
      {/* Desktop Controls */}
      <div className="hidden lg:block">
        {/* Layer Controls - Top Left */}
        <LayerControls className="absolute top-4 left-4 z-[1000]" />
        
        {/* Filters - Top Right */}
        <DualFilterSystem className="absolute top-4 right-4 z-[1000] max-w-md" />
      </div>

      {/* Mobile Controls */}
      <div className="block lg:hidden">
        {/* Compact Layer Controls - Top */}
        <CompactLayerControls className="absolute top-4 left-4 right-4 z-[1000]" />
        
        {/* Compact Filters - Bottom */}
        <CompactDualFilters className="absolute bottom-20 left-4 right-4 z-[1000]" />
      </div>

      {/* Map Controls - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={goToUserLocation}
          className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors"
        >
          <i className="fa-solid fa-location-crosshairs mr-2" />
          {t('buttons.location')}
        </button>
        
        <div className="bg-white rounded-lg shadow-lg flex">
          <button 
            onClick={() => changeMapLayer('street')} 
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
          >
            {t('map.street')}
          </button>
          <button 
            onClick={() => changeMapLayer('satellite')} 
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-lg border-l transition-colors"
          >
            {t('map.satellite')}
          </button>
        </div>
      </div>

      {/* Performance Stats - Bottom Right (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>FPS: {stats.frameRate}</div>
          <div>Jobs: {state.jobs.count} / {visibleJobData.length}</div>
          <div>CVs: {state.cvs.count} / {visibleCVData.length}</div>
          <div>Memory: {stats.memory.used}MB</div>
          <div>Render: {stats.renderTime.toFixed(1)}ms</div>
        </div>
      )}

      {/* Timeline Modal */}
      <TimelineModal />
    </div>
  )
}

export default EnhancedMapComponent