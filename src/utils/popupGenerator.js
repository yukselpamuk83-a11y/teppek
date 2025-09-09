// POPUP GENERATOR - Kaynak bazlı farklı popup tasarımları
import { svgIcons } from './svgIcons.js'

/**
 * Adzuna API'sinden gelen iş ilanları için popup
 */
export function createAdzunaJobPopup(item) {
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

      ${item.description?.text ? `
      <div class="popup-description">
        ${item.description.text.substring(0, 150)}...
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
export function createManualJobPopup(item) {
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

      ${item.description?.text ? `
      <div class="popup-description">
        ${item.description.text.substring(0, 150)}...
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
      
      <div class="popup-footer">
        <small>Local Listing • Teppek</small>
      </div>
    </div>
  `
}

/**
 * CV (Aday) profilleri için popup
 */
export function createCVPopup(item) {
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
          <i class="fa-solid fa-chart-line"></i>
          Expected: ${item.currency || 'TRY'} ${Math.round(item.salary_min)?.toLocaleString() || '?'} - ${Math.round(item.salary_max)?.toLocaleString() || '?'}
        </div>
      ` : ''}
      
      <div class="popup-details">
        ${item.experience_years ? `
          <div class="popup-experience">
            <i class="fa-solid fa-calendar-days"></i>
            ${item.experience_years} years experience
          </div>
        ` : ''}
        <div class="popup-location">
          ${svgIcons.location}
          ${address}
        </div>
        ${item.remote ? `
          <div class="popup-remote">
            <i class="fa-solid fa-wifi"></i>
            Open to remote work
          </div>
        ` : ''}
      </div>
      
      ${item.skills ? `
        <div class="popup-skills">
          <div class="skills-label">
            <i class="fa-solid fa-code"></i>
            Skills
          </div>
          <div class="skills-list">${item.skills.split(',').slice(0, 3).join(', ')}${item.skills.split(',').length > 3 ? '...' : ''}</div>
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
      
      <div class="popup-footer">
        <small>Candidate Profile • Teppek</small>
      </div>
    </div>
  `
}

/**
 * Gelecekteki API'ler için genişletilebilir popup factory
 */
export function createPopup(item) {
  // Enhanced Adzuna detection - multiple fallback checks
  const isAdzunaJob = item.source === 'adzuna' || 
                      item.adzuna_id || 
                      (item.url && item.url.includes('adzuna')) ||
                      (item.company && item.salary_min && item.salary_max && item.url)
  
  // Debug log for development
  if (import.meta.env.DEV) {
    console.log(`🔍 Popup type detection for "${item.title}":`, {
      source: item.source,
      adzuna_id: item.adzuna_id,
      has_url: !!item.url,
      url_contains_adzuna: item.url?.includes('adzuna'),
      has_salary: !!(item.salary_min && item.salary_max),
      isAdzunaJob,
      selectedType: isAdzunaJob ? 'Adzuna' : (item.type === 'cv' ? 'CV' : 'Manuel')
    })
  }
  
  if (isAdzunaJob) {
    return createAdzunaJobPopup(item)
  }
  
  if (item.type === 'cv') {
    return createCVPopup(item)
  }
  
  // Default: Manuel job popup
  return createManualJobPopup(item)
}

/**
 * Premium popup (mesafesi 50km'den fazla olanlar için)
 */
export function createPremiumPopup() {
  return `
    <div class="custom-popup-container premium-popup">
      <div class="popup-header premium-header">
        <div class="popup-title">Premium İçerik</div>
        <div class="popup-source premium-source">
          <i class="fa-solid fa-crown"></i>
          Premium
        </div>
      </div>
      
      <div class="premium-message">
        <i class="fa-solid fa-lock"></i>
        <p>This listing is over 50km away. Premium membership required to view details.</p>
      </div>
      
      <button class="popup-apply-btn premium-upgrade" onclick="window.handlePremiumClick?.()">
        <i class="fa-solid fa-star"></i>
        Upgrade to Premium
      </button>
      
      <div class="popup-footer">
        <small>Premium feature • Teppek</small>
      </div>
    </div>
  `
}