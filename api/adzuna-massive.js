// BÜYÜK VERİ SİSTEMİ - 100.000+ İLAN
// Adzuna'nın TÜM ülkelerinden veri çekme
// İlk yükleme: Tüm veriler
// Günlük: Son 24 saatin ilanları

import { createClient } from '@supabase/supabase-js';

// Supabase bağlantısı (veritabanı için)
const supabaseUrl = process.env.SUPABASE_URL || 'https://rjtzvcykmqquozppdbeg.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqdHp2Y3lrbXFxdW96cHBkYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMzM0MjUsImV4cCI6MjA0MzgwOTQyNX0.3Secqgbh-eVFWNe7WuPVQWCfRYDiRr9pMgdVqGYJ1UM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Adzuna API Keys - 5 tane kullanacağız
const API_KEYS = [
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' },
  // Diğer 4 API key'inizi buraya ekleyin
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' }, // Key 2
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' }, // Key 3
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' }, // Key 4
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' }, // Key 5
];

// Adzuna'nın desteklediği TÜM ülkeler
const ADZUNA_COUNTRIES = [
  { code: 'gb', name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Edinburgh', 'Bristol', 'Cardiff', 'Belfast'] },
  { code: 'us', name: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Seattle', 'Denver', 'Boston', 'Detroit', 'Nashville', 'Portland', 'Las Vegas'] },
  { code: 'au', name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Hobart'] },
  { code: 'ca', name: 'Canada', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'] },
  { code: 'de', name: 'Germany', cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'] },
  { code: 'nl', name: 'Netherlands', cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'] },
  { code: 'fr', name: 'France', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'] },
  { code: 'at', name: 'Austria', cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'] },
  { code: 'nz', name: 'New Zealand', cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Dunedin'] },
  { code: 'za', name: 'South Africa', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'] },
  { code: 'sg', name: 'Singapore', cities: ['Singapore'] },
  { code: 'in', name: 'India', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur'] },
  { code: 'br', name: 'Brazil', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'] },
  { code: 'mx', name: 'Mexico', cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana'] },
  { code: 'it', name: 'Italy', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Venice', 'Verona'] },
  { code: 'es', name: 'Spain', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'] },
  { code: 'pl', name: 'Poland', cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk'] },
  { code: 'be', name: 'Belgium', cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège'] },
  { code: 'ch', name: 'Switzerland', cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern'] },
  { code: 'ru', name: 'Russia', cities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod'] }
];

// Veri çekme işlemi için yardımcı fonksiyon
async function fetchAdzunaData(country, city, page, apiKey, searchTerm = 'all', maxDaysOld = null) {
  try {
    let url = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/${page}?` +
      `app_id=${apiKey.app_id}&app_key=${apiKey.app_key}` +
      `&results_per_page=50` + // Maksimum sonuç
      `&where=${encodeURIComponent(city)}` +
      `&sort_by=date` +
      `&content-type=application/json`;
    
    // Son 24 saat filtresi
    if (maxDaysOld) {
      url += `&max_days_old=${maxDaysOld}`;
    }
    
    // Arama terimi
    if (searchTerm !== 'all') {
      url += `&what=${encodeURIComponent(searchTerm)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`API Hatası: ${country.code}/${city} - ${response.status}`);
      return { results: [], count: 0 };
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`Fetch hatası: ${country.code}/${city}`, error);
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
    mode = 'fetch',     // fetch: veri çek, serve: veritabanından sun
    initial = false,    // ilk yükleme mi?
    country = null,     // belirli ülke
    page = 1,          // sayfa numarası
    limit = 100        // sayfa başına limit
  } = req.query;

  try {
    // MODE: SERVE - Veritabanından veri sun
    if (mode === 'serve') {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Supabase'den veri çek
      const { data: listings, error, count } = await supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);
      
      if (error) {
        console.error('Supabase hatası:', error);
        // Supabase çalışmazsa fallback
        return res.status(200).json({
          success: false,
          error: 'Veritabanı bağlantı hatası',
          count: 0,
          listings: []
        });
      }
      
      return res.status(200).json({
        success: true,
        count: listings.length,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        listings: listings
      });
    }
    
    // MODE: FETCH - Adzuna'dan veri çek
    if (mode === 'fetch') {
      const allListings = [];
      let totalApiCalls = 0;
      const maxApiCallsPerRun = initial ? 500 : 100; // İlk yüklemede daha fazla
      
      // Hangi ülkelerden veri çekeceğiz?
      const countriesToFetch = country ? 
        ADZUNA_COUNTRIES.filter(c => c.code === country) : 
        ADZUNA_COUNTRIES;
      
      console.log(`🌍 ${countriesToFetch.length} ülkeden veri çekiliyor...`);
      
      // Her ülke ve şehir için veri çek
      for (const countryData of countriesToFetch) {
        for (const city of countryData.cities) {
          if (totalApiCalls >= maxApiCallsPerRun) break;
          
          // API key'i dönüşümlü kullan
          const apiKey = API_KEYS[totalApiCalls % API_KEYS.length];
          
          // İlk yüklemede tüm veriler, günlük güncellemede son 1 gün
          const maxDaysOld = initial ? null : 1;
          
          // Kaç sayfa çekeceğiz? (her sayfa 50 ilan)
          const maxPages = initial ? 20 : 2; // İlk yüklemede 1000 ilan/şehir
          
          for (let pageNum = 1; pageNum <= maxPages && totalApiCalls < maxApiCallsPerRun; pageNum++) {
            const data = await fetchAdzunaData(
              countryData, 
              city, 
              pageNum, 
              apiKey, 
              'all', 
              maxDaysOld
            );
            
            totalApiCalls++;
            
            if (data.results && data.results.length > 0) {
              // Veriyi dönüştür
              const listings = data.results.map(job => ({
                adzuna_id: job.id,
                title: job.title,
                company: job.company?.display_name,
                description: job.description?.substring(0, 500),
                location_city: city,
                location_country: countryData.code,
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
              
              // Veritabanına kaydet (batch insert)
              if (listings.length > 0) {
                try {
                  const { error } = await supabase
                    .from('listings')
                    .upsert(listings, { 
                      onConflict: 'adzuna_id',
                      ignoreDuplicates: true 
                    });
                  
                  if (error) {
                    console.error('Supabase insert hatası:', error);
                  } else {
                    console.log(`✅ ${city}, ${countryData.code}: ${listings.length} ilan kaydedildi`);
                  }
                } catch (dbError) {
                  console.error('DB hatası:', dbError);
                }
              }
            }
            
            // Rate limit koruması
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      // İstatistikler
      const stats = {
        totalFetched: allListings.length,
        apiCallsUsed: totalApiCalls,
        maxApiCalls: maxApiCallsPerRun,
        countries: [...new Set(allListings.map(l => l.location_country))].length,
        cities: [...new Set(allListings.map(l => l.location_city))].length
      };
      
      console.log('📊 Çekme İstatistikleri:', stats);
      
      return res.status(200).json({
        success: true,
        mode: 'fetch',
        initial: initial,
        stats: stats,
        message: initial ? 
          `İlk yükleme: ${allListings.length} ilan çekildi ve kaydedildi` :
          `Güncelleme: Son 24 saatte ${allListings.length} yeni ilan`
      });
    }
    
  } catch (error) {
    console.error('Handler hatası:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// CRON JOB için yardımcı fonksiyon
export async function dailyUpdate() {
  console.log('🔄 Günlük güncelleme başlıyor...');
  
  // Son 24 saatin ilanlarını çek
  const response = await fetch('https://teppek.com/api/adzuna-massive?mode=fetch&initial=false');
  const result = await response.json();
  
  console.log('✅ Günlük güncelleme tamamlandı:', result.stats);
  return result;
}

// İLK YÜKLEME için yardımcı fonksiyon  
export async function initialLoad() {
  console.log('🚀 İlk yükleme başlıyor (100.000+ ilan)...');
  
  // Tüm ülkelerden veri çek
  for (const country of ADZUNA_COUNTRIES) {
    console.log(`🌍 ${country.name} verisi çekiliyor...`);
    
    const response = await fetch(`https://teppek.com/api/adzuna-massive?mode=fetch&initial=true&country=${country.code}`);
    const result = await response.json();
    
    console.log(`✅ ${country.name}: ${result.stats?.totalFetched || 0} ilan`);
    
    // Her ülke arasında 5 saniye bekle (API limiti için)
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('🎉 İlk yükleme tamamlandı!');
}