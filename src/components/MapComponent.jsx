import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { debounce } from '../utils/debounce'
import { createModernPopup } from '../utils/modernPopupGenerator'
import { createPremiumPopup } from '../utils/popupGenerator'
import '../styles/pure-css-markers.css' // 🎯 Pure CSS marker styles - Ultra Performance

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
                        // 🚀 SMART PERFORMANCE: Optimize edilmiş harita ayarları
                        maxBounds: [[-90, -180], [90, 180]], // Dünya sınırları
                        maxBoundsViscosity: 1.0,              // Sert sınır
                        minZoom: 3,                           // Min zoom artırıldı (gereksiz dünya görünümü yok)
                        maxZoom: 18,                          // Max zoom artırıldı (sokak detayları için)
                        zoomControl: true,
                        attributionControl: true,
                        // VIEWPORT PERFORMANCE
                        preferCanvas: false,                   // DOM daha hızlı marker'lar için
                        renderer: L.canvas(),                 // Canvas renderer
                        // LOADING OPTIMIZATION
                        fadeAnimation: false,                 // Animasyon yok = hızlı
                        zoomAnimation: true,                  // Sadece zoom animasyonu
                        markerZoomAnimation: false            // Marker animasyon yok
                    }).setView([lat, lng], 12) // Zoom artırıldı sokaklar için
            
                    const initialLayer = L.tileLayer(tileProviders.street.url, {
                        attribution: tileProviders.street.attribution,
                        noWrap: true,
                        bounds: [[-90, -180], [90, 180]],     // Tile sınırları
                        // 🚀 VIEWPORT-ONLY LOADING OPTIMIZATION
                        maxZoom: 18,                          // Tile max zoom sınırı sokaklar için
                        tileSize: 256,                        // Standard tile boyutu
                        keepBuffer: 1,                        // Minimal buffer (default: 2)
                        updateWhenZooming: false,             // Zoom sırasında update yok
                        updateWhenIdle: true,                 // Sadece durduğunda update
                        // NETWORK OPTIMIZATION  
                        crossOrigin: true,                    // CORS optimization
                        // CACHE OPTIMIZATION
                        detectRetina: false                   // Retina detection off = faster
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
                <div className="bg-white rounded-lg shadow-lg flex">
                     <button onClick={() => changeMapLayer('street')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors">{t('map.street')}</button>
                     <button onClick={() => changeMapLayer('satellite')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-lg border-l transition-colors">{t('map.satellite')}</button>
                </div>
            </div>
        </div>
    )
}

export default MapComponent