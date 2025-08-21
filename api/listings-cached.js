// Cache'lenmiş veri endpoint'i - Günde 1 kez güncellenir
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

// Adzuna API bilgileri
const APP_ID = 'a19dd595';
const APP_KEY = '0f8160edaa39c3dcac3962d77b32236b';

async function fetchFreshData() {
  console.log('🔄 Yeni veri çekiliyor...');
  
  try {
    // 5 farklı bölgeden veri çek
    const regions = [
      { country: 'us', location: 'New York', lat: 40.7128, lng: -74.0060, keyword: 'software developer' },
      { country: 'gb', location: 'London', lat: 51.5074, lng: -0.1278, keyword: 'engineer' },
      { country: 'de', location: 'Berlin', lat: 52.5200, lng: 13.4050, keyword: 'developer' },
      { country: 'ca', location: 'Toronto', lat: 43.6532, lng: -79.3832, keyword: 'tech' },
      { country: 'au', location: 'Sydney', lat: -33.8688, lng: 151.2093, keyword: 'IT' }
    ];
    
    const allListings = [];
    
    // Sıralı olarak her bölgeden veri çek (API limitleri için)
    for (const region of regions) {
      const url = `https://api.adzuna.com/v1/api/jobs/${region.country}/search/1?` +
        `app_id=${APP_ID}&app_key=${APP_KEY}` +
        `&results_per_page=20` +
        `&what=${encodeURIComponent(region.keyword)}` +
        `&where=${encodeURIComponent(region.location)}` +
        `&content-type=application/json`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          // Veriyi dönüştür ve eşleştir - Manuel form ile uyumlu
          const listings = data.results.map(job => ({
            // Temel alanlar (her iki tip için ortak)
            id: `adzuna-${region.country}-${job.id}`,
            type: 'job',
            title: job.title,
            company: job.company.display_name,
            description: job.description ? job.description.substring(0, 200) + '...' : 'İş detayları için tıklayın',
            
            // Konum bilgileri (ortak format)
            location: {
              lat: job.latitude || region.lat + (Math.random() - 0.5) * 0.1,
              lng: job.longitude || region.lng + (Math.random() - 0.5) * 0.1
            },
            address: job.location.display_name,
            
            // Maaş bilgileri (hem eski hem yeni format)
            salary_min: job.salary_min,
            salary_max: job.salary_max || job.salary_min * 1.2,
            salary: job.salary_min ? {
              min: job.salary_min,
              max: job.salary_max || job.salary_min * 1.2,
              currency: job.salary_currency || 'USD',
              period: 'Yıllık'
            } : null,
            
            // İletişim/Başvuru (farklılaşan alan)
            applyUrl: job.redirect_url || `https://www.adzuna.com/details/${job.id}`,
            contact: null, // API ilanlarında contact yok, applyUrl var
            
            // Ek bilgiler
            employmentType: job.contract_type || 'Tam zamanlı',
            category: job.category ? job.category.label : 'Teknoloji',
            postedDate: job.created,
            source: 'adzuna', // Kaynak belirteci
            
            // Opsiyonel alanlar
            isSponsored: false,
            isOwner: false
          }));
          
          allListings.push(...listings);
        }
      } catch (error) {
        console.error(`Bölge verisi hatası (${region.country}):`, error);
      }
      
      // API rate limit için kısa bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test verisi ekleme - KALDIRILDI
    
    // Veriyi karıştır (farklı bölgelerden ilanlar karışık görünsün)
    allListings.sort(() => Math.random() - 0.5);
    
    return {
      listings: allListings,
      lastUpdated: new Date().toISOString(),
      totalCount: allListings.length,
      sources: {
        adzuna: allListings.filter(l => l.source === 'adzuna').length,
        internal: allListings.filter(l => l.source === 'internal').length
      }
    };
    
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return generateFallbackData();
  }
}

function generateFallbackData() {
  // API tamamen çalışmadığında boş veri döndür
  return {
    listings: [],
    lastUpdated: new Date().toISOString(),
    totalCount: 0,
    sources: {
      adzuna: 0,
      internal: 0
    }
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { lat, lng, forceRefresh } = req.query;
  
  // Force refresh parametresi ile manuel güncelleme (admin için)
  if (forceRefresh === 'true' && req.headers['x-admin-key'] === 'your-secret-admin-key') {
    cachedData = await fetchFreshData();
    lastFetchTime = Date.now();
    console.log('✅ Veri manuel olarak güncellendi');
  }
  
  // Cache kontrolü - 24 saat geçmişse veya cache yoksa yenile
  const now = Date.now();
  const shouldRefresh = !cachedData || !lastFetchTime || (now - lastFetchTime > CACHE_DURATION);
  
  if (shouldRefresh) {
    cachedData = await fetchFreshData();
    lastFetchTime = now;
    console.log('✅ Cache yenilendi:', new Date().toLocaleString('tr-TR'));
  } else {
    const remainingTime = Math.round((CACHE_DURATION - (now - lastFetchTime)) / 1000 / 60);
    console.log(`📦 Cache'den veri sunuluyor. Sonraki güncelleme: ${remainingTime} dakika`);
  }
  
  // Kullanıcı konumuna göre sıralama (opsiyonel)
  let sortedListings = [...cachedData.listings];
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    
    sortedListings.sort((a, b) => {
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
  }
  
  return res.status(200).json({
    success: true,
    count: sortedListings.length,
    total: sortedListings.length,
    listings: sortedListings,
    lastUpdated: cachedData.lastUpdated,
    nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString(),
    cacheInfo: {
      fromCache: !shouldRefresh,
      remainingMinutes: Math.round((CACHE_DURATION - (now - lastFetchTime)) / 1000 / 60)
    },
    sources: cachedData.sources
  });
}