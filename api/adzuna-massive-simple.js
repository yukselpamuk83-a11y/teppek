// Basitleştirilmiş massive API - Supabase olmadan sadece Adzuna'dan veri çekme

// Adzuna API Keys - 5 farklı key
const API_KEYS = [
  { app_id: 'a19dd595', app_key: '0ca6f72f3a5cafae1643cfae18100181' }, // Key 1
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' }, // Key 2
  { app_id: 'a19dd595', app_key: '1a2a55f9ad16c54c2b2e8efa67151f39' }, // Key 3
  { app_id: 'a19dd595', app_key: '739d1471fef22292b75f15b401556bdb' }, // Key 4
  { app_id: 'a19dd595', app_key: 'b7e0a6d929446aa1b9610dc3f8d22dd8' }, // Key 5
];

// Adzuna'nın desteklediği bazı ülkeler
const ADZUNA_COUNTRIES = [
  { code: 'gb', name: 'United Kingdom' },
  { code: 'us', name: 'United States' },
  { code: 'au', name: 'Australia' },
  { code: 'ca', name: 'Canada' },
  { code: 'de', name: 'Germany' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'fr', name: 'France' },
  { code: 'at', name: 'Austria' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'za', name: 'South Africa' }
];

// Veri çekme işlemi için yardımcı fonksiyon
async function fetchAdzunaData(country, page, apiKey, maxDaysOld = 7) {
  try {
    // Ülke genelinden veri çek (şehir belirtmeden)
    let url = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/${page}?` +
      `app_id=${apiKey.app_id}&app_key=${apiKey.app_key}` +
      `&results_per_page=50` + // Maksimum sonuç
      `&sort_by=date` + // En yeni ilanlar önce
      `&max_days_old=${maxDaysOld}` + // Son 7 günün ilanları
      `&content-type=application/json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`API Hatası: ${country.code} - ${response.status}`);
      return { results: [], count: 0 };
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`Fetch hatası: ${country.code}`, error);
    return { results: [], count: 0 };
  }
}

// Ana handler fonksiyonu
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { 
    country = 'gb',     // varsayılan ülke
    page = 1,          // sayfa numarası
    limit = 100        // sayfa başına limit
  } = req.query;

  try {
    const allListings = [];
    
    // Seçili ülkeyi bul
    const selectedCountry = ADZUNA_COUNTRIES.find(c => c.code === country) || ADZUNA_COUNTRIES[0];
    
    console.log(`🌍 ${selectedCountry.name} ülkesinden veri çekiliyor...`);
    
    // API key'i seç
    const apiKey = API_KEYS[0]; // İlk key'i kullan
    
    // Veri çek
    const data = await fetchAdzunaData(
      selectedCountry, 
      parseInt(page), 
      apiKey, 
      7 // Son 7 gün
    );
    
    if (data.results && data.results.length > 0) {
      // Veriyi dönüştür
      const listings = data.results.map(job => ({
        adzuna_id: job.id,
        title: job.title,
        company: job.company?.display_name,
        description: job.description?.substring(0, 500),
        location_city: job.location?.area?.[job.location.area.length - 1] || job.location?.display_name || selectedCountry.name,
        location_country: selectedCountry.code,
        location_lat: job.latitude,
        location_lng: job.longitude,
        location_address: job.location?.display_name,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: 'USD',
        salary_is_predicted: job.salary_is_predicted,
        employment_type: job.contract_type,
        contract_time: job.contract_time,
        category: job.category?.label,
        apply_url: job.redirect_url,
        created_at: job.created,
        source: 'adzuna'
      }));
      
      allListings.push(...listings);
    }
    
    // İstatistikler
    const stats = {
      totalFetched: allListings.length,
      country: selectedCountry.name,
      page: parseInt(page),
      totalResults: data.count || 0
    };
    
    console.log('📊 Çekme İstatistikleri:', stats);
    
    return res.status(200).json({
      success: true,
      stats: stats,
      listings: allListings,
      message: `${selectedCountry.name} ülkesinden ${allListings.length} ilan çekildi`
    });
    
  } catch (error) {
    console.error('Handler hatası:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}