/**
 * 🚀 MODERN POPUP GENERATOR - Next-Gen Design System
 * - Sophisticated design with proper spacing and typography
 * - Multi-theme support (job/cv/premium)
 * - Enhanced user experience with visual hierarchy
 * - Perfect for professional job/CV listings
 */
import { svgIcons } from './svgIcons.js'

const getTheme = (type, isSponsored) => {
  if (isSponsored) {
    return {
      container: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
      accent: 'bg-gradient-to-r from-amber-500 to-orange-500',
      button: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
      icon: 'text-amber-600'
    }
  }
  
  switch (type) {
    case 'job':
      return {
        container: 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200',
        accent: 'bg-gradient-to-r from-teal-500 to-cyan-500',
        button: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700',
        icon: 'text-teal-600'
      }
    case 'cv':
      return {
        container: 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200',
        accent: 'bg-gradient-to-r from-orange-500 to-red-500',
        button: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
        icon: 'text-orange-600'
      }
    default:
      return {
        container: 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200',
        accent: 'bg-gradient-to-r from-gray-500 to-slate-500',
        button: 'bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700',
        icon: 'text-gray-600'
      }
  }
}

export async function createModernPopup(item) {
  // Bucket'tan veya API'den tam veri çek
  let fullData = item
  
  // Eğer bucket'ta eksik veriler varsa API'den tamamla
  if (!item.description || !item.url || !item.salary_min) {
    try {
      // API'den tam veri çek (bucket'ta olmayanlar için)
      const response = await fetch(`/api/job-details/${item.id}`)
      if (response.ok) {
        const apiData = await response.json()
        fullData = { ...item, ...apiData }
      }
    } catch (error) {
      console.log('API data fetch failed, using bucket data only')
    }
  }
  
  return `
    <div class="modern-popup-container bg-gradient-to-br from-white to-gray-50 border-2 border-teal-200 rounded-xl shadow-lg max-w-sm overflow-hidden">
      <div class="flex items-start justify-between p-4 pb-2">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 leading-tight mb-1">${fullData.title || 'İlan Başlığı'}</h3>
          <div class="inline-flex items-center px-2 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs rounded-full">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979.424.708.736 1.782.736 3.021 0 1.239-.312 2.313-.736 3.021C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979C8.312 12.313 8 11.239 8 10c0-1.239.312-2.313.736-3.021z" clip-rule="evenodd" />
            </svg>
            ${fullData.source || 'Adzuna'}
          </div>
        </div>
        <div class="text-teal-600">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      
      <div class="px-4 pb-3 space-y-3">
        ${fullData.company ? `
          <div class="flex items-center text-sm text-gray-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" />
            </svg>
            <span class="ml-2 font-medium">${fullData.company}</span>
          </div>
        ` : ''}
        
        ${fullData.city || fullData.country ? `
          <div class="flex items-center text-sm text-gray-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
            <span class="ml-2">${fullData.city || ''}${fullData.city && fullData.country ? ', ' : ''}${fullData.country || ''}</span>
          </div>
        ` : ''}
        
        ${(fullData.salary_min || fullData.salary_max) ? `
          <div class="flex items-center text-sm text-gray-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
            </svg>
            <span class="ml-2 font-medium">
              ${fullData.currency || 'USD'} ${fullData.salary_min ? Math.round(fullData.salary_min).toLocaleString() : '?'} - ${fullData.salary_max ? Math.round(fullData.salary_max).toLocaleString() : '?'}
            </span>
          </div>
        ` : ''}
        
        ${fullData.description ? `
          <div class="text-sm text-gray-700 mt-3 leading-relaxed">
            ${fullData.description.substring(0, 200)}${fullData.description.length > 200 ? '...' : ''}
          </div>
        ` : ''}
      </div>
      
      <div class="px-4 pb-4">
        ${fullData.url ? `
          <a href="${fullData.url}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            İlana Başvur
          </a>
        ` : `
          <div class="text-center text-sm text-gray-500 py-3">Başvuru linki mevcut değil</div>
        `}
      </div>
    </div>
  `
}

export default createModernPopup
