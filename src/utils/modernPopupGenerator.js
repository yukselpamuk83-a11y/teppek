/**
 * 🚀 CLASSIC POPUP GENERATOR - Original Design with Complete Data
 * - Classic popup design with enhanced data fetching
 * - Complete job information with hybrid bucket/API data
 * - Original styling maintained for consistency
 */
import { svgIcons } from './svgIcons.js'

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
      
      ${item.salary_min && item.salary_max ? `
        <div class="popup-salary adzuna-salary">
          ${svgIcons.dollar}
          ${item.currency || 'USD'} ${Math.round(item.salary_min)?.toLocaleString() || '?'} - ${Math.round(item.salary_max)?.toLocaleString() || '?'}
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
      ` : ''}
      
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
      
      ${item.salary_min && item.salary_max ? `
        <div class="popup-salary manual-salary">
          ${svgIcons.moneyBillWave}
          ${item.currency || 'TRY'} ${Math.round(item.salary_min)?.toLocaleString() || '?'} - ${Math.round(item.salary_max)?.toLocaleString() || '?'}
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
      ` : ''}
      
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
