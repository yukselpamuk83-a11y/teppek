// CV Popup Generator Utilities
// Generates HTML content for CV markers on the map

// Timeline type configurations
export const TIMELINE_COLORS = {
  education: '#8B5CF6',      // Purple
  internship: '#06B6D4',     // Light Blue  
  military: '#F59E0B',       // Orange
  work: '#3B82F6',           // Blue
  gap: '#6B7280',            // Gray
  current_work: '#10B981'    // Green
}

export const TIMELINE_ICONS = {
  education: 'fa-graduation-cap',
  internship: 'fa-laptop-code',
  military: 'fa-shield-halved',
  work: 'fa-briefcase',
  gap: 'fa-pause',
  current_work: 'fa-play'
}

export const TIMELINE_LABELS = {
  education: 'Eğitim',
  internship: 'Staj',
  military: 'Askerlik',
  work: 'İş Deneyimi',
  gap: 'Ara',
  current_work: 'Mevcut İş'
}

// Generate CV popup HTML
export function createCVPopup(cvData) {
  const {
    full_name,
    title,
    city,
    country,
    experience_years,
    skills = [],
    remote_available,
    salary_expectation_min,
    salary_expectation_max,
    currency,
    timeline_data = [],
    contact,
    profile_photo_url
  } = cvData

  // Calculate timeline summary
  const timelineSummary = generateTimelineSummary(timeline_data)
  const displaySkills = skills.slice(0, 5) // Show max 5 skills
  const hasMoreSkills = skills.length > 5

  // Format salary expectation
  const salaryText = formatSalaryExpectation(salary_expectation_min, salary_expectation_max, currency)

  // Generate skills HTML
  const skillsHTML = displaySkills.length > 0 ? `
    <div class="cv-popup-skills">
      <i class="fa-solid fa-code text-gray-500 mr-2"></i>
      <div class="skills-list">
        ${displaySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        ${hasMoreSkills ? `<span class="skill-more">+${skills.length - 5} daha</span>` : ''}
      </div>
    </div>
  ` : ''

  // Generate profile photo HTML
  const photoHTML = profile_photo_url ? `
    <div class="cv-popup-photo">
      <img src="${profile_photo_url}" alt="${full_name}" class="cv-profile-image" />
    </div>
  ` : `
    <div class="cv-popup-photo-placeholder">
      <i class="fa-solid fa-user"></i>
    </div>
  `

  return `
    <div class="custom-popup-container cv-popup">
      <div class="cv-popup-header">
        ${photoHTML}
        <div class="cv-popup-header-content">
          <div class="cv-popup-name">${full_name}</div>
          <div class="cv-popup-title">${title}</div>
          <div class="cv-popup-location">
            <i class="fa-solid fa-location-dot"></i>
            ${city}${country ? `, ${country}` : ''}
            ${remote_available ? '<span class="remote-badge">Remote OK</span>' : ''}
          </div>
        </div>
      </div>

      <div class="cv-popup-content">
        <div class="cv-popup-stats">
          <div class="cv-stat-item">
            <i class="fa-solid fa-clock text-blue-500"></i>
            <span>${experience_years} yıl deneyim</span>
          </div>
          <div class="cv-stat-item">
            <i class="fa-solid fa-list-check text-green-500"></i>
            <span>${timeline_data.length} dönem</span>
          </div>
          ${salaryText ? `
            <div class="cv-stat-item">
              <i class="fa-solid fa-money-bill-wave text-yellow-500"></i>
              <span>${salaryText}</span>
            </div>
          ` : ''}
        </div>

        ${skillsHTML}

        ${timelineSummary.length > 0 ? `
          <div class="cv-popup-timeline-preview">
            <div class="timeline-preview-header">
              <i class="fa-solid fa-timeline text-purple-500 mr-2"></i>
              <span>Son Dönemler</span>
            </div>
            <div class="timeline-preview-items">
              ${timelineSummary.map(item => `
                <div class="timeline-preview-item">
                  <div class="timeline-preview-dot" style="background-color: ${item.color}"></div>
                  <div class="timeline-preview-content">
                    <div class="timeline-preview-title">${item.title}</div>
                    <div class="timeline-preview-org">${item.organization}</div>
                    <div class="timeline-preview-date">${item.period}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="cv-popup-actions">
        <button 
          onclick="window.openCVTimeline('${cvData.id}')" 
          class="cv-timeline-btn"
        >
          <i class="fa-solid fa-timeline"></i>
          Timeline Görüntüle
        </button>
        ${contact ? `
          <button 
            onclick="window.contactCV('${contact}')" 
            class="cv-contact-btn"
          >
            <i class="fa-solid fa-envelope"></i>
            İletişim
          </button>
        ` : ''}
      </div>

      <div class="cv-popup-footer">
        <div class="cv-popup-source">
          <i class="fa-solid fa-user-tie"></i>
          CV Profili
        </div>
      </div>
    </div>
  `
}

// Generate timeline summary (last 3-4 items)
function generateTimelineSummary(timeline_data) {
  if (!timeline_data || timeline_data.length === 0) return []

  // Sort by start_date descending and take first 3
  const sortedTimeline = [...timeline_data]
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
    .slice(0, 3)

  return sortedTimeline.map(item => {
    const startYear = new Date(item.start_date).getFullYear()
    const endYear = item.end_date ? new Date(item.end_date).getFullYear() : 'Devam'
    const period = startYear === endYear ? startYear : `${startYear} - ${endYear}`

    return {
      title: item.title,
      organization: item.organization,
      period,
      color: item.color || TIMELINE_COLORS[item.type] || '#6B7280',
      type: item.type
    }
  })
}

// Format salary expectation
function formatSalaryExpectation(min, max, currency = 'TRY') {
  if (!min && !max) return null
  
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
  }

  if (min && max) {
    return `${formatNumber(min)} - ${formatNumber(max)} ${currency}`
  } else if (min) {
    return `${formatNumber(min)}+ ${currency}`
  } else if (max) {
    return `Max ${formatNumber(max)} ${currency}`
  }
  return null
}

// Generate minimal CV popup for cluster mode
export function createCVPopupMinimal(cvData) {
  const { full_name, title, city, timeline_data = [] } = cvData
  
  return `
    <div class="custom-popup-container cv-popup-minimal">
      <div class="cv-popup-minimal-header">
        <i class="fa-solid fa-user-tie cv-icon"></i>
        <div class="cv-minimal-content">
          <div class="cv-minimal-name">${full_name}</div>
          <div class="cv-minimal-title">${title}</div>
          <div class="cv-minimal-location">${city}</div>
        </div>
      </div>
      <button onclick="window.openCVTimeline('${cvData.id}')" class="cv-minimal-timeline-btn">
        <i class="fa-solid fa-timeline"></i>
        Timeline
      </button>
    </div>
  `
}

// Create premium CV popup (for unauthenticated users)
export function createCVPremiumPopup() {
  return `
    <div class="custom-popup-container cv-premium-popup">
      <div class="premium-popup-header">
        <i class="fa-solid fa-crown premium-icon"></i>
        <div class="premium-content">
          <div class="premium-title">Premium İçerik</div>
          <div class="premium-subtitle">CV detaylarını görmek için üye olun</div>
        </div>
      </div>
      
      <div class="premium-popup-content">
        <div class="premium-features">
          <div class="premium-feature">
            <i class="fa-solid fa-timeline text-purple-500"></i>
            <span>Detaylı timeline</span>
          </div>
          <div class="premium-feature">
            <i class="fa-solid fa-envelope text-blue-500"></i>
            <span>İletişim bilgileri</span>
          </div>
          <div class="premium-feature">
            <i class="fa-solid fa-download text-green-500"></i>
            <span>CV indirme</span>
          </div>
        </div>
      </div>

      <div class="premium-popup-actions">
        <button onclick="window.handlePremiumClick()" class="premium-subscribe-btn">
          <i class="fa-solid fa-star"></i>
          Premium'a Geçin
        </button>
      </div>
    </div>
  `
}

// CV popup CSS styles
export const CV_POPUP_STYLES = `
<style>
.cv-popup {
  width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cv-popup-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.cv-popup-photo {
  flex-shrink: 0;
}

.cv-profile-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.cv-popup-photo-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 20px;
}

.cv-popup-header-content {
  flex: 1;
}

.cv-popup-name {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
  margin-bottom: 4px;
}

.cv-popup-title {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
}

.cv-popup-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
}

.remote-badge {
  background-color: #dcfce7;
  color: #166534;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 8px;
}

.cv-popup-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.cv-stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.cv-popup-skills {
  margin-bottom: 16px;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.skill-tag {
  background-color: #f3f4f6;
  color: #374151;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.skill-more {
  color: #9ca3af;
  font-size: 11px;
  padding: 2px 4px;
}

.cv-popup-timeline-preview {
  margin-bottom: 16px;
}

.timeline-preview-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.timeline-preview-items {
  space-y: 8px;
}

.timeline-preview-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.timeline-preview-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-preview-title {
  font-size: 12px;
  font-weight: 500;
  color: #111827;
}

.timeline-preview-org {
  font-size: 11px;
  color: #6b7280;
}

.timeline-preview-date {
  font-size: 10px;
  color: #9ca3af;
}

.cv-popup-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.cv-timeline-btn {
  flex: 1;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.cv-timeline-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.cv-contact-btn {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.cv-contact-btn:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.cv-popup-footer {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.cv-popup-source {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: #9ca3af;
}

/* Minimal CV popup styles */
.cv-popup-minimal {
  width: 260px;
}

.cv-popup-minimal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.cv-icon {
  color: #10b981;
  font-size: 24px;
}

.cv-minimal-name {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

.cv-minimal-title {
  font-size: 12px;
  color: #6b7280;
}

.cv-minimal-location {
  font-size: 11px;
  color: #9ca3af;
}

.cv-minimal-timeline-btn {
  width: 100%;
  background-color: #10b981;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Premium popup styles */
.cv-premium-popup {
  width: 280px;
}

.premium-popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.premium-icon {
  color: #f59e0b;
  font-size: 24px;
}

.premium-title {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}

.premium-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.premium-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.premium-feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
}

.premium-subscribe-btn {
  width: 100%;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
`