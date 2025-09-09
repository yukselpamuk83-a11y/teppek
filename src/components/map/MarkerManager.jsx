import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createPopup, createPremiumPopup } from '../../utils/popupGenerator'
import { createCVPopup, createCVPremiumPopup } from '../../utils/cvPopupGenerator'

/**
 * MarkerManager - Manages all map markers and clusters
 * Handles: Marker creation, clustering, performance optimization, popup management
 */
function MarkerManager({
  mapInstance,
  leaflet: L,
  data = [],
  layerVisibility = { jobs: true, cvs: true },
  userLocation,
  isSubscribed = false,
  onMarkerClick,
  onPremiumClick,
  performanceMode = 'balanced',
  className = ''
}) {
  const { t } = useTranslation()
  
  // Refs for cluster groups
  const jobClusterGroupRef = useRef(null)
  const cvClusterGroupRef = useRef(null)
  const markersRef = useRef(new Map())
  
  // Performance configurations
  const performanceConfig = {
    performance: { 
      chunkSize: 50, 
      maxMarkersInView: 500, 
      clusterRadius: 80,
      enableProgressiveLoading: true 
    },
    balanced: { 
      chunkSize: 100, 
      maxMarkersInView: 1000, 
      clusterRadius: 50,
      enableProgressiveLoading: true 
    },
    quality: { 
      chunkSize: 200, 
      maxMarkersInView: 2000, 
      clusterRadius: 30,
      enableProgressiveLoading: false 
    }
  }

  const config = performanceConfig[performanceMode] || performanceConfig.balanced

  // Separate data by type
  const { jobData, cvData } = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        if (item.type === 'job') {
          acc.jobData.push(item)
        } else if (item.type === 'cv') {
          acc.cvData.push(item)
        }
        return acc
      },
      { jobData: [], cvData: [] }
    )
  }, [data])

  // Initialize cluster groups
  useEffect(() => {
    if (!mapInstance || !L) return

    // Initialize job cluster group
    if (!jobClusterGroupRef.current) {
      jobClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: config.clusterRadius,
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
    }

    // Initialize CV cluster group
    if (!cvClusterGroupRef.current) {
      cvClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: config.clusterRadius,
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
                  <i class="fa-solid fa-user"></i>
                  <span class="cv-cluster-count">${count}</span>
                </div>
              </div>
            `,
            className: 'cluster-icon',
            iconSize: L.point(40, 40)
          })
        }
      })
    }

    // Inject cluster styles
    injectClusterStyles()
  }, [mapInstance, L, config.clusterRadius])

  // Inject cluster marker styles
  const injectClusterStyles = () => {
    if (document.getElementById('marker-cluster-styles')) return
    
    const style = document.createElement('style')
    style.id = 'marker-cluster-styles'
    style.textContent = `
      .job-cluster-marker {
        background: linear-gradient(135deg, #3b82f6, #1e40af);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
        border: 2px solid white;
      }
      
      .job-cluster-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: white;
      }
      
      .job-cluster-icon i {
        font-size: 12px;
        margin-bottom: 2px;
      }
      
      .job-cluster-count {
        font-size: 10px;
        font-weight: bold;
      }
      
      .cv-cluster-marker {
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
        border: 2px solid white;
      }
      
      .cv-cluster-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: white;
      }
      
      .cv-cluster-icon i {
        font-size: 12px;
        margin-bottom: 2px;
      }
      
      .cv-cluster-count {
        font-size: 10px;
        font-weight: bold;
      }
      
      .leaflet-marker-icon.cluster-icon {
        background: transparent;
        border: none;
      }
    `
    document.head.appendChild(style)
  }

  // Create job marker
  const createJobMarker = useCallback((job) => {
    if (!L || !job.location?.lat || !job.location?.lng) return null

    const icon = L.divIcon({
      html: `<div class="job-marker">
               <i class="fa-solid fa-briefcase"></i>
             </div>`,
      className: 'job-marker-wrapper',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    })

    const marker = L.marker([job.location.lat, job.location.lng], { icon })

    // Create popup content
    const popupContent = isSubscribed 
      ? createPremiumPopup(job, userLocation, t)
      : createPopup(job, userLocation, t)

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    })

    // Add click handler
    marker.on('click', () => {
      if (onMarkerClick) {
        onMarkerClick(job, 'job')
      }
    })

    return marker
  }, [L, isSubscribed, userLocation, onMarkerClick, t])

  // Create CV marker
  const createCVMarker = useCallback((cv) => {
    if (!L || !cv.location?.lat || !cv.location?.lng) return null

    const icon = L.divIcon({
      html: `<div class="cv-marker">
               <i class="fa-solid fa-user"></i>
             </div>`,
      className: 'cv-marker-wrapper',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    })

    const marker = L.marker([cv.location.lat, cv.location.lng], { icon })

    // Create popup content
    const popupContent = isSubscribed 
      ? createCVPremiumPopup(cv, userLocation, t)
      : createCVPopup(cv, userLocation, t)

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup cv-popup'
    })

    // Add click handler
    marker.on('click', () => {
      if (onMarkerClick) {
        onMarkerClick(cv, 'cv')
      }
    })

    return marker
  }, [L, isSubscribed, userLocation, onMarkerClick, t])

  // Update job markers
  useEffect(() => {
    if (!mapInstance || !jobClusterGroupRef.current) return

    // Clear existing job markers
    jobClusterGroupRef.current.clearLayers()

    if (layerVisibility.jobs && jobData.length > 0) {
      // Create markers in chunks for performance
      const processChunk = (startIndex) => {
        const endIndex = Math.min(startIndex + config.chunkSize, jobData.length)
        const markers = []

        for (let i = startIndex; i < endIndex; i++) {
          const marker = createJobMarker(jobData[i])
          if (marker) {
            markers.push(marker)
            markersRef.current.set(`job-${jobData[i].id}`, marker)
          }
        }

        if (markers.length > 0) {
          jobClusterGroupRef.current.addLayers(markers)
        }

        // Process next chunk
        if (endIndex < jobData.length && config.enableProgressiveLoading) {
          setTimeout(() => processChunk(endIndex), 0)
        }
      }

      processChunk(0)

      // Add cluster group to map
      if (!mapInstance.hasLayer(jobClusterGroupRef.current)) {
        mapInstance.addLayer(jobClusterGroupRef.current)
      }
    } else {
      // Remove from map if not visible
      if (mapInstance.hasLayer(jobClusterGroupRef.current)) {
        mapInstance.removeLayer(jobClusterGroupRef.current)
      }
    }
  }, [mapInstance, jobData, layerVisibility.jobs, createJobMarker, config])

  // Update CV markers
  useEffect(() => {
    if (!mapInstance || !cvClusterGroupRef.current) return

    // Clear existing CV markers
    cvClusterGroupRef.current.clearLayers()

    if (layerVisibility.cvs && cvData.length > 0) {
      // Create markers in chunks for performance
      const processChunk = (startIndex) => {
        const endIndex = Math.min(startIndex + config.chunkSize, cvData.length)
        const markers = []

        for (let i = startIndex; i < endIndex; i++) {
          const marker = createCVMarker(cvData[i])
          if (marker) {
            markers.push(marker)
            markersRef.current.set(`cv-${cvData[i].id}`, marker)
          }
        }

        if (markers.length > 0) {
          cvClusterGroupRef.current.addLayers(markers)
        }

        // Process next chunk
        if (endIndex < cvData.length && config.enableProgressiveLoading) {
          setTimeout(() => processChunk(endIndex), 0)
        }
      }

      processChunk(0)

      // Add cluster group to map
      if (!mapInstance.hasLayer(cvClusterGroupRef.current)) {
        mapInstance.addLayer(cvClusterGroupRef.current)
      }
    } else {
      // Remove from map if not visible
      if (mapInstance.hasLayer(cvClusterGroupRef.current)) {
        mapInstance.removeLayer(cvClusterGroupRef.current)
      }
    }
  }, [mapInstance, cvData, layerVisibility.cvs, createCVMarker, config])

  // Cleanup
  useEffect(() => {
    return () => {
      if (jobClusterGroupRef.current) {
        jobClusterGroupRef.current.clearLayers()
      }
      if (cvClusterGroupRef.current) {
        cvClusterGroupRef.current.clearLayers()
      }
      markersRef.current.clear()
    }
  }, [])

  // Focus on specific marker
  const focusOnMarker = useCallback((id, type) => {
    const markerKey = `${type}-${id}`
    const marker = markersRef.current.get(markerKey)
    
    if (marker && mapInstance) {
      mapInstance.setView(marker.getLatLng(), 15)
      marker.openPopup()
    }
  }, [mapInstance])

  // Expose methods to parent
  React.useImperativeHandle(onMarkerClick, () => ({
    focusOnMarker,
    getMarkerCounts: () => ({
      jobs: jobData.length,
      cvs: cvData.length,
      visible: {
        jobs: layerVisibility.jobs ? jobData.length : 0,
        cvs: layerVisibility.cvs ? cvData.length : 0
      }
    }),
    refreshMarkers: () => {
      // Trigger re-render of markers
      if (jobClusterGroupRef.current) {
        jobClusterGroupRef.current.refreshClusters()
      }
      if (cvClusterGroupRef.current) {
        cvClusterGroupRef.current.refreshClusters()
      }
    }
  }), [focusOnMarker, jobData.length, cvData.length, layerVisibility])

  // Component doesn't render anything visible
  return null
}

export default MarkerManager