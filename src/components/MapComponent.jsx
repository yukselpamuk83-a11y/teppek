import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { debounce } from '../utils/debounce'
import { createModernPopup } from '../utils/modernPopupGenerator'
import { createPremiumPopup } from '../utils/popupGenerator'
import { preloadCriticalMapTiles, optimizeLeafletMap, getTileOptimizerStats, createOptimizedTileLayer } from '../utils/mapTileOptimizer'
import { tileServiceWorker } from '../utils/tileServiceWorker'
import '../styles/pure-css-markers.css' // 🎯 Pure CSS marker styles - Ultra Performance

// 🚀 PERFORMANCE FIX: Use bundled Leaflet instead of CDN to eliminate duplicate loading
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

function MapComponent({ 
    data, 
    selectedLocation, 
    isSubscribed, 
    userLocation, 
    onPremiumClick
}) {
    const { t } = useTranslation()
    const mapRef = useRef(null)
    const mapInstance = useRef(null)
    const clusterGroupRef = useRef(null)
    const circleRef = useRef(null)
    const userMarkerRef = useRef(null)
    const [tileLayer, setTileLayer] = useState(null)
    const [tileOptimizerStats, setTileOptimizerStats] = useState(null)
    
    // 🚀 MOBILE OPTIMIZATION: Detect mobile and adjust map performance
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [isLowMemoryDevice] = useState(() => {
        const deviceMemory = navigator.deviceMemory || 4
        const connection = navigator.connection
        return deviceMemory < 4 || (connection && connection.effectiveType?.includes('2g'))
    })

    // 🚀 ADVANCED TILE OPTIMIZATION: CloudFlare proxy + Vector tiles + Smart caching
    const tileProviders = {
        street: { 
            url: 'https://geoo-tiles.yukselpamuk83.workers.dev/osm/{z}/{x}/{y}.png', 
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, via CloudFlare proxy',
            optimized: true,
            type: 'raster'
        },
        satellite: { 
            url: 'https://geoo-tiles.yukselpamuk83.workers.dev/satellite/{z}/{x}/{y}.jpg', 
            attribution: 'Tiles &copy; Esri, via CloudFlare proxy',
            optimized: true,
            type: 'raster'
        }
    }

    const changeMapLayer = useCallback(debounce((layerKey) => {
        if (mapInstance.current && tileLayer) {
            mapInstance.current.removeLayer(tileLayer)
        }
        
        // Create optimized tile layer
        const newLayer = L.tileLayer(tileProviders[layerKey].url, {
            attribution: tileProviders[layerKey].attribution,
            noWrap: true,
            updateWhenIdle: true,
            updateWhenZooming: false,
            keepBuffer: isMobile ? 1 : 2,
            detectRetina: !isMobile && window.devicePixelRatio > 1,
            className: `advanced-tiles-${layerKey}`,
            maxZoom: isMobile ? 16 : 18
        })
        
        if (mapInstance.current) {
            newLayer.addTo(mapInstance.current)
        }
        setTileLayer(newLayer)
        
        console.log(`🚀 Switched to optimized ${layerKey} tiles with CloudFlare proxy`)
    }, 150), [tileLayer, isMobile])

    // Map initialization  
    useEffect(() => {
        const initMap = async () => {
            if (mapRef.current && !mapInstance.current && userLocation) {
                // Default location fallback
                const lat = userLocation?.lat || 41.01
                const lng = userLocation?.lng || 28.97
                
                // 🚀 ADVANCED TILE PRELOADING: Adaptive based on device and connection
                const preloadOptions = {
                    radius: isMobile ? 1 : isLowMemoryDevice ? 2 : 3,
                    useVector: !isMobile && 12 >= 10,
                    adaptToConnection: true
                }
                
                // Skip preloading for now - create map first
                console.log('🗺️ Creating map without preloading for faster startup')
            
                try {
                    // 🚀 MOBILE OPTIMIZATION: Adjust map settings based on device capability
                    const mapOptions = {
                        maxBounds: [[-90, -180], [90, 180]], // Dünya sınırları
                        maxBoundsViscosity: 1.0,              // Sert sınır
                        minZoom: isMobile ? 4 : 3,            // Higher min zoom for mobile
                        maxZoom: isMobile ? 16 : 18,          // Lower max zoom for mobile
                        zoomControl: true,
                        attributionControl: !isMobile,        // Hide attribution on mobile to save space
                        // MOBILE PERFORMANCE OPTIMIZATIONS
                        preferCanvas: isMobile,               // Canvas renderer for mobile
                        renderer: isMobile ? L.canvas() : L.svg(), // Canvas for mobile, SVG for desktop
                        // LOADING OPTIMIZATION
                        fadeAnimation: !isMobile,             // No fade animation on mobile
                        zoomAnimation: !isLowMemoryDevice,    // No zoom animation on low memory
                        markerZoomAnimation: false,           // Always disable marker animation
                        // MOBILE TOUCH OPTIMIZATIONS
                        tap: isMobile,                        // Enable tap for mobile
                        tapTolerance: isMobile ? 20 : 15,     // Larger tap tolerance for mobile
                        touchZoom: isMobile,                  // Enable touch zoom
                        doubleClickZoom: !isMobile,           // Only enable double click zoom on desktop
                        // MEMORY OPTIMIZATIONS
                        trackResize: !isLowMemoryDevice,      // Don't track resize on low memory devices
                        closePopupOnClick: isMobile           // Auto-close popups on mobile
                    }
                    
                    // 🚀 LCP OPTIMIZATION: Much lower zoom for mobile to reduce tile count
                    const initialZoom = isMobile ? 8 : 12  // Much lower zoom for mobile LCP
                    mapInstance.current = L.map(mapRef.current, mapOptions).setView([lat, lng], initialZoom)
            
                    // 🚀 MOBILE OPTIMIZATION: Adjust tile layer based on device capability
                    const tileOptions = {
                        attribution: isMobile ? '' : tileProviders.street.attribution, // Remove attribution on mobile
                        noWrap: true,
                        bounds: [[-90, -180], [90, 180]],
                        maxZoom: isMobile ? 16 : 18,          // Lower max zoom for mobile
                        tileSize: 256,
                        keepBuffer: isLowMemoryDevice ? 0 : 1, // No buffer on low memory devices
                        updateWhenZooming: !isMobile,         // Don't update while zooming on mobile
                        updateWhenIdle: true,
                        crossOrigin: 'anonymous',
                        detectRetina: !isMobile,              // No retina detection on mobile
                        className: isMobile ? 'mobile-optimized-tiles' : 'lcp-optimized-tiles',
                        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                    }
                    
                    // Create initial tile layer with CloudFlare proxy
                    const initialLayer = L.tileLayer(tileProviders.street.url, {
                        ...tileOptions,
                        attribution: isMobile ? '' : tileProviders.street.attribution
                    }).addTo(mapInstance.current)
                    
                    // 🚀 Apply Leaflet optimization
                    optimizeLeafletMap(mapInstance.current)
                    
                    setTileLayer(initialLayer)

                    circleRef.current = L.circle([lat, lng], {
                        radius: 50000, 
                        color: '#3b82f6',
                        fillColor: '#60a5fa',
                        fillOpacity: 0.1,
                        weight: 1
                    }).addTo(mapInstance.current)

                    if (mapInstance.current) {
                        mapInstance.current.fitBounds(circleRef.current.getBounds())
                    }

                    clusterGroupRef.current = L.markerClusterGroup({
                        maxClusterRadius: 50,
                        spiderfyOnMaxZoom: true,
                        spiderfyDistanceMultiplier: 3,     // 3x uzun mesafe
                        spiderfyOnEveryZoom: true,         // Zoom 17'de de spiderfy aktif
                        showCoverageOnHover: false,
                        zoomToBoundsOnClick: true
                    })
                    mapInstance.current.addLayer(clusterGroupRef.current)
            
                    // Zoom ve view değişimi event'leri - marker kaybolma sorunu için
                    mapInstance.current.on('zoomend moveend', () => {
                        setTimeout(() => {
                            if (clusterGroupRef.current) {
                                clusterGroupRef.current.refreshClusters()
                            }
                        }, 100)
                    })
            
                    // Window resize event'i ayrı handle et
                    const handleResize = () => {
                        setTimeout(() => {
                            if (mapInstance.current && clusterGroupRef.current) {
                                mapInstance.current.invalidateSize()
                                clusterGroupRef.current.refreshClusters()
                                // F12 açıp kapattıktan sonra marker'ların kaybolması durumunda
                                if (clusterGroupRef.current.getLayers().length === 0 && data && data.length > 0) {
                                    // Marker'ları yeniden ekle
                                    console.log('🔄 Markers lost after resize, re-adding...')
                                    // Force re-render markers by calling the effect manually
                                    setTimeout(() => window.dispatchEvent(new CustomEvent('force-marker-refresh')), 200)
                                }
                            }
                        }, 150)
                    }
                    
                    window.addEventListener('resize', handleResize)
                    
                    // Harita boyut sorununu çöz
                    setTimeout(() => {
                        if (mapInstance.current) {
                            mapInstance.current.invalidateSize()
                        }
                    }, 100)
                    
                    // Setup tile performance monitoring
                    const setupTileStatsMonitoring = () => {
                        const updateStats = async () => {
                            try {
                                const stats = await getTileOptimizerStats()
                                setTileOptimizerStats(stats)
                                
                                // Log performance metrics periodically
                                if (stats?.performance) {
                                    console.log('📊 Tile Performance:', {
                                        avgLoadTime: `${stats.performance.averageLoadTime?.toFixed(1) || 0}ms`,
                                        cacheHitRate: `${stats.performance.cacheHitRate?.toFixed(1) || 0}%`,
                                        memoryUsage: stats.memory?.estimatedMemoryUsage?.total || '0 MB'
                                    })
                                }
                            } catch (error) {
                                console.warn('⚠️ Failed to get tile optimizer stats:', error)
                            }
                        }
                        
                        // Update stats every 30 seconds
                        const statsInterval = setInterval(updateStats, 30000)
                        
                        // Initial stats update
                        setTimeout(updateStats, 5000)
                        
                        return () => clearInterval(statsInterval)
                    }
                    
                    const cleanupTileStats = setupTileStatsMonitoring()
                    
                    // Cleanup function
                    return () => {
                        window.removeEventListener('resize', handleResize)
                        if (cleanupTileStats) cleanupTileStats()
                    }
                } catch (error) {
                    console.warn('Map initialization error:', error)
                    // If map already exists, clear it
                    if (mapRef.current) {
                        mapRef.current.innerHTML = ''
                    }
                }
            }
        }
        
        initMap()
    }, [userLocation])

    useEffect(() => {
        if (mapInstance.current && userLocation) {
            const userIcon = L.divIcon({
                html: `<i class="fa-solid fa-location-pin user-location-icon"></i>`,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })

            if (circleRef.current) {
                circleRef.current.setLatLng([userLocation?.lat || 41.01, userLocation?.lng || 28.97])
            }
            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([userLocation?.lat || 41.01, userLocation?.lng || 28.97])
            } else {
                userMarkerRef.current = L.marker([userLocation?.lat || 41.01, userLocation?.lng || 28.97], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstance.current)
            }
        }
    }, [userLocation])

    // Force marker refresh trigger
    const [forceRefresh, setForceRefresh] = useState(0)
    
    useEffect(() => {
        const handleForceRefresh = () => setForceRefresh(prev => prev + 1)
        window.addEventListener('force-marker-refresh', handleForceRefresh)
        return () => window.removeEventListener('force-marker-refresh', handleForceRefresh)
    }, [])
    
    // Marker rendering
    useEffect(() => {
        console.log('🗺️ MapComponent: Marker rendering triggered')
        console.log('📍 Data length:', data?.length)
        console.log('📍 User location:', userLocation)
        console.log('📍 Cluster group exists:', !!clusterGroupRef.current)
        
        if (!clusterGroupRef.current || !data.length || !userLocation) {
            console.log('❌ MapComponent: Missing requirements for markers')
            return
        }
        
        console.log('🔄 MapComponent: Creating markers for', data.length, 'items')
        
        // Cluster group'u tamamen temizle ve yeniden oluştur (kümeleme için gerekli)
        if (mapInstance.current) {
            mapInstance.current.removeLayer(clusterGroupRef.current)
            clusterGroupRef.current = L.markerClusterGroup({
                maxClusterRadius: 60, // Biraz daha büyük cluster - performans için
                spiderfyOnMaxZoom: true,
                spiderfyDistanceMultiplier: 2,     // Daha kısa mesafe - minimal dots için
                spiderfyOnEveryZoom: false,        // Sadece max zoom'da - performans
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                // 🚀 PERFORMANCE: Cluster animasyonlarını hızlandır
                animateAddingMarkers: false,       // Animasyon yok
                removeOutsideVisibleBounds: true   // Görünmeyen marker'ları kaldır
            })
            mapInstance.current.addLayer(clusterGroupRef.current)
        }
        
        // processedData'dan marker oluştur
        data.forEach((item, index) => {
            // console.log(`📍 Creating marker ${index + 1}:`, item.title, 'at', item.location) // Performance: Log kaldırıldı
            // Development modunda tüm ilanları göster
            const isDevelopment = import.meta.env.DEV
            // Tüm veriyi açık göster - premium kaldırıldı
            const canView = true
            
            // 🎯 PURE CSS MARKERS: Zero JS, Ultra Performance, Perfect Styling
            const fullTitle = item.title || 'Başlık Belirtilmemiş'
            
            // Tek satırlı metin şeridi - dinamik genişlik (büyük yazı için)
            const textWidth = Math.max(140, Math.min(220, fullTitle.length * 8)) // 8px per character
            const markerHeight = 28
            
            // Koyu renkli metin şeridi HTML
            const cssMarkerHtml = `
                <div class="text-strip ${item.type}" 
                     style="width: ${textWidth}px; height: ${markerHeight}px;"
                     title="${item.type === 'job' ? 'İş İlanı' : 'CV'}: ${item.title}">
                    <span class="strip-text">${fullTitle}</span>
                </div>
            `
            
            const customIcon = L.divIcon({ 
                html: cssMarkerHtml, 
                className: 'text-strip-wrapper', 
                iconSize: [textWidth, markerHeight],
                iconAnchor: [textWidth/2, markerHeight/2] // Center alignment
            })
            
            const leafletMarker = L.marker([item.location.lat, item.location.lng], { icon: customIcon })
            
            // Debug log kaldırıldı - performans optimizasyonu
            
            // Modern popup sistem - performant ve simple
            if (canView) {
                // Async popup loading with full data
                leafletMarker.bindPopup('<div class="popup-loading">🔄 Yükleniyor...</div>')
                
                leafletMarker.on('click', async function(e) {
                    try {
                        const modernPopupContent = await createModernPopup(item)
                        this.setPopupContent(modernPopupContent)
                        this.openPopup()
                    } catch (error) {
                        console.error('Error loading popup:', error)
                        this.setPopupContent(`
                            <div class="error-popup">
                                <h3>${item.title || 'İlan Başlığı'}</h3>
                                <div>Popup yüklenemedi</div>
                            </div>
                        `)
                        this.openPopup()
                    }
                })
            } else {
                // Premium popup for restricted content
                leafletMarker.bindPopup(createPremiumPopup())
            }
            
            // Global premium handler for popup buttons
            window.handlePremiumClick = onPremiumClick
            
            if (!canView) {
                leafletMarker.on('popupopen', () => {
                    const btn = document.getElementById(`subscribe-btn-${item.id}`)
                    if (btn) btn.onclick = onPremiumClick
                })
            }
            
            clusterGroupRef.current.addLayer(leafletMarker)
        })
    }, [data, isSubscribed, forceRefresh, userLocation])

    useEffect(() => {
        if (selectedLocation && mapInstance.current) {
            mapInstance.current.setView([selectedLocation.lat, selectedLocation.lng], 16)
        }
    }, [selectedLocation])

    return (
        <div className="relative h-full w-full">
            <div ref={mapRef} className="h-full w-full" style={{ zIndex: 1 }} />
            {/* Kontrol paneli - Sol alt köşe */}
            <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
                <button 
                    onClick={() => {
                        if (mapInstance.current) {
                            // Dünya görünümü - minimum zoom level
                            mapInstance.current.setView([20, 0], 2)
                        }
                    }} 
                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
                >
                    🌍 All World
                </button>
                <button 
                    onClick={() => mapInstance.current && userLocation && mapInstance.current.setView([userLocation?.lat || 41.01, userLocation?.lng || 28.97], 14)} 
                    className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors"
                >
                    {t('buttons.location')}
                </button>
                {/* Advanced Tile Layer Controls */}
                <div className="bg-white rounded-lg shadow-lg flex">
                     <button onClick={() => changeMapLayer('street')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors">
                        🗺️ {t('map.street')}
                     </button>
                     <button onClick={() => changeMapLayer('satellite')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-lg border-l transition-colors">
                        🛰️ {t('map.satellite')}
                     </button>
                </div>
                
                {/* Tile Performance Stats (Development mode) */}
                {import.meta.env.DEV && tileOptimizerStats && (
                    <div className="bg-black bg-opacity-80 text-white text-xs p-2 rounded-lg max-w-48">
                        <div className="font-semibold mb-1">🚀 Tile Stats</div>
                        <div>Cache: {tileOptimizerStats.memory?.preloadedTiles || 0} tiles</div>
                        <div>Hit Rate: {tileOptimizerStats.performance?.cacheHitRate?.toFixed(1) || 0}%</div>
                        <div>Avg Load: {tileOptimizerStats.performance?.averageLoadTime?.toFixed(0) || 0}ms</div>
                        <div>Memory: {tileOptimizerStats.memory?.estimatedMemoryUsage?.total || '0 MB'}</div>
                        <div className="text-green-400">SW v{tileOptimizerStats.serviceWorker?.version || '1.0'}</div>
                    </div>
                )}
            </div>
            
        </div>
    )
}

export default MapComponent