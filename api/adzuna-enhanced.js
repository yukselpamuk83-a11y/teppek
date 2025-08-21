// Geliştirilmiş Adzuna API - Tüm özellikleri kullanıyor
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const APP_ID = 'a19dd595';
  const APP_KEY = '0f8160edaa39c3dcac3962d77b32236b';
  
  const { 
    lat, 
    lng, 
    page = 1,
    what = 'developer engineer software IT tech', // Varsayılan arama terimleri
    where = '',
    distance = 25, // km cinsinden
    category = '', // IT Jobs, Engineering Jobs, etc.
    salary_min = '',
    salary_max = '',
    max_days_old = 30, // Son 30 günün ilanları
    full_time = '',
    part_time = '',
    contract = '',
    permanent = '',
    company = '',
    sort_by = 'date', // date, salary, relevance
    results_per_page = 50 // Max 50
  } = req.query;
  
  try {
    // Desteklenen ülkeler ve şehirler
    const locations = [
      { country: 'us', city: 'New York', lat: 40.7128, lng: -74.0060 },
      { country: 'gb', city: 'London', lat: 51.5074, lng: -0.1278 },
      { country: 'de', city: 'Berlin', lat: 52.5200, lng: 13.4050 },
      { country: 'fr', city: 'Paris', lat: 48.8566, lng: 2.3522 },
      { country: 'ca', city: 'Toronto', lat: 43.6532, lng: -79.3832 },
      { country: 'au', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
      { country: 'nl', city: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
      { country: 'at', city: 'Vienna', lat: 48.2082, lng: 16.3738 },
      { country: 'ch', city: 'Zurich', lat: 47.3769, lng: 8.5417 },
      { country: 'sg', city: 'Singapore', lat: 1.3521, lng: 103.8198 },
      { country: 'br', city: 'São Paulo', lat: -23.5505, lng: -46.6333 },
      { country: 'in', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { country: 'mx', city: 'Mexico City', lat: 19.4326, lng: -99.1332 },
      { country: 'pl', city: 'Warsaw', lat: 52.2297, lng: 21.0122 },
      { country: 'it', city: 'Milan', lat: 45.4642, lng: 9.1900 }
    ];
    
    // En yakın lokasyonu bul
    let targetLocation = locations[0];
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      targetLocation = locations.reduce((nearest, loc) => {
        const currentDist = Math.sqrt(
          Math.pow(loc.lat - userLat, 2) + Math.pow(loc.lng - userLng, 2)
        );
        const nearestDist = Math.sqrt(
          Math.pow(nearest.lat - userLat, 2) + Math.pow(nearest.lng - userLng, 2)
        );
        return currentDist < nearestDist ? loc : nearest;
      }, locations[0]);
    }
    
    // Dinamik API URL oluştur
    let apiUrl = `https://api.adzuna.com/v1/api/jobs/${targetLocation.country}/search/${page}?`;
    apiUrl += `app_id=${APP_ID}&app_key=${APP_KEY}`;
    apiUrl += `&results_per_page=${Math.min(results_per_page, 50)}`;
    apiUrl += `&what=${encodeURIComponent(what)}`;
    apiUrl += `&where=${encodeURIComponent(where || targetLocation.city)}`;
    apiUrl += `&distance=${distance}`;
    apiUrl += `&max_days_old=${max_days_old}`;
    apiUrl += `&sort_by=${sort_by}`;
    apiUrl += `&content-type=application/json`;
    
    // Opsiyonel filtreler
    if (salary_min) apiUrl += `&salary_min=${salary_min}`;
    if (salary_max) apiUrl += `&salary_max=${salary_max}`;
    if (category) apiUrl += `&category=${encodeURIComponent(category)}`;
    if (full_time === '1') apiUrl += `&full_time=1`;
    if (part_time === '1') apiUrl += `&part_time=1`;
    if (contract === '1') apiUrl += `&contract=1`;
    if (permanent === '1') apiUrl += `&permanent=1`;
    if (company) apiUrl += `&company=${encodeURIComponent(company)}`;
    
    console.log('Adzuna API çağrısı:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Adzuna API hatası: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Gelen veriyi zenginleştir
    const listings = data.results.map((job) => ({
      // Temel bilgiler
      id: `adzuna-${job.id}`,
      type: 'job',
      title: job.title || 'İş İlanı',
      
      // Şirket bilgileri
      company: job.company?.display_name || 'Şirket Bilgisi Yok',
      company_canonical: job.company?.canonical_name,
      
      // Konum bilgileri - Detaylı
      location: {
        lat: job.latitude || targetLocation.lat + (Math.random() - 0.5) * 0.1,
        lng: job.longitude || targetLocation.lng + (Math.random() - 0.5) * 0.1,
        address: job.location?.display_name || targetLocation.city,
        area: job.location?.area || [targetLocation.country.toUpperCase(), targetLocation.city],
        city: job.location?.area?.[job.location.area.length - 1] || targetLocation.city,
        country: targetLocation.country.toUpperCase()
      },
      
      // İlan detayları
      description: job.description ? 
        job.description.replace(/<[^>]*>/g, '').substring(0, 300) + '...' : 
        'İlan detayları için tıklayın',
      
      // Maaş bilgileri - Detaylı
      salary: {
        min: job.salary_min || null,
        max: job.salary_max || job.salary_min * 1.2 || null,
        currency: 'USD', // API'den gelmiyor, varsayılan
        period: 'Yıllık',
        is_predicted: job.salary_is_predicted || false,
        display: job.salary_min ? 
          `$${(job.salary_min/1000).toFixed(0)}k - $${((job.salary_max || job.salary_min * 1.2)/1000).toFixed(0)}k` : 
          'Belirtilmemiş'
      },
      
      // Çalışma koşulları
      employmentType: job.contract_type || 'Belirtilmemiş',
      contractTime: job.contract_time || 'Tam zamanlı',
      
      // Kategori
      category: job.category ? {
        tag: job.category.tag,
        label: job.category.label
      } : { tag: 'tech-jobs', label: 'Teknoloji' },
      
      // Tarihler
      created: job.created,
      postedDate: job.created,
      daysAgo: Math.floor((Date.now() - new Date(job.created).getTime()) / (1000 * 60 * 60 * 24)),
      
      // Başvuru linki - ZORUNLU
      applyUrl: job.redirect_url || `https://www.adzuna.com/details/${job.id}`,
      
      // Kaynak
      source: 'adzuna',
      
      // Ek bilgiler
      adref: job.adref,
      
      // Özel alanlar
      isRemote: job.title?.toLowerCase().includes('remote') || 
                job.description?.toLowerCase().includes('remote') || false,
      
      isSenior: job.title?.toLowerCase().includes('senior') || 
                job.title?.toLowerCase().includes('lead') || false,
                
      isUrgent: job.title?.toLowerCase().includes('urgent') || 
                job.title?.toLowerCase().includes('immediate') || false
    }));
    
    // Sonuç istatistikleri
    const stats = {
      totalResults: data.count || 0,
      currentPage: parseInt(page),
      totalPages: Math.ceil((data.count || 0) / results_per_page),
      resultsPerPage: listings.length,
      searchLocation: targetLocation.city,
      searchCountry: targetLocation.country,
      filters: {
        keywords: what,
        location: where || targetLocation.city,
        distance: distance + ' km',
        daysOld: max_days_old,
        salary: salary_min || salary_max ? `${salary_min || '0'} - ${salary_max || 'max'}` : 'Tümü'
      }
    };
    
    return res.status(200).json({
      success: true,
      count: listings.length,
      total: data.count || listings.length,
      page: parseInt(page),
      listings: listings,
      stats: stats,
      mean: data.mean, // Ortalama maaş (eğer varsa)
      apiVersion: '1.0'
    });
    
  } catch (error) {
    console.error('Adzuna API hatası:', error);
    
    return res.status(200).json({
      success: false,
      count: 0,
      total: 0,
      page: 1,
      listings: [],
      error: error.message,
      apiVersion: '1.0'
    });
  }
}