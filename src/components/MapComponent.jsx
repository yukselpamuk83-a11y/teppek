import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { getDistance } from '../utils/distance'

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

    const changeMapLayer = (layerKey) => {
        if (mapInstance.current && tileLayer) {
            mapInstance.current.removeLayer(tileLayer)
        }
        const newLayer = L.tileLayer(tileProviders[layerKey].url, {
            attribution: tileProviders[layerKey].attribution,
            noWrap: true
        }).addTo(mapInstance.current)
        setTileLayer(newLayer)
    }

    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
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

            clusterGroupRef.current = L.markerClusterGroup()
            mapInstance.current.addLayer(clusterGroupRef.current)
            
            // Harita boyut sorununu çöz
            setTimeout(() => {
                if (mapInstance.current) {
                    mapInstance.current.invalidateSize()
                }
            }, 100)
        }
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

    useEffect(() => {
        if (!clusterGroupRef.current) return
        clusterGroupRef.current.clearLayers()
        data.forEach(item => {
            const distance = getDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng)
            const isPremiumContent = distance > 50
            const canView = isSubscribed || !isPremiumContent

            const iconClass = item.type === 'job' ? 'fa-briefcase' : 'fa-user'
            const iconColor = item.type === 'job' ? '#0097A7' : '#FB8C00'
            const iconHtml = `<div class="marker-container ${item.isSponsored ? 'sponsored-marker' : ''}"><div class="icon-wrapper" style="border-color: ${item.isSponsored ? '#FBBF24' : iconColor};">${item.isSponsored ? '<i class="fa-solid fa-star absolute -top-2 -right-2 text-yellow-400 text-xl"></i>' : ''}<i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i></div><div class="marker-label">${item.title}</div></div>`
            const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [120, 90], iconAnchor: [60, 26] })
            const marker = L.marker([item.location.lat, item.location.lng], { icon: customIcon })
            
            let popupContent
            if (canView) {
                const sponsoredPopupClass = item.isSponsored ? 'bg-yellow-50' : ''
                // İlan türüne göre başvuru/iletişim
                let applyButton = ''
                if (item.type === 'cv' && item.contact) {
                    // CV - İletişim bilgisi
                    applyButton = `<div style="background-color: #fff7ed; padding: 12px; border-radius: 8px; margin-top: 12px; border: 1px solid #fed7aa;">
                        <div style="font-weight: 600; color: #ea580c; margin-bottom: 6px; display: flex; align-items: center;">
                            <i class="fa-solid fa-phone" style="margin-right: 6px; font-size: 14px;"></i>
                            İletişim Bilgileri
                        </div>
                        <div style="color: #ea580c; word-break: break-all; font-size: 14px;">${item.contact}</div>
                    </div>`
                } else if (item.type === 'job' && item.source === 'manual' && item.contact) {
                    // Manuel İş İlanı - İletişim bilgisi
                    applyButton = `<div style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; margin-top: 12px; border: 1px solid #bfdbfe;">
                        <div style="font-weight: 600; color: #1e40af; margin-bottom: 6px; display: flex; align-items: center;">
                            <i class="fa-solid fa-envelope" style="margin-right: 6px; font-size: 14px;"></i>
                            İletişim Bilgileri
                        </div>
                        <div style="color: #1e40af; word-break: break-all; font-size: 14px;">${item.contact}</div>
                    </div>`
                } else if (item.type === 'job' && item.applyUrl) {
                    // API İş İlanı - Başvuru butonu
                    applyButton = `<a href="${item.applyUrl}" target="_blank" rel="noopener noreferrer" 
                       style="display: block; width: 100%; background-color: #2563eb; color: white; font-weight: bold; padding: 12px 16px; border-radius: 8px; text-align: center; margin-top: 12px; text-decoration: none; transition: background-color 0.3s;"
                       onmouseover="this.style.backgroundColor='#1d4ed8'" 
                       onmouseout="this.style.backgroundColor='#2563eb'">
                        <i class="fa-solid fa-external-link-alt" style="margin-right: 8px;"></i>İlana Başvur
                    </a>`
                }
                
                // Adzuna attribution - HER ZAMAN göster (Adzuna ilanları için zorunlu)
                const attribution = item.source === 'adzuna' ? 
                    `<div style="background-color: #f3f4f6; padding: 8px; border-radius: 4px; margin-top: 12px; text-align: center; font-size: 12px;">
                        <img src="https://c.adzuna.com/logo/adzuna_logo_small.png" style="height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;" alt="Adzuna">
                        <span style="color: #6b7280;">Powered by</span> 
                        <a href="https://www.adzuna.com" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">Adzuna</a>
                    </div>` : ''
                
                popupContent = `<div class="custom-popup-container ${sponsoredPopupClass}">
                    <!-- İlan Başlığı -->
                    <div style="font-size: 18px; font-weight: bold; color: #0097A7; margin-bottom: 8px; line-height: 1.3;">
                        ${item.title}
                    </div>
                    
                    <!-- Maaş Bilgisi (Sadece iş ilanları için) -->
                    ${item.type === 'job' ? `
                    <div style="font-size: 15px; font-weight: bold; color: #059669; margin-bottom: 12px; padding: 8px; background-color: #f0fdf4; border-radius: 6px; display: flex; align-items: center;">
                        <i class="fa-solid fa-dollar-sign" style="margin-right: 8px; font-size: 14px;"></i>
                        ${item.currency || 'USD'} ${item.salary_min?.toLocaleString() || '?'} - ${item.salary_max?.toLocaleString() || '?'}
                    </div>
                    ` : ''}
                    
                    <!-- İş İlanı için Şirket Bilgisi / CV için Kişi Bilgisi -->
                    ${item.type === 'job' ? `
                    <div style="font-size: 14px; color: #4b5563; margin-bottom: 12px; line-height: 1.4; border-left: 3px solid #e5e7eb; padding-left: 12px;">
                        <i class="fa-solid fa-building" style="margin-right: 8px; color: #6b7280;"></i>${item.company || 'Şirket bilgisi mevcut değil'}
                        <br><i class="fa-solid fa-location-dot" style="margin-right: 8px; color: #6b7280; margin-top: 4px;"></i>${item.address}
                    </div>
                    ` : `
                    <div style="font-size: 14px; color: #4b5563; margin-bottom: 12px; line-height: 1.4; border-left: 3px solid #e5e7eb; padding-left: 12px;">
                        <i class="fa-solid fa-user" style="margin-right: 8px; color: #6b7280;"></i>${item.name || 'Kişi bilgisi mevcut değil'}
                        <br><i class="fa-solid fa-briefcase" style="margin-right: 8px; color: #6b7280; margin-top: 4px;"></i>${item.title || 'Ünvan belirtilmemiş'}
                        ${item.description ? `<br><i class="fa-solid fa-file-text" style="margin-right: 8px; color: #6b7280; margin-top: 4px;"></i>${item.description}` : ''}
                        <br><i class="fa-solid fa-location-dot" style="margin-right: 8px; color: #6b7280; margin-top: 4px;"></i>${item.address}
                    </div>
                    `}
                    
                    <!-- Başvuru Butonu -->
                    ${applyButton}
                    
                    <!-- Adzuna Attribution -->
                    ${attribution}
                </div>`
            } else {
                popupContent = `<div class="custom-popup-container text-center">
                    <div class="font-bold text-lg ${item.type === 'job' ? 'text-ilan' : 'text-cv'}">${item.title}</div>
                    <div class="text-base font-semibold text-gray-800">${item.company || item.name}</div>
                    <p class="text-sm text-gray-600 my-2">Bu kayıt <b>50 km'lik ücretsiz alanınızın dışında</b> kaldığı için detayları gizlenmiştir. Tüm fırsatlara erişmek için abone olun.</p>
                    <button id="subscribe-btn-${item.id}" class="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">Abonelik Seçenekleri</button>
                </div>`
            }
            
            marker.bindPopup(popupContent)

            marker.on('popupopen', () => {
                if (!canView) {
                    const btn = document.getElementById(`subscribe-btn-${item.id}`)
                    if (btn) btn.onclick = onPremiumClick
                }
            })

            clusterGroupRef.current.addLayer(marker)
        })
    }, [data, isSubscribed, userLocation])

    useEffect(() => {
        if (selectedLocation && mapInstance.current) {
            mapInstance.current.flyTo([selectedLocation.lat, selectedLocation.lng], 18, { animate: true, duration: 1.5 })
        }
    }, [selectedLocation])

    return (
        <div className="relative h-full w-full">
            <div ref={mapRef} className="h-full w-full" />
            {/* Kontrol paneli */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button 
                    onClick={() => mapInstance.current && userLocation && mapInstance.current.flyTo([userLocation.lat, userLocation.lng], 14)} 
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