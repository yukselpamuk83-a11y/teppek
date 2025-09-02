import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { debounce } from '../utils/debounce'
import { createPopup, createPremiumPopup } from '../utils/popupGenerator'

// Leaflet global import - bu şekilde çalışacak
let L
let MarkerClusterGroup

const loadLeaflet = async () => {
    if (typeof window !== 'undefined') {
        // Load CSS files first
        const cssFiles = [
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
            'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
            'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css'
        ]
        
        cssFiles.forEach(href => {
            try {
                if (!document.querySelector(`link[href="${href}"]`)) {
                    const link = document.createElement('link')
                    link.rel = 'stylesheet'
                    link.href = href
                    if (document.head) {
                        document.head.appendChild(link)
                    }
                }
            } catch (error) {
                console.warn('Could not load CSS:', href, error)
            }
        })
        
        // Load Leaflet JS
        if (!window.L) {
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script')
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
                    script.onload = resolve
                    script.onerror = reject
                    if (document.head) {
                        document.head.appendChild(script)
                    } else {
                        reject(new Error('Document head not available'))
                    }
                })
            } catch (error) {
                console.warn('Could not load Leaflet JS:', error)
                return
            }
        }
        
        // Load MarkerCluster JS
        if (!window.L?.markerClusterGroup) {
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script')
                    script.src = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js'
                    script.onload = resolve
                    script.onerror = reject
                    if (document.head) {
                        document.head.appendChild(script)
                    } else {
                        reject(new Error('Document head not available'))
                    }
                })
            } catch (error) {
                console.warn('Could not load MarkerCluster JS:', error)
                return
            }
        }
        
        L = window.L
        MarkerClusterGroup = L.markerClusterGroup
    }
}

function MapComponent({ data, selectedLocation, isSubscribed, userLocation, onPremiumClick }) {
    const { t } = useTranslation()
    const mapRef = useRef(null)
    const mapInstance = useRef(null)
    const clusterGroupRef = useRef(null)
    const circleRef = useRef(null)
    const userMarkerRef = useRef(null)
    const [tileLayer, setTileLayer] = useState(null)

    const tileProviders = {
        street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
        satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri' }
    }

    const changeMapLayer = useCallback(debounce((layerKey) => {
        if (mapInstance.current && tileLayer) {
            mapInstance.current.removeLayer(tileLayer)
        }
        const newLayer = L.tileLayer(tileProviders[layerKey].url, {
            attribution: tileProviders[layerKey].attribution,
            noWrap: true
        }).addTo(mapInstance.current)
        setTileLayer(newLayer)
    }, 150), [tileLayer])

    useEffect(() => {
        const initMap = async () => {
            await loadLeaflet()
            
            if (mapRef.current && !mapInstance.current && L && userLocation) {
                // Default location fallback
                const lat = userLocation?.lat || 41.01
                const lng = userLocation?.lng || 28.97
            
                try {
                    mapInstance.current = L.map(mapRef.current, {
                        maxBounds: [[-90, -180], [90, 180]], // Dünya sınırları
                        maxBoundsViscosity: 1.0,              // Sert sınır
                        minZoom: 2,                           // Minimum zoom
                        maxZoom: 18                           // Maximum zoom
                    }).setView([lat, lng], 10)
            
                    const initialLayer = L.tileLayer(tileProviders.street.url, {
                        attribution: tileProviders.street.attribution,
                        noWrap: true,
                        bounds: [[-90, -180], [90, 180]]      // Tile sınırları
                    }).addTo(mapInstance.current)
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
                    
                    // Cleanup function
                    return () => {
                        window.removeEventListener('resize', handleResize)
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
    
    // Filtrelenmiş data kullan (App.jsx'ten gelen processedData)
    useEffect(() => {
        console.log('🗺️ MapComponent: Data effect triggered')
        console.log('📍 Data length:', data?.length)
        console.log('📍 User location:', userLocation)
        console.log('📍 Cluster group exists:', !!clusterGroupRef.current)
        
        if (!clusterGroupRef.current || !data.length || !userLocation) {
            console.log('❌ MapComponent: Missing requirements for markers')
            return
        }
        
        console.log('🔄 MapComponent: Creating markers for', data.length, 'items')
        
        // Cluster group'u tamamen temizle ve yeniden oluştur
        if (mapInstance.current) {
            mapInstance.current.removeLayer(clusterGroupRef.current)
            clusterGroupRef.current = L.markerClusterGroup({
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                spiderfyDistanceMultiplier: 3,     // 3x uzun mesafe
                spiderfyOnEveryZoom: true,         // Zoom 17'de de spiderfy aktif
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            })
            mapInstance.current.addLayer(clusterGroupRef.current)
        }
        
        // processedData'dan marker oluştur
        data.forEach((item, index) => {
            console.log(`📍 Creating marker ${index + 1}:`, item.title, 'at', item.location)
            // Development modunda tüm ilanları göster
            const isDevelopment = import.meta.env.DEV
            // Tüm veriyi açık göster - premium kaldırıldı
            const canView = true
            
            // Basit marker HTML oluştur
            const iconClass = item.type === 'job' ? 'fa-briefcase' : 'fa-user'
            const iconColor = item.type === 'job' ? '#0097A7' : '#FB8C00'
            const markerHtml = `<div class="marker-container ${item.isSponsored ? 'sponsored-marker' : ''}">
                <div class="icon-wrapper" style="border-color: ${item.isSponsored ? '#FBBF24' : iconColor};">
                    ${item.isSponsored ? '<i class="fa-solid fa-star absolute -top-2 -right-2 text-yellow-400 text-xl"></i>' : ''}
                    <i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i>
                </div>
                <div class="marker-label">${item.title}</div>
            </div>`
            
            const customIcon = L.divIcon({ 
                html: markerHtml, 
                className: '', 
                iconSize: [120, 90], 
                iconAnchor: [60, 26] 
            })
            
            const leafletMarker = L.marker([item.location.lat, item.location.lng], { icon: customIcon })
            
            // Debug: item içeriğini kontrol et
            if (index === 0) {
                console.log('🔍 MapComponent - İlk item verisi:', {
                    title: item.title,
                    city: item.city,
                    country: item.country,
                    address: item.address,
                    source: item.source,
                    allFields: Object.keys(item)
                })
            }
            
            // Yeni popup sistemi - kaynak bazlı tasarım
            const popupContent = canView ? createPopup(item) : createPremiumPopup()
            
            // Global premium handler for popup buttons
            window.handlePremiumClick = onPremiumClick
            
            leafletMarker.bindPopup(popupContent)
            
            // Click-only popup functionality
            leafletMarker.on('click', function(e) {
                this.openPopup()
            })
            
            if (!canView) {
                leafletMarker.on('popupopen', () => {
                    const btn = document.getElementById(`subscribe-btn-${item.id}`)
                    if (btn) btn.onclick = onPremiumClick
                })
            }
            
            clusterGroupRef.current.addLayer(leafletMarker)
        })
    }, [data, isSubscribed, forceRefresh])

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
                    onClick={() => mapInstance.current && userLocation && mapInstance.current.setView([userLocation?.lat || 41.01, userLocation?.lng || 28.97], 14)} 
                    className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors"
                >
                    {t('buttons.location')}
                </button>
                <div className="bg-white rounded-lg shadow-lg flex">
                     <button onClick={() => changeMapLayer('street')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors">{t('map.street')}</button>
                     <button onClick={() => changeMapLayer('satellite')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-lg border-l transition-colors">{t('map.satellite')}</button>
                </div>
            </div>
        </div>
    )
}

export default MapComponent