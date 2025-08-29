// POPUP GENERATOR - Kaynak bazlı farklı popup tasarımları

/**
 * Adzuna API'sinden gelen iş ilanları için popup
 */
export function createAdzunaJobPopup(item) {
  const address = `${item.city || ''}, ${item.country || ''}`.replace(/^,\s*|,\s*$/g, '')
  
  return `
    <div class="custom-popup-container adzuna-popup">
      <div class="popup-header">
        <div class="popup-title">${item.title}</div>
        <div class="popup-source">
          <i class="fa-solid fa-globe"></i>
          Adzuna
        </div>
      </div>
      
      ${item.salary_min && item.salary_max ? `
        <div class="popup-salary adzuna-salary">
          <i class="fa-solid fa-dollar-sign"></i>
          ${item.currency || 'USD'} ${Math.round(item.salary_min)?.toLocaleString() || '?'} - ${Math.round(item.salary_max)?.toLocaleString() || '?'}
        </div>
      ` : ''}
      
      <div class="popup-details">
        <div class="popup-company">
          <i class="fa-solid fa-building"></i>
          ${item.company || 'Şirket bilgisi mevcut değil'}
        </div>
        <div class="popup-location">
          <i class="fa-solid fa-location-dot"></i>
          ${address}
        </div>
      </div>
      
      ${item.url ? `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="popup-apply-btn adzuna-apply">
          <i class="fa-solid fa-external-link"></i>
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
  const address = `${item.city || ''}, ${item.country || ''}`.replace(/^,\s*|,\s*$/g, '')
  
  return `
    <div class="custom-popup-container manual-job-popup">
      <div class="popup-header">
        <div class="popup-title">${item.title}</div>
        <div class="popup-source manual-source">
          <i class="fa-solid fa-user-plus"></i>
          Manuel İlan
        </div>
      </div>
      
      ${item.salary_min && item.salary_max ? `
        <div class="popup-salary manual-salary">
          <i class="fa-solid fa-money-bill-wave"></i>
          ${item.currency || 'TRY'} ${Math.round(item.salary_min)?.toLocaleString() || '?'} - ${Math.round(item.salary_max)?.toLocaleString() || '?'}
        </div>
      ` : ''}
      
      <div class="popup-details">
        <div class="popup-company">
          <i class="fa-solid fa-building"></i>
          ${item.company || 'Şirket bilgisi mevcut değil'}
        </div>
        <div class="popup-location">
          <i class="fa-solid fa-location-dot"></i>
          ${address}
        </div>
      </div>
      
      ${item.contact ? `
        <div class="popup-contact manual-contact">
          <div class="contact-label">
            <i class="fa-solid fa-envelope"></i>
            İletişim Bilgileri
          </div>
          <div class="contact-info">${item.contact}</div>
        </div>
      ` : ''}
      
      <div class="popup-footer">
        <small>Yerel İlan • Teppek</small>
      </div>
    </div>
  `
}

/**
 * CV (Aday) profilleri için popup
 */
export function createCVPopup(item) {
  const address = `${item.city || ''}, ${item.country || ''}`.replace(/^,\s*|,\s*$/g, '')
  
  return `
    <div class="custom-popup-container cv-popup">
      <div class="popup-header">
        <div class="popup-title">${item.title || 'Profesyonel Profil'}</div>
        <div class="popup-source cv-source">
          <i class="fa-solid fa-user"></i>
          Aday Profili
        </div>
      </div>
      
      <div class="popup-candidate">
        <div class="candidate-name">
          <i class="fa-solid fa-user-tie"></i>
          ${item.name || item.full_name || 'İsim belirtilmemiş'}
        </div>
      </div>
      
      ${item.salary_min && item.salary_max ? `
        <div class="popup-salary cv-salary">
          <i class="fa-solid fa-chart-line"></i>
          Beklenti: ${item.currency || 'TRY'} ${Math.round(item.salary_min)?.toLocaleString() || '?'} - ${Math.round(item.salary_max)?.toLocaleString() || '?'}
        </div>
      ` : ''}
      
      <div class="popup-details">
        ${item.experience_years ? `
          <div class="popup-experience">
            <i class="fa-solid fa-calendar-days"></i>
            ${item.experience_years} yıl deneyim
          </div>
        ` : ''}
        <div class="popup-location">
          <i class="fa-solid fa-location-dot"></i>
          ${address}
        </div>
        ${item.remote ? `
          <div class="popup-remote">
            <i class="fa-solid fa-wifi"></i>
            Uzaktan çalışmaya açık
          </div>
        ` : ''}
      </div>
      
      ${item.skills ? `
        <div class="popup-skills">
          <div class="skills-label">
            <i class="fa-solid fa-code"></i>
            Yetenekler
          </div>
          <div class="skills-list">${item.skills.split(',').slice(0, 3).join(', ')}${item.skills.split(',').length > 3 ? '...' : ''}</div>
        </div>
      ` : ''}
      
      ${item.contact ? `
        <div class="popup-contact cv-contact">
          <div class="contact-label">
            <i class="fa-solid fa-envelope"></i>
            İletişim
          </div>
          <div class="contact-info">${item.contact}</div>
        </div>
      ` : ''}
      
      <div class="popup-footer">
        <small>Aday Profili • Teppek</small>
      </div>
    </div>
  `
}

/**
 * Gelecekteki API'ler için genişletilebilir popup factory
 */
export function createPopup(item) {
  // Force console log ve alert ile debug
  console.error('🔥 POPUP DEBUG - Full Item Object:', JSON.stringify(item, null, 2))
  
  // Alert ile de göster (geliştirme için)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    alert(`DEBUG: source="${item.source}", type="${item.type}", title="${item.title}"`)
  }
  
  // Her zaman Adzuna popup göster test için
  if (item.source === 'adzuna' || item.adzuna_id) {
    console.error('🟢 ADZUNA POPUP SELECTED for:', item.title)
    return createAdzunaJobPopup(item)
  }
  
  // Manuel popup
  console.error('🔴 MANUAL POPUP SELECTED for:', item.title, 'source:', item.source)
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
        <p>Bu ilan 50km'den uzakta. Detayları görmek için premium üyelik gerekli.</p>
      </div>
      
      <button class="popup-apply-btn premium-upgrade" onclick="window.handlePremiumClick?.()">
        <i class="fa-solid fa-star"></i>
        Premium'a Geç
      </button>
      
      <div class="popup-footer">
        <small>Premium özellik • Teppek</small>
      </div>
    </div>
  `
}