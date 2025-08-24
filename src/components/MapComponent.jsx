import { useEffect, useRef, useState, useCallback } from 'react'
import { debounce } from '../utils/debounce'

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
            
            if (mapRef.current && !mapInstance.current && L) {
            mapInstance.current = L.map(mapRef.current, {
                maxBounds: [[-90, -180], [90, 180]], // Dünya sınırları
                maxBoundsViscosity: 1.0,              // Sert sınır
                minZoom: 2,                           // Minimum zoom
                maxZoom: 18                           // Maximum zoom
            }).setView([userLocation.lat, userLocation.lng], 10)
            
            const initialLayer = L.tileLayer(tileProviders.street.url, {
                attribution: tileProviders.street.attribution,
                noWrap: true,
                bounds: [[-90, -180], [90, 180]]      // Tile sınırları
            }).addTo(mapInstance.current)
            setTileLayer(initialLayer)

            circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
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
                circleRef.current.setLatLng([userLocation.lat, userLocation.lng])
            }
            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng])
            } else {
                userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstance.current)
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
        if (!clusterGroupRef.current || !data.length || !userLocation) return
        
        // Cluster group'u tamamen temizle ve yeniden oluştur
        if (mapInstance.current) {
            mapInstance.current.removeLayer(clusterGroupRef.current)
            clusterGroupRef.current = L.markerClusterGroup({
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            })
            mapInstance.current.addLayer(clusterGroupRef.current)
        }
        
        // processedData'dan marker oluştur
        data.forEach(item => {
            const canView = item.canView || (isSubscribed || item.distance <= 50)
            
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
            
            // Popup HTML oluştur
            let popupContent
            if (canView) {
                let applyButton = ''
                if (item.type === 'cv' && item.contact) {
                    applyButton = `<div style="background-color: #fff7ed; padding: 12px; border-radius: 8px; margin-top: 12px;">
                        <div style="font-weight: 600; color: #ea580c; margin-bottom: 6px;">İletişim Bilgileri</div>
                        <div style="color: #ea580c; word-break: break-all; font-size: 14px;">${item.contact}</div>
                    </div>`
                } else if (item.type === 'job' && item.source === 'manual' && item.contact) {
                    applyButton = `<div style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; margin-top: 12px;">
                        <div style="font-weight: 600; color: #1e40af; margin-bottom: 6px;">İletişim Bilgileri</div>
                        <div style="color: #1e40af; word-break: break-all; font-size: 14px;">${item.contact}</div>
                    </div>`
                } else if (item.type === 'job' && item.applyUrl) {
                    applyButton = `<a href="${item.applyUrl}" target="_blank" style="display: block; background-color: #2563eb; color: white; padding: 12px; text-align: center; border-radius: 8px; text-decoration: none; margin-top: 12px;">İlana Başvur</a>`
                }
                
                popupContent = `<div class="custom-popup-container">
                    <div style="font-size: 18px; font-weight: bold; color: #0097A7; margin-bottom: 8px;">${item.title}</div>
                    ${item.type === 'job' && item.salary_min ? `<div style="font-size: 15px; font-weight: bold; color: #059669; margin-bottom: 12px; padding: 8px; background-color: #f0fdf4; border-radius: 6px;">${item.currency || 'USD'} ${item.salary_min?.toLocaleString() || '?'} - ${item.salary_max?.toLocaleString() || '?'}</div>` : ''}
                    <div style="font-size: 14px; color: #4b5563; margin-bottom: 12px;">
                        <i class="fa-solid fa-building" style="margin-right: 8px;"></i>${item.company || 'Şirket bilgisi yok'}
                        <br><i class="fa-solid fa-location-dot" style="margin-right: 8px; margin-top: 4px;"></i>${item.address}
                    </div>
                    ${applyButton}
                </div>`
            } else {
                popupContent = `<div class="custom-popup-container text-center">
                    <div class="font-bold text-lg text-ilan">${item.title}</div>
                    <div class="text-base font-semibold text-gray-800">${item.company}</div>
                    <p class="text-sm text-gray-600 my-2">Bu kayıt <b>50 km'lik ücretsiz alanınızın dışında</b> kaldığı için detayları gizlenmiştir.</p>
                    <button id="subscribe-btn-${item.id}" class="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">Abonelik Seçenekleri</button>
                </div>`
            }
            
            leafletMarker.bindPopup(popupContent)
            
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
            <div ref={mapRef} className="h-full w-full" />
            {/* Kontrol paneli */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button 
                    onClick={() => mapInstance.current && userLocation && mapInstance.current.setView([userLocation.lat, userLocation.lng], 14)} 
                    className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-green-700"
                >
                    Konum
                </button>
                <div className="bg-white rounded-lg shadow-lg flex">
                     <button onClick={() => changeMapLayer('street')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-l-lg">Sokak</button>
                     <button onClick={() => changeMapLayer('satellite')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-lg border-l">Uydu</button>
                </div>
            </div>
        </div>
    )
}

export default MapComponent