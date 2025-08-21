// Akıllı çoklu veri çekme - API limitlerine dikkat ederek
// Günlük limit: 250 API çağrısı (Adzuna free plan)
// Strateji: Cache + Çoklu şehir + Sayfalama

let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat cache (günde 1 güncelleme)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // API Anahtarları - 5 tane varsa ekleyin
  const API_KEYS = [
    { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' },
    // API KEY 2: { app_id: 'YOUR_APP_ID_2', app_key: 'YOUR_APP_KEY_2' },
    // API KEY 3: { app_id: 'YOUR_APP_ID_3', app_key: 'YOUR_APP_KEY_3' },
    // API KEY 4: { app_id: 'YOUR_APP_ID_4', app_key: 'YOUR_APP_KEY_4' },
    // API KEY 5: { app_id: 'YOUR_APP_ID_5', app_key: 'YOUR_APP_KEY_5' },
  ];

  const { lat, lng, forceRefresh } = req.query;
  
  // Cache kontrolü
  const now = Date.now();
  const shouldRefresh = !cachedData || !lastFetchTime || (now - lastFetchTime > CACHE_DURATION) || forceRefresh === 'true';
  
  if (!shouldRefresh && cachedData) {
    console.log('📦 Cache\'den sunuluyor');
    return res.status(200).json(cachedData);
  }

  try {
    console.log('🔄 Yeni veriler çekiliyor...');
    
    // Strateji: Farklı lokasyonlardan ve sayfalardan veri çek
    const locations = [
      // İngiltere
      { country: 'gb', city: 'London', lat: 51.5074, lng: -0.1278 },
      { country: 'gb', city: 'Manchester', lat: 53.4808, lng: -2.2426 },
      { country: 'gb', city: 'Birmingham', lat: 52.4862, lng: -1.8904 },
      
      // Amerika
      { country: 'us', city: 'New York', lat: 40.7128, lng: -74.0060 },
      { country: 'us', city: 'San Francisco', lat: 37.7749, lng: -122.4194 },
      { country: 'us', city: 'Seattle', lat: 47.6062, lng: -122.3321 },
      { country: 'us', city: 'Austin', lat: 30.2672, lng: -97.7431 },
      
      // Almanya
      { country: 'de', city: 'Berlin', lat: 52.5200, lng: 13.4050 },
      { country: 'de', city: 'Munich', lat: 48.1351, lng: 11.5820 },
      { country: 'de', city: 'Hamburg', lat: 53.5511, lng: 9.9937 },
      
      // Kanada
      { country: 'ca', city: 'Toronto', lat: 43.6532, lng: -79.3832 },
      { country: 'ca', city: 'Vancouver', lat: 49.2827, lng: -123.1207 },
      
      // Avustralya
      { country: 'au', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
      { country: 'au', city: 'Melbourne', lat: -37.8136, lng: 144.9631 },
      
      // Hollanda
      { country: 'nl', city: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
      
      // Fransa
      { country: 'fr', city: 'Paris', lat: 48.8566, lng: 2.3522 },
      
      // İtalya
      { country: 'it', city: 'Milan', lat: 45.4642, lng: 9.1900 },
      
      // İspanya
      { country: 'es', city: 'Madrid', lat: 40.4168, lng: -3.7038 },
      { country: 'es', city: 'Barcelona', lat: 41.3851, lng: 2.1734 },
      
      // Singapur
      { country: 'sg', city: 'Singapore', lat: 1.3521, lng: 103.8198 }
    ];
    
    // Arama terimleri çeşitliliği
    const searchTerms = [
      'developer',
      'software engineer',
      'data scientist',
      'product manager',
      'designer',
      'devops',
      'backend',
      'frontend',
      'full stack',
      'mobile developer'
    ];
    
    const allListings = [];
    let apiCallCount = 0;
    const maxApiCalls = 30; // Günlük limiti korumak için maksimum çağrı
    
    // Her lokasyon için veri çek (API limitine dikkat ederek)
    for (let i = 0; i < locations.length && apiCallCount < maxApiCalls; i++) {
      const location = locations[i];
      const apiKey = API_KEYS[i % API_KEYS.length]; // API key'leri dönüşümlü kullan
      const searchTerm = searchTerms[i % searchTerms.length];
      
      try {
        // Her lokasyon için 2 sayfa çek (toplam 40 ilan)
        for (let page = 1; page <= 2 && apiCallCount < maxApiCalls; page++) {
          const url = `https://api.adzuna.com/v1/api/jobs/${location.country}/search/${page}?` +
            `app_id=${apiKey.app_id}&app_key=${apiKey.app_key}` +
            `&results_per_page=20` +
            `&what=${encodeURIComponent(searchTerm)}` +
            `&where=${encodeURIComponent(location.city)}` +
            `&max_days_old=30` + // Son 30 günün ilanları
            `&sort_by=date` + // En yeni ilanlar
            `&content-type=application/json`;
          
          apiCallCount++;
          console.log(`📍 ${location.city} - Sayfa ${page} çekiliyor... (API çağrı: ${apiCallCount}/${maxApiCalls})`);
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              const listings = data.results.map(job => ({
                id: `adzuna-${location.country}-${job.id}`,
                type: 'job',
                title: job.title || 'İş İlanı',
                company: job.company?.display_name || 'Şirket',
                description: job.description ? 
                  job.description.replace(/<[^>]*>/g, '').substring(0, 250) + '...' : 
                  'İlan detayları için tıklayın',
                
                location: {
                  lat: job.latitude || location.lat + (Math.random() - 0.5) * 0.1,
                  lng: job.longitude || location.lng + (Math.random() - 0.5) * 0.1
                },
                address: job.location?.display_name || location.city,
                
                salary_min: job.salary_min || 0,
                salary_max: job.salary_max || job.salary_min * 1.2 || 0,
                salary: job.salary_min ? {
                  min: job.salary_min,
                  max: job.salary_max || job.salary_min * 1.2,
                  currency: 'USD',
                  period: 'Yıllık',
                  display: `$${Math.round(job.salary_min/1000)}k-${Math.round((job.salary_max || job.salary_min * 1.2)/1000)}k`
                } : null,
                
                applyUrl: job.redirect_url || `https://www.adzuna.com/details/${job.id}`,
                contact: null,
                source: 'adzuna',
                
                employmentType: job.contract_type || job.contract_time || 'Tam zamanlı',
                category: job.category?.label || 'Teknoloji',
                postedDate: job.created,
                
                // Ekstra bilgiler
                city: location.city,
                country: location.country,
                searchTerm: searchTerm,
                isRemote: job.title?.toLowerCase().includes('remote') || false,
                isSenior: job.title?.toLowerCase().includes('senior') || 
                         job.title?.toLowerCase().includes('lead') || false
              }));
              
              allListings.push(...listings);
              console.log(`✅ ${location.city}: ${listings.length} ilan eklendi`);
            }
          }
          
          // API rate limit için kısa bekleme
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`❌ ${location.city} verisi alınamadı:`, error.message);
      }
    }
    
    // Veriyi karıştır (farklı lokasyonlar karışık görünsün)
    allListings.sort(() => Math.random() - 0.5);
    
    // Kullanıcı konumuna göre en yakınları öne al (opsiyonel)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      // İlk 50 ilanı konuma göre sırala, gerisini karışık bırak
      const nearbyListings = allListings.slice(0, 50).sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(a.location.lat - userLat, 2) + 
          Math.pow(a.location.lng - userLng, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.location.lat - userLat, 2) + 
          Math.pow(b.location.lng - userLng, 2)
        );
        return distA - distB;
      });
      
      allListings.splice(0, 50, ...nearbyListings);
    }
    
    // İstatistikler
    const stats = {
      totalListings: allListings.length,
      byCountry: {},
      byCategory: {},
      withSalary: 0,
      remote: 0,
      senior: 0
    };
    
    allListings.forEach(job => {
      // Ülke bazında sayım
      stats.byCountry[job.country] = (stats.byCountry[job.country] || 0) + 1;
      
      // Kategori bazında sayım
      stats.byCategory[job.category] = (stats.byCategory[job.category] || 0) + 1;
      
      // Maaş bilgisi olanlar
      if (job.salary_min > 0) stats.withSalary++;
      
      // Remote ve Senior pozisyonlar
      if (job.isRemote) stats.remote++;
      if (job.isSenior) stats.senior++;
    });
    
    // Cache'e kaydet
    cachedData = {
      success: true,
      count: allListings.length,
      listings: allListings,
      lastUpdated: new Date().toISOString(),
      nextUpdate: new Date(now + CACHE_DURATION).toISOString(),
      cacheInfo: {
        fromCache: false,
        cacheHours: CACHE_DURATION / (1000 * 60 * 60),
        apiCallsUsed: apiCallCount,
        apiCallsLimit: maxApiCalls
      },
      stats: stats
    };
    
    lastFetchTime = now;
    
    console.log(`🎯 Toplam ${allListings.length} ilan yüklendi!`);
    console.log(`📊 İstatistikler:`, stats);
    
    return res.status(200).json(cachedData);
    
  } catch (error) {
    console.error('API hatası:', error);
    
    // Hata durumunda basit veri döndür
    return res.status(200).json({
      success: false,
      count: 0,
      listings: [],
      error: error.message,
      lastUpdated: new Date().toISOString()
    });
  }
}