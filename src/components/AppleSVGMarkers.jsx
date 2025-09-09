import React from 'react'

/**
 * 🍎 APPLE ECOSYSTEM SVG MARKERS
 * - Ultra-lightweight SVG symbols (90% memory reduction)
 * - Apple-style design: clean geometry, subtle gradients, perfect alignment
 * - GPU-accelerated with will-change optimization
 * - Reusable symbol system for maximum performance
 */
const AppleSVGSymbols = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
    <defs>
      {/* 🏢 Job Marker - Turquoise Building Icon */}
      <symbol id="job-marker" viewBox="0 0 60 75">
        <defs>
          <linearGradient id="jobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#40E0D0" />
            <stop offset="100%" stopColor="#20B2AA" />
          </linearGradient>
          <filter id="jobShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {/* Square background */}
        <rect 
          x="7" 
          y="7" 
          width="46" 
          height="46" 
          rx="9" 
          ry="9"
          fill="url(#jobGradient)"
          filter="url(#jobShadow)"
          stroke="white"
          strokeWidth="1.5"
        />
        
        {/* Building icon */}
        <g fill="white" opacity="0.95">
          {/* Main building */}
          <rect x="18" y="18" width="24" height="24" fill="white" opacity="0.9" />
          {/* Building windows */}
          <rect x="21" y="21" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="26" y="21" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="31" y="21" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="36" y="21" width="3" height="3" fill="currentColor" opacity="0.7" />
          
          <rect x="21" y="26" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="26" y="26" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="31" y="26" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="36" y="26" width="3" height="3" fill="currentColor" opacity="0.7" />
          
          <rect x="21" y="31" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="26" y="31" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="31" y="31" width="3" height="3" fill="currentColor" opacity="0.7" />
          <rect x="36" y="31" width="3" height="3" fill="currentColor" opacity="0.7" />
          
          {/* Door */}
          <rect x="27" y="35" width="6" height="7" fill="currentColor" opacity="0.7" />
        </g>
        
      </symbol>

      {/* 💼 CV Marker - Orange Briefcase Icon */}
      <symbol id="cv-marker" viewBox="0 0 60 75">
        <defs>
          <linearGradient id="cvGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FF6600" />
          </linearGradient>
          <filter id="cvShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {/* Square background */}
        <rect 
          x="7" 
          y="7" 
          width="46" 
          height="46" 
          rx="9" 
          ry="9"
          fill="url(#cvGradient)"
          filter="url(#cvShadow)"
          stroke="white"
          strokeWidth="1.5"
        />
        
        {/* Briefcase icon */}
        <g fill="white" opacity="0.95">
          {/* Briefcase body */}
          <rect x="17" y="25" width="26" height="15" rx="2" fill="white" opacity="0.9" />
          
          {/* Briefcase handle */}
          <rect x="24" y="22" width="12" height="6" rx="3" fill="white" opacity="0.9" />
          
          {/* Briefcase lock */}
          <rect x="29" y="30" width="2" height="4" rx="1" fill="currentColor" opacity="0.7" />
          
          {/* Briefcase details */}
          <line x1="19" y1="32" x2="41" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </g>
        
      </symbol>

      {/* ⭐ Premium Sponsored Marker - Gold */}
      <symbol id="sponsored-marker" viewBox="0 0 75 90">
        <defs>
          <linearGradient id="sponsoredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
          <filter id="sponsoredGlow">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#FFB000" floodOpacity="0.5" />
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {/* Square background */}
        <rect 
          x="3" 
          y="3" 
          width="69" 
          height="54" 
          rx="12" 
          ry="12"
          fill="url(#sponsoredGradient)"
          filter="url(#sponsoredGlow)"
          stroke="white"
          strokeWidth="3"
        />
        
        {/* Premium star icon */}
        <path 
          d="M37.5 12L42 27H58.5L45 37.5L49.5 52.5L37.5 42L25.5 52.5L30 37.5L16.5 27H33L37.5 12Z" 
          fill="white"
          opacity="0.95"
          filter="url(#sponsoredGlow)"
        />
        
      </symbol>

      {/* 📍 Location Pin Base (for alternative style) */}
      <symbol id="pin-marker" viewBox="0 0 24 32">
        <defs>
          <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34C759" />
            <stop offset="100%" stopColor="#30AD51" />
          </linearGradient>
          <filter id="pinShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        <path 
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
          fill="url(#pinGradient)"
          filter="url(#pinShadow)"
        />
        <circle cx="12" cy="9" r="4" fill="white" opacity="0.9" />
      </symbol>
    </defs>
  </svg>
)

/**
 * 🚀 Individual SVG Marker Component with Dynamic Text
 * Ultra-performant with memoization and GPU acceleration
 * Now supports dynamic job titles and CV titles
 */
const AppleSVGMarker = React.memo(({ 
  type, 
  isSponsored, 
  x, 
  y, 
  title,
  company,
  onClick,
  style = 'square' // Now default to square
}) => {
  const getSymbolId = () => {
    if (isSponsored) return 'sponsored-marker'
    return type === 'job' ? 'job-marker' : 'cv-marker'
  }

  const getSize = () => {
    if (isSponsored) return { width: 100, height: 120 } // 3x larger
    return { width: 80, height: 100 } // 3x larger
  }

  const size = getSize()
  
  // Truncate text for display
  const truncateText = (text, maxLength = 15) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
  
  const displayTitle = truncateText(title)
  const displayCompany = truncateText(company)
  
  return (
    <div
      className="apple-svg-marker-container"
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: isSponsored ? 1000 : 100,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        width: `${size.width}px`,
        height: `${size.height + 25}px`, // Extra space for title
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
      title={`${type === 'job' ? 'İş İlanı' : 'CV'}: ${title}`}
      onClick={onClick}
    >
      <svg
        className="apple-svg-marker"
        width={size.width}
        height={size.height}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        <use href={`#${getSymbolId()}`} />
      </svg>
      
      {/* Dynamic title text below marker */}
      <div 
        className="marker-text"
        style={{
          marginTop: '5px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: '600',
          fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, Roboto, sans-serif',
          color: isSponsored ? '#FF8C00' : (type === 'job' ? '#20B2AA' : '#FF6600'),
          textShadow: '0 1px 2px rgba(255,255,255,0.8)',
          lineHeight: '1.2',
          maxWidth: `${size.width}px`,
          overflow: 'hidden'
        }}
      >
        <div style={{ fontWeight: '700' }}>{displayTitle}</div>
        {company && (
          <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '1px' }}>
            {displayCompany}
          </div>
        )}
      </div>
    </div>
  )
})

AppleSVGMarker.displayName = 'AppleSVGMarker'

/**
 * Create dynamic SVG symbols with custom text
 * This allows for personalized markers with job/CV specific content
 */
export const createDynamicMarkerSymbol = (id, type, title, isSponsored = false) => {
  const symbolId = `${id}-marker`
  const size = isSponsored ? { width: 100, height: 120 } : { width: 80, height: 100 }
  const color = type === 'job' ? '#40E0D0' : '#FF8C00'
  const darkColor = type === 'job' ? '#20B2AA' : '#FF6600'
  
  return `
    <symbol id="${symbolId}" viewBox="0 0 ${size.width} ${size.height + 25}">
      <defs>
        <linearGradient id="${symbolId}-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="${color}" />
          <stop offset="100%" stopColor="${darkColor}" />
        </linearGradient>
      </defs>
      
      <rect 
        x="${size.width * 0.1}" 
        y="${size.width * 0.1}" 
        width="${size.width * 0.75}" 
        height="${size.width * 0.75}" 
        rx="12" 
        fill="url(#${symbolId}-gradient)"
        stroke="white"
        strokeWidth="2"
      />
      
      <text 
        x="${size.width / 2}" 
        y="${size.height - 10}" 
        textAnchor="middle" 
        fontSize="10" 
        fontFamily="-apple-system, BlinkMacSystemFont, SF Pro Display" 
        fontWeight="600" 
        fill="${darkColor}"
      >${title.substring(0, 12)}${title.length > 12 ? '...' : ''}</text>
    </symbol>
  `
}

export { AppleSVGSymbols }
export default AppleSVGSymbols