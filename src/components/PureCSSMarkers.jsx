import React from 'react'
import '../styles/pure-css-markers.css'

/**
 * 🎯 PURE CSS MARKERS - Ultra Performance + Perfect Styling
 * - Zero SVG complexity, pure CSS icons
 * - 4-5 line text support with perfect contrast
 * - GPU-accelerated animations
 * - Perfect spiderfy alignment
 */
export const PureCSSMarkers = ({ data, onMarkerClick }) => {
  if (!data || !data.length) return null

  return data.map((item, index) => (
    <div
      key={item.id || index}
      className={`css-marker-container ${item.type} ${item.isSponsored ? 'premium' : ''}`}
      onClick={() => onMarkerClick && onMarkerClick(item)}
      title={`${item.type === 'job' ? 'İş İlanı' : 'CV'}: ${item.title}`}
    >
      {/* CSS Icon - Building for Jobs, Briefcase for CVs */}
      <div className={`css-icon ${item.type}-icon ${item.isSponsored ? 'premium-icon' : ''}`}>
        {item.type === 'job' && (
          <div className="building-icon">
            <div className="building-base"></div>
            <div className="building-windows">
              <span className="window"></span>
              <span className="window"></span>
              <span className="window"></span>
              <span className="window"></span>
              <span className="window"></span>
              <span className="window"></span>
            </div>
            <div className="building-door"></div>
          </div>
        )}
        
        {item.type === 'cv' && (
          <div className="briefcase-icon">
            <div className="briefcase-body"></div>
            <div className="briefcase-handle"></div>
            <div className="briefcase-lock"></div>
            <div className="briefcase-details"></div>
          </div>
        )}
        
        {item.isSponsored && (
          <div className="premium-star">
            <div className="star-shape"></div>
            <div className="star-glow"></div>
          </div>
        )}
      </div>
      
      {/* Enhanced Text Area - 4-5 Lines with Perfect Contrast */}
      <div className="css-text-area">
        <div className="text-content">
          <div className="primary-text">
            {item.title || 'Başlık Belirtilmemiş'}
          </div>
          {item.company && (
            <div className="secondary-text">
              {item.company}
            </div>
          )}
          {item.location && (
            <div className="location-text">
              📍 {item.location.name || 'Lokasyon'}
            </div>
          )}
        </div>
      </div>
    </div>
  ))
}

export default PureCSSMarkers