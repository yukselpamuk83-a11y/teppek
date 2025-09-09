// MODERN POPUP GENERATOR - Bucket-first data with modern design
import logger from './logger.js'
import { supabase } from '../lib/supabase.js'

/**
 * Color themes for different item types
 */
const POPUP_THEMES = {
  api: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'bg-emerald-500',
    text: 'text-emerald-800',
    button: 'bg-emerald-500 hover:bg-emerald-600'
  },
  manual: {
    bg: 'bg-cyan-50', 
    border: 'border-cyan-200',
    accent: 'bg-cyan-500',
    text: 'text-cyan-800',
    button: 'bg-cyan-500 hover:bg-cyan-600'
  },
  cv: {
    bg: 'bg-orange-50',
    border: 'border-orange-200', 
    accent: 'bg-orange-500',
    text: 'text-orange-800',
    button: 'bg-orange-500 hover:bg-orange-600'
  }
}

/**
 * Bucket-first data fetcher
 * Priority: Bucket data → Database fallback
 */
async function fetchCompleteItemData(item) {
  try {
    // First check if we already have complete data from bucket
    const hasCompleteData = item.title && item.company && item.city && (item.url || item.contact)
    
    if (hasCompleteData) {
      logger.debug('Using complete bucket data for item:', item.id)
      return item
    }
    
    // Fallback to database if bucket data is incomplete
    logger.debug('Fetching additional data from database for item:', item.id)
    
    const { data: dbItem, error } = await supabase
      .from('jobs') // or appropriate table
      .select('*')
      .eq('id', item.id)
      .single()
    
    if (error) {
      logger.warn('Database fallback failed:', error.message)
      return item // Return bucket data even if incomplete
    }
    
    // Merge bucket data with database data
    const completeItem = {
      ...dbItem,
      ...item, // Bucket data overrides database
      // Ensure we preserve bucket coordinates
      location: item.location || {
        lat: dbItem.lat,
        lng: dbItem.lng
      }
    }
    
    logger.debug('Successfully merged bucket and database data')
    return completeItem
    
  } catch (error) {
    logger.error('Error in fetchCompleteItemData:', error)
    return item // Return original item as fallback
  }
}

/**
 * Modern API Job Popup (Green theme)
 */
function createAPIJobPopup(item) {
  const theme = POPUP_THEMES.api
  const hasUrl = item.url && item.url !== '#'
  
  return `
    <div class="modern-popup-container ${theme.bg} ${theme.border} border-2 rounded-xl shadow-lg max-w-sm">
      <!-- Header with source indicator -->
      <div class="flex items-start justify-between p-4 pb-2">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 leading-tight mb-1">${item.title || 'İlan Başlığı'}</h3>
          <div class="inline-flex items-center px-2 py-1 ${theme.accent} text-white text-xs rounded-full">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979.424.708.736 1.782.736 3.021 0 1.239-.312 2.313-.736 3.021C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979C8.312 12.313 8 11.239 8 10c0-1.239.312-2.313.736-3.021z" clip-rule="evenodd" />
            </svg>
            API İlanı
          </div>
        </div>
      </div>
      
      <!-- Company and Location -->
      <div class="px-4 pb-3 space-y-2">
        <div class="flex items-center ${theme.text}">
          <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-medium">${item.company || 'Şirket Belirtilmemiş'}</span>
        </div>
        
        <div class="flex items-center ${theme.text}">
          <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm">${item.city || 'Konum Belirtilmemiş'}</span>
        </div>
      </div>
      
      <!-- Salary if available -->
      ${item.salary_min && item.salary_max ? `
        <div class="px-4 pb-3">
          <div class="inline-flex items-center px-3 py-1 bg-white rounded-full border ${theme.border}">
            <svg class="w-4 h-4 mr-2 ${theme.text}" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-medium">${item.currency || 'USD'} ${Math.round(item.salary_min).toLocaleString()} - ${Math.round(item.salary_max).toLocaleString()}</span>
          </div>
        </div>
      ` : ''}
      
      <!-- Action Button -->
      <div class="p-4 pt-2">
        ${hasUrl ? `
          <a href="${item.url}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="w-full inline-flex items-center justify-center px-4 py-3 ${theme.button} text-white text-sm font-semibold rounded-lg transition-colors duration-200">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            İlana Başvur
          </a>
        ` : `
          <div class="text-center text-sm text-gray-500 py-2">Başvuru linki mevcut değil</div>
        `}
      </div>
    </div>
  `
}

/**
 * Modern Manual Job Popup (Cyan/Turquoise theme)
 */
function createManualJobPopup(item) {
  const theme = POPUP_THEMES.manual
  const hasContact = item.contact && item.contact !== ''
  const hasUrl = item.url && item.url !== '#'
  
  return `
    <div class="modern-popup-container ${theme.bg} ${theme.border} border-2 rounded-xl shadow-lg max-w-sm">
      <!-- Header -->
      <div class="flex items-start justify-between p-4 pb-2">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 leading-tight mb-1">${item.title || 'İlan Başlığı'}</h3>
          <div class="inline-flex items-center px-2 py-1 ${theme.accent} text-white text-xs rounded-full">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
            </svg>
            Manuel İlan
          </div>
        </div>
      </div>
      
      <!-- Company and Location -->
      <div class="px-4 pb-3 space-y-2">
        <div class="flex items-center ${theme.text}">
          <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-medium">${item.company || 'Şirket Belirtilmemiş'}</span>
        </div>
        
        <div class="flex items-center ${theme.text}">
          <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm">${item.city || 'Konum Belirtilmemiş'}</span>
        </div>
      </div>
      
      <!-- Salary if available -->
      ${item.salary_min && item.salary_max ? `
        <div class="px-4 pb-3">
          <div class="inline-flex items-center px-3 py-1 bg-white rounded-full border ${theme.border}">
            <svg class="w-4 h-4 mr-2 ${theme.text}" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-medium">${item.currency || 'TRY'} ${Math.round(item.salary_min).toLocaleString()} - ${Math.round(item.salary_max).toLocaleString()}</span>
          </div>
        </div>
      ` : ''}
      
      <!-- Action Button -->
      <div class="p-4 pt-2 space-y-2">
        ${hasUrl ? `
          <a href="${item.url}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="w-full inline-flex items-center justify-center px-4 py-3 ${theme.button} text-white text-sm font-semibold rounded-lg transition-colors duration-200">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            İlana Git
          </a>
        ` : ''}
        
        ${hasContact ? `
          <div class="bg-white rounded-lg p-3 border ${theme.border}">
            <div class="flex items-center ${theme.text} mb-1">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span class="text-xs font-medium">İletişim:</span>
            </div>
            <div class="text-sm text-gray-700">${item.contact}</div>
          </div>
        ` : !hasUrl ? `
          <div class="text-center text-sm text-gray-500 py-2">İletişim bilgisi mevcut değil</div>
        ` : ''}
      </div>
    </div>
  `
}

/**
 * Modern CV Popup (Orange theme)
 */
function createCVPopup(item) {
  const theme = POPUP_THEMES.cv
  const hasContact = item.contact && item.contact !== ''
  const candidateName = item.name || item.full_name || 'İsim Belirtilmemiş'
  
  return `
    <div class="modern-popup-container ${theme.bg} ${theme.border} border-2 rounded-xl shadow-lg max-w-sm">
      <!-- Header -->
      <div class="flex items-start justify-between p-4 pb-2">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 leading-tight mb-1">${item.title || 'Profesyonel Profil'}</h3>
          <div class="inline-flex items-center px-2 py-1 ${theme.accent} text-white text-xs rounded-full">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
            CV Profili
          </div>
        </div>
      </div>
      
      <!-- Candidate Name -->
      <div class="px-4 pb-2">
        <div class="flex items-center ${theme.text}">
          <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-semibold">${candidateName}</span>
        </div>
      </div>
      
      <!-- Location and Experience -->
      <div class="px-4 pb-3 space-y-2">
        <div class="flex items-center ${theme.text}">
          <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm">${item.city || 'Konum Belirtilmemiş'}</span>
        </div>
        
        ${item.experience_years ? `
          <div class="flex items-center ${theme.text}">
            <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm">${item.experience_years} yıl deneyim</span>
          </div>
        ` : ''}
      </div>
      
      <!-- Expected Salary if available -->
      ${item.salary_min && item.salary_max ? `
        <div class="px-4 pb-3">
          <div class="inline-flex items-center px-3 py-1 bg-white rounded-full border ${theme.border}">
            <svg class="w-4 h-4 mr-2 ${theme.text}" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-medium">Beklenti: ${item.currency || 'TRY'} ${Math.round(item.salary_min).toLocaleString()} - ${Math.round(item.salary_max).toLocaleString()}</span>
          </div>
        </div>
      ` : ''}
      
      <!-- Skills if available -->
      ${item.skills ? `
        <div class="px-4 pb-3">
          <div class="bg-white rounded-lg p-3 border ${theme.border}">
            <div class="flex items-center ${theme.text} mb-2">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              <span class="text-xs font-medium">Yetenekler:</span>
            </div>
            <div class="text-sm text-gray-700">${item.skills.split(',').slice(0, 3).map(skill => skill.trim()).join(', ')}${item.skills.split(',').length > 3 ? '...' : ''}</div>
          </div>
        </div>
      ` : ''}
      
      <!-- Contact Information -->
      <div class="p-4 pt-2">
        ${hasContact ? `
          <div class="bg-white rounded-lg p-3 border ${theme.border}">
            <div class="flex items-center ${theme.text} mb-1">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span class="text-xs font-medium">İletişim:</span>
            </div>
            <div class="text-sm text-gray-700">${item.contact}</div>
          </div>
        ` : `
          <div class="text-center text-sm text-gray-500 py-2">İletişim bilgisi mevcut değil</div>
        `}
      </div>
    </div>
  `
}

/**
 * Main popup factory with bucket-first data strategy
 */
export async function createModernPopup(item) {
  try {
    // Fetch complete data using bucket-first strategy
    const completeItem = await fetchCompleteItemData(item)
    
    // Determine item type and create appropriate popup
    const isApiJob = completeItem.source === 'adzuna' || 
                     completeItem.adzuna_id || 
                     (completeItem.url && completeItem.url.includes('adzuna')) ||
                     completeItem.source === 'api'
    
    const isCV = completeItem.type === 'cv'
    
    logger.debug('Creating modern popup for:', {
      id: completeItem.id,
      type: isApiJob ? 'API' : (isCV ? 'CV' : 'Manual'),
      title: completeItem.title
    })
    
    if (isApiJob) {
      return createAPIJobPopup(completeItem)
    } else if (isCV) {
      return createCVPopup(completeItem)
    } else {
      return createManualJobPopup(completeItem)
    }
    
  } catch (error) {
    logger.error('Error creating modern popup:', error)
    // Fallback to basic popup if something fails
    return createManualJobPopup(item)
  }
}

export { createAPIJobPopup, createManualJobPopup, createCVPopup }