/**
 * 🚀 CLASSIC POPUP GENERATOR - Original Design with Complete Data
 * - Classic popup design with enhanced data fetching
 * - Complete job information with hybrid bucket/API data
 * - Original styling maintained for consistency
 */
import { svgIcons } from './svgIcons.js'

export async function createModernPopup(item) {
  console.log('🔍 Creating popup for:', item.title, 'ID:', item.id)
  console.log('📊 Bucket data:', {
    hasDescription: !!item.description,
    hasUrl: !!item.url,
    hasSalary: !!(item.salary_min && item.salary_max),
    hasCity: !!item.city,
    hasCountry: !!item.country
  })
  
  // Bucket'tan veya API'den tam veri çek
  let fullData = { ...item }
  
  // Her zaman API'den tam veri çekmeye çalış (eksik veriler için)
  const needsApiData = !item.description || !item.url || !item.salary_min || !item.salary_max
  
  if (needsApiData) {
    console.log('🌐 Fetching additional data from API for item:', item.id)
    try {
      // Sadece çalışan endpoint kullan
      const endpoints = [
        `/api/job-details?id=${item.id}`
      ]
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Trying API endpoint: ${endpoint}`)
          const response = await fetch(endpoint)
          if (response.ok) {
            const apiResponse = await response.json()
            
            // API response'u handle et (success wrapper varsa)
            const apiData = apiResponse.success ? apiResponse : apiResponse
            
            console.log('✅ API data received:', {
              hasDescription: !!apiData.description,
              hasUrl: !!apiData.url,
              hasSalary: !!(apiData.salary_min && apiData.salary_max),
              hasCity: !!apiData.city,
              hasCountry: !!apiData.country,
              hasCompany: !!apiData.company
            })
            
            // API'den gelen verileri bucket verisi üzerine merge et
            fullData = { 
              ...fullData, 
              ...apiData,
              // Legacy field mapping - eski popup'ların field isimleri
              description: apiData.description?.text || apiData.description || fullData.description?.text || fullData.description,
              // Lokasyon bilgileri
              city: apiData.city || fullData.city,
              country: apiData.country || fullData.country,
              // Maaş bilgileri
              salary_min: apiData.salary_min || fullData.salary_min,
              salary_max: apiData.salary_max || fullData.salary_max,
              currency: apiData.currency || fullData.currency,
              // URL ve diğer
              url: apiData.url || fullData.url,
              company: apiData.company || fullData.company,
              title: apiData.title || fullData.title,
              source: apiData.source || fullData.source,
              // CV için özel field'lar
              contact: apiData.contact || fullData.contact,
              skills: apiData.skills || fullData.skills,
              experience_years: apiData.experience_years || fullData.experience_years,
              name: apiData.name || apiData.full_name || fullData.name || fullData.full_name,
              remote: apiData.remote || fullData.remote
            }
            console.log('✅ Merged data successfully with all fields')
            break // İlk başarılı API çağrısından sonra dur
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint} failed:`, endpointError.message)
          continue
        }
      }
    } catch (error) {
      console.log('❌ All API endpoints failed, using bucket data only:', error.message)
    }
  }
  
  console.log('📋 Final data for popup:', {
    title: fullData.title,
    hasDescription: !!fullData.description,
    hasUrl: !!fullData.url,
    hasSalary: !!(fullData.salary_min && fullData.salary_max),
    hasLocation: !!(fullData.city || fullData.country)
  })

  // Enhanced Adzuna detection - multiple fallback checks
  const isAdzunaJob = fullData.source === 'adzuna' || 
                      fullData.adzuna_id || 
                      (fullData.url && fullData.url.includes('adzuna')) ||
                      (fullData.company && fullData.salary_min && fullData.salary_max && fullData.url)
  
  if (isAdzunaJob) {
    return createAdzunaJobPopup(fullData)
  }
  
  if (fullData.type === 'cv') {
    return createCVPopup(fullData)
  }
  
  // Default: Manuel job popup
  return createManualJobPopup(fullData)
}

/**
 * Adzuna API'sinden gelen iş ilanları için popup
 */
function createAdzunaJobPopup(item) {
  // Sadece city bilgisini göster
  const address = item.city || ''
  
  return `
    <div class="custom-popup-container adzuna-popup">
      <div class="popup-header">
        <div class="popup-title">${item.title}</div>
        <div class="popup-source">
          ${svgIcons.globe}
          Adzuna
        </div>
      </div>
      
      ${(item.salary_min && item.salary_max) ? `
        <div class="popup-salary adzuna-salary">
          ${svgIcons.dollar}
          ${item.currency || 'USD'} ${item.salary_min ? Math.round(item.salary_min).toLocaleString() : '?'} - ${item.salary_max ? Math.round(item.salary_max).toLocaleString() : '?'}
        </div>
      ` : ''}
      
      <div class="popup-details">
        <div class="popup-company">
          ${svgIcons.building}
          ${item.company || 'Şirket bilgisi mevcut değil'}
        </div>
        <div class="popup-location">
          ${svgIcons.location}
          ${address}
        </div>
      </div>

      ${item.description ? `
      <div class="popup-description">
        ${item.description.substring(0, 200)}${item.description.length > 200 ? '...' : ''}
      </div>
      ` : ''}
      
      ${item.url ? `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="popup-apply-btn adzuna-apply">
          ${svgIcons.externalLink}
          İlana Başvur
        </a>
      ` : `
        <div class="popup-apply-btn" style="background: #fee2e2; color: #dc2626; text-align: center; padding: 12px; margin: 16px; border-radius: 8px;">
          ${svgIcons.externalLink}
          Başvuru linki API'den yükleniyor...
        </div>
      `}
      
      <div class="popup-footer">
        <small>Powered by Adzuna API</small>
      </div>
    </div>
  `
}

/**
 * Manuel eklenen iş ilanları için popup
 */
function createManualJobPopup(item) {
  // Sadece city bilgisini göster
  const address = item.city || ''
  
  return `
    <div class="custom-popup-container manual-job-popup">
      <div class="popup-header">
        <div class="popup-title">${item.title}</div>
        <div class="popup-source manual-source">
          ${svgIcons.userPlus}
          Manuel İlan
        </div>
      </div>
      
      ${(item.salary_min && item.salary_max) ? `
        <div class="popup-salary manual-salary">
          ${svgIcons.moneyBillWave}
          ${item.currency || 'TRY'} ${item.salary_min ? Math.round(item.salary_min).toLocaleString() : '?'} - ${item.salary_max ? Math.round(item.salary_max).toLocaleString() : '?'}
        </div>
      ` : ''}
      
      <div class="popup-details">
        <div class="popup-company">
          ${svgIcons.building}
          ${item.company || 'Şirket bilgisi mevcut değil'}
        </div>
        <div class="popup-location">
          ${svgIcons.location}
          ${address}
        </div>
      </div>

      ${item.description ? `
      <div class="popup-description">
        ${item.description.substring(0, 200)}${item.description.length > 200 ? '...' : ''}
      </div>
      ` : ''}
      
      ${item.contact ? `
        <div class="popup-contact manual-contact">
          <div class="contact-label">
            ${svgIcons.envelope}
            İletişim Bilgileri
          </div>
          <div class="contact-info">${item.contact}</div>
        </div>
      ` : ''}

      ${item.url ? `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="popup-apply-btn adzuna-apply">
          ${svgIcons.externalLink}
          İlana Başvur
        </a>
      ` : `
        <div class="popup-apply-btn" style="background: #fef3c7; color: #d97706; text-align: center; padding: 12px; margin: 16px; border-radius: 8px;">
          ${svgIcons.externalLink}
          Başvuru linki API'den yükleniyor...
        </div>
      `}
      
      <div class="popup-footer">
        <small>Local Listing • Teppek</small>
      </div>
    </div>
  `
}

/**
 * CV (Aday) profilleri için popup
 */
function createCVPopup(item) {
  // Sadece city bilgisini göster
  const address = item.city || ''
  
  return `
    <div class="custom-popup-container cv-popup">
      <div class="popup-header">
        <div class="popup-title">${item.title || 'Profesyonel Profil'}</div>
        <div class="popup-source cv-source">
          ${svgIcons.user}
          Aday Profili
        </div>
      </div>
      
      <div class="popup-candidate">
        <div class="candidate-name">
          ${svgIcons.userTie}
          ${item.name || item.full_name || 'İsim belirtilmemiş'}
        </div>
      </div>
      
      ${item.salary_min && item.salary_max ? `
        <div class="popup-salary cv-salary">
          ${svgIcons.moneyBillWave}
          Expected: ${item.currency || 'TRY'} ${Math.round(item.salary_min)?.toLocaleString() || '?'} - ${Math.round(item.salary_max)?.toLocaleString() || '?'}
        </div>
      ` : ''}
      
      <div class="popup-details">
        ${item.experience_years ? `
          <div class="popup-experience">
            ${svgIcons.userTie}
            ${item.experience_years} years experience
          </div>
        ` : ''}
        <div class="popup-location">
          ${svgIcons.location}
          ${address}
        </div>
        ${item.remote ? `
          <div class="popup-remote">
            ${svgIcons.globe}
            Open to remote work
          </div>
        ` : ''}
      </div>
      
      ${item.skills ? `
        <div class="popup-skills">
          <div class="skills-label">
            ${svgIcons.user}
            Skills
          </div>
          <div class="skills-list">${item.skills.split(',').slice(0, 3).join(', ')}${item.skills.split(',').length > 3 ? '...' : ''}</div>
        </div>
      ` : ''}

      ${item.description ? `
      <div class="popup-description">
        ${item.description.substring(0, 200)}${item.description.length > 200 ? '...' : ''}
      </div>
      ` : ''}
      
      ${item.contact ? `
        <div class="popup-contact cv-contact">
          <div class="contact-label">
            ${svgIcons.envelope}
            İletişim
          </div>
          <div class="contact-info">${item.contact}</div>
        </div>
      ` : ''}

      ${item.url ? `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="popup-apply-btn adzuna-apply">
          ${svgIcons.externalLink}
          Profili Görüntüle
        </a>
      ` : ''}
      
      <div class="popup-footer">
        <small>Candidate Profile • Teppek</small>
      </div>
    </div>
  `
}

export default createModernPopup
