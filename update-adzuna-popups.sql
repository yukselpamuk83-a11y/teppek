-- Update existing Adzuna job popups to use proper branding
UPDATE jobs 
SET popup_html = 
  '<div class="custom-popup-container adzuna-popup">' ||
  '<div class="popup-header">' ||
  '<div class="popup-title">' || title || '</div>' ||
  '<div class="popup-source">' ||
  '<i class="fa-solid fa-globe"></i>' ||
  'Adzuna' ||
  '</div>' ||
  '</div>' ||
  
  '<div class="popup-salary adzuna-salary">' ||
  '<i class="fa-solid fa-dollar-sign"></i>' ||
  COALESCE(currency, 'USD') || ' ' || 
  COALESCE(salary_min::text, '?') || ' - ' || 
  COALESCE(salary_max::text, '?') ||
  '</div>' ||
  
  '<div class="popup-details">' ||
  '<div class="popup-company">' ||
  '<i class="fa-solid fa-building"></i>' ||
  COALESCE(company, 'Şirket bilgisi mevcut değil') ||
  '</div>' ||
  '<div class="popup-location">' ||
  '<i class="fa-solid fa-location-dot"></i>' ||
  COALESCE(city, '') || CASE WHEN city IS NOT NULL THEN ', ' ELSE '' END || COALESCE(country, '') ||
  '</div>' ||
  '</div>' ||
  
  '<a href="' || url || '" target="_blank" rel="noopener noreferrer" class="popup-apply-btn adzuna-apply">' ||
  '<i class="fa-solid fa-external-link"></i>' ||
  'İlana Başvur' ||
  '</a>' ||
  
  '<div class="popup-footer">' ||
  '<small>Powered by Adzuna API</small>' ||
  '</div>' ||
  '</div>',
  
  updated_at = NOW()
  
WHERE source = 'adzuna';