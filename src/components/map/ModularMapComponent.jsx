import React, { useState, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MapCanvas from './MapCanvas'
import FilterPanel from './FilterPanel'
import LayerControls from './LayerControls'
import MarkerManager from './MarkerManager'

/**
 * ModularMapComponent - Main orchestrator component
 * Connects all map sub-components and manages data flow between them
 * 
 * Data flow:
 * 1. Filters applied to raw data
 * 2. Filtered data passed to MarkerManager
 * 3. Map interactions sync with external list component
 */
function ModularMapComponent({
  data = [],
  userLocation,
  selectedLocation,
  isSubscribed = false,
  onLocationSelect,
  onPremiumClick,
  performanceMode = 'balanced',
  className = ''
}) {
  const { t } = useTranslation()
  
  // Refs for child components
  const mapCanvasRef = useRef(null)
  const markerManagerRef = useRef(null)
  
  // State management
  const [mapInstance, setMapInstance] = useState(null)
  const [leaflet, setLeaflet] = useState(null)
  const [tileProvider, setTileProvider] = useState('street')
  const [layerVisibility, setLayerVisibility] = useState({ jobs: true, cvs: true })
  const [filters, setFilters] = useState({ type: 'all', keyword: '', location: '' })
  
  // Filter data based on current filters and layer visibility
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Type filter
      if (filters.type !== 'all' && item.type !== filters.type) return false
      
      // Layer visibility filter
      if (!layerVisibility[item.type]) return false
      
      // Keyword filter
      if (filters.keyword?.trim()) {
        const keyword = filters.keyword.toLowerCase()
        const titleMatch = item.title?.toLowerCase().includes(keyword)
        const companyMatch = item.company?.toLowerCase().includes(keyword)
        const locationMatch = item.address?.toLowerCase().includes(keyword)
        
        if (!titleMatch && !companyMatch && !locationMatch) return false
      }
      
      // Location filter
      if (filters.location?.trim()) {
        const locationFilter = filters.location.toLowerCase()
        const addressMatch = item.address?.toLowerCase().includes(locationFilter)
        const cityMatch = item.city?.toLowerCase().includes(locationFilter)
        const countryMatch = item.country?.toLowerCase().includes(locationFilter)
        
        if (!addressMatch && !cityMatch && !countryMatch) return false
      }
      
      return true
    })
  }, [data, filters, layerVisibility])

  // Get counts for layer controls
  const layerCounts = useMemo(() => {
    return filteredData.reduce((counts, item) => {
      counts[item.type] = (counts[item.type] || 0) + 1
      return counts
    }, { jobs: 0, cvs: 0 })
  }, [filteredData])

  // Handle map ready
  const handleMapReady = useCallback((mapInst, leafletLib) => {
    setMapInstance(mapInst)
    setLeaflet(leafletLib)
    console.log('✅ ModularMapComponent: Map ready with', filteredData.length, 'items')
  }, [filteredData.length])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
    console.log('🔍 Filters updated:', newFilters)
  }, [])

  // Handle layer visibility changes
  const handleLayerVisibilityChange = useCallback((layer, visible) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: visible
    }))
    console.log(`👁️ Layer ${layer} visibility:`, visible)
  }, [])

  // Handle tile provider changes
  const handleTileProviderChange = useCallback((provider) => {
    setTileProvider(provider)
    if (mapCanvasRef.current?.changeTileProvider) {
      mapCanvasRef.current.changeTileProvider(provider)
    }
    console.log('🗺️ Tile provider changed to:', provider)
  }, [])

  // Handle marker clicks
  const handleMarkerClick = useCallback((item, type) => {
    if (onLocationSelect) {
      onLocationSelect(item)
    }
    console.log('📍 Marker clicked:', type, item.id)
  }, [onLocationSelect])

  // Focus on specific location (called from external list)
  const focusOnLocation = useCallback((item) => {
    if (mapInstance && item.location) {
      mapInstance.setView([item.location.lat, item.location.lng], 15)
    }
    
    // Focus marker if available
    if (markerManagerRef.current?.focusOnMarker) {
      markerManagerRef.current.focusOnMarker(item.id, item.type)
    }
  }, [mapInstance])

  // Expose methods to parent component
  React.useImperativeHandle(React.forwardRef().ref, () => ({
    focusOnLocation,
    getMapInstance: () => mapInstance,
    refreshData: () => {
      if (markerManagerRef.current?.refreshMarkers) {
        markerManagerRef.current.refreshMarkers()
      }
    },
    getFilteredData: () => filteredData
  }), [focusOnLocation, mapInstance, filteredData])

  // Sync with external selected location
  React.useEffect(() => {
    if (selectedLocation && mapInstance) {
      focusOnLocation(selectedLocation)
    }
  }, [selectedLocation, focusOnLocation])

  return (
    <div className={`modular-map-component ${className}`}>
      <div className="relative w-full h-full">
        {/* Main Map Canvas */}
        <MapCanvas
          ref={mapCanvasRef}
          userLocation={userLocation}
          onMapReady={handleMapReady}
          tileProvider={tileProvider}
          performanceMode={performanceMode}
          className="absolute inset-0"
        />

        {/* Marker Management Layer */}
        {mapInstance && leaflet && (
          <MarkerManager
            ref={markerManagerRef}
            mapInstance={mapInstance}
            leaflet={leaflet}
            data={filteredData}
            layerVisibility={layerVisibility}
            userLocation={userLocation}
            isSubscribed={isSubscribed}
            onMarkerClick={handleMarkerClick}
            onPremiumClick={onPremiumClick}
            performanceMode={performanceMode}
          />
        )}

        {/* Filter Panel - Top Left */}
        <div className="absolute top-4 left-4 z-[1000] max-w-sm">
          <FilterPanel
            onFiltersChange={handleFiltersChange}
            onLayerToggle={handleLayerVisibilityChange}
            layerVisibility={layerVisibility}
            initialFilters={filters}
            isCompact={window.innerWidth < 768}
          />
        </div>

        {/* Layer Controls - Top Right */}
        <div className="absolute top-4 right-4 z-[1000]">
          <LayerControls
            onTileProviderChange={handleTileProviderChange}
            onLayerVisibilityChange={handleLayerVisibilityChange}
            layerVisibility={layerVisibility}
            currentTileProvider={tileProvider}
            layerCounts={layerCounts}
            isCompact={window.innerWidth < 768}
          />
        </div>

        {/* Data Stats - Bottom Left */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-sm border px-3 py-2">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>{layerCounts.jobs} {t('layers.jobs', 'Jobs')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>{layerCounts.cvs} {t('layers.cvs', 'CVs')}</span>
              </div>
              <div className="text-xs text-gray-400">
                {t('map.showing', 'Showing')} {filteredData.length}/{data.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModularMapComponent