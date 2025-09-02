import React, { useRef, useEffect } from 'react'
import { createCVPopup, createCVPopupMinimal, createCVPremiumPopup, CV_POPUP_STYLES } from '../../utils/cvPopupGenerator'
import { useTimelineModal } from '../../contexts/LayerContext'

// CV Marker Component for Map Integration
export function CVMarker({ 
  cvData, 
  leafletInstance, 
  clusterGroup,
  isSubscribed = false, 
  onPremiumClick,
  isClusterMode = false 
}) {
  const markerRef = useRef(null)
  const { open: openTimelineModal } = useTimelineModal()

  useEffect(() => {
    if (!leafletInstance || !cvData || !clusterGroup) return

    // Inject CSS styles if not already present
    if (!document.querySelector('#cv-popup-styles')) {
      const styleElement = document.createElement('style')
      styleElement.id = 'cv-popup-styles'
      styleElement.innerHTML = CV_POPUP_STYLES
      document.head.appendChild(styleElement)
    }

    // Create CV marker
    const createMarker = () => {
      const { lat, lng } = cvData.location
      
      // CV marker icon HTML
      const markerHtml = `
        <div class="marker-container cv-marker ${cvData.is_premium ? 'premium-marker' : ''}">
          <div class="cv-icon-wrapper" style="border-color: #10B981;">
            ${cvData.profile_photo_url ? `
              <img src="${cvData.profile_photo_url}" alt="${cvData.name}" class="cv-marker-photo" />
            ` : `
              <i class="fa-solid fa-user-tie" style="color: #10B981;"></i>
            `}
            ${cvData.timeline_items_count > 0 ? `
              <div class="cv-timeline-badge">${cvData.timeline_items_count}</div>
            ` : ''}
          </div>
          <div class="cv-marker-label">${cvData.name}</div>
        </div>
      `

      const customIcon = leafletInstance.divIcon({ 
        html: markerHtml, 
        className: '', 
        iconSize: [120, 90], 
        iconAnchor: [60, 26] 
      })

      const marker = leafletInstance.marker([lat, lng], { icon: customIcon })

      // Determine popup content based on subscription and cluster mode
      let popupContent
      if (!isSubscribed) {
        popupContent = createCVPremiumPopup()
      } else if (isClusterMode) {
        popupContent = createCVPopupMinimal(cvData)
      } else {
        popupContent = createCVPopup(cvData)
      }

      marker.bindPopup(popupContent)

      // Handle click events
      marker.on('click', function(e) {
        this.openPopup()
      })

      // Setup global functions for popup interactions
      setupPopupInteractions()

      return marker
    }

    // Setup popup interaction functions
    const setupPopupInteractions = () => {
      // Timeline modal opener
      window.openCVTimeline = (cvId) => {
        const cvProfile = cvData // In real app, fetch full CV data by ID
        openTimelineModal(cvProfile)
      }

      // Contact handler
      window.contactCV = (contact) => {
        if (contact.includes('@')) {
          window.location.href = `mailto:${contact}`
        } else if (contact.startsWith('http')) {
          window.open(contact, '_blank')
        } else {
          // Show contact info or copy to clipboard
          navigator.clipboard.writeText(contact).then(() => {
            // Show toast notification
            console.log('Contact info copied to clipboard')
          })
        }
      }

      // Premium click handler
      window.handlePremiumClick = () => {
        if (onPremiumClick) {
          onPremiumClick()
        }
      }
    }

    // Create and add marker
    markerRef.current = createMarker()
    clusterGroup.addLayer(markerRef.current)

    // Cleanup function
    return () => {
      if (markerRef.current && clusterGroup) {
        clusterGroup.removeLayer(markerRef.current)
      }
    }
  }, [cvData, leafletInstance, clusterGroup, isSubscribed, isClusterMode])

  // Update marker visibility based on layer state
  useEffect(() => {
    if (!markerRef.current || !clusterGroup) return

    // Marker visibility is controlled by the cluster group in LayerContext
    // This effect can be used for additional marker-specific updates
  }, [])

  return null // This component doesn't render anything directly
}

// CV Marker Icon Component (for custom styling)
export function CVMarkerIcon({ 
  cvData, 
  size = 'normal' // 'small' | 'normal' | 'large'
}) {
  const { name, profile_photo_url, timeline_items_count, is_premium } = cvData
  
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    normal: 'w-12 h-12 text-base', 
    large: 'w-16 h-16 text-lg'
  }

  return (
    <div className={`cv-marker-icon relative ${sizeClasses[size]}`}>
      <div className={`
        cv-marker-container rounded-full border-2 overflow-hidden
        ${is_premium ? 'border-yellow-400' : 'border-green-500'}
        ${is_premium ? 'shadow-yellow-200' : 'shadow-green-200'}
        shadow-lg transition-all duration-200 hover:scale-110
      `}>
        {profile_photo_url ? (
          <img 
            src={profile_photo_url} 
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        
        <div className={`
          cv-marker-fallback w-full h-full bg-green-100 
          flex items-center justify-center text-green-600
          ${profile_photo_url ? 'hidden' : 'flex'}
        `}>
          <i className="fa-solid fa-user-tie" />
        </div>

        {/* Timeline badge */}
        {timeline_items_count > 0 && (
          <div className="
            absolute -top-1 -right-1 bg-purple-500 text-white text-xs
            rounded-full w-5 h-5 flex items-center justify-center
            font-bold shadow-lg
          ">
            {timeline_items_count}
          </div>
        )}

        {/* Premium badge */}
        {is_premium && (
          <div className="
            absolute -top-1 -left-1 bg-yellow-400 text-yellow-800
            rounded-full w-4 h-4 flex items-center justify-center
          ">
            <i className="fa-solid fa-crown text-xs" />
          </div>
        )}
      </div>

      {/* Name label */}
      <div className="
        absolute top-full left-1/2 transform -translate-x-1/2 mt-1
        bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded
        whitespace-nowrap max-w-32 truncate
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
      ">
        {name}
      </div>
    </div>
  )
}

// CV Marker Cluster Component
export function CVMarkerCluster({ markers, leafletInstance, bounds }) {
  const clusterIcon = leafletInstance.divIcon({
    html: `
      <div class="cv-cluster-marker">
        <div class="cv-cluster-icon">
          <i class="fa-solid fa-users"></i>
          <span class="cv-cluster-count">${markers.length}</span>
        </div>
        <div class="cv-cluster-label">CV'ler</div>
      </div>
    `,
    className: '',
    iconSize: [60, 60],
    iconAnchor: [30, 30]
  })

  return clusterIcon
}

// CSS styles for CV markers
export const CV_MARKER_STYLES = `
<style>
.cv-marker {
  position: relative;
}

.cv-icon-wrapper {
  width: 48px;
  height: 48px;
  border: 3px solid #10B981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  position: relative;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;
}

.cv-icon-wrapper:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

.cv-marker-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.cv-timeline-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #8B5CF6;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.cv-marker-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}

.premium-marker .cv-icon-wrapper {
  border-color: #F59E0B;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.premium-marker .cv-icon-wrapper:hover {
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.cv-cluster-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cv-cluster-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  position: relative;
}

.cv-cluster-count {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: white;
  color: #10B981;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

.cv-cluster-label {
  font-size: 10px;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 3px;
  margin-top: 2px;
}
</style>
`