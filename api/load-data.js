// LOAD DATA API - Adzuna'dan veri çekip PostgreSQL'e kaydet
const { Pool } = require('pg');

// Adzuna API anahtarları
function getAdzunaKeys() {
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const app_id = process.env[`ADZUNA_APP_ID_${i}`];
    const app_key = process.env[`ADZUNA_APP_KEY_${i}`];
    if (app_id && app_key) {
      keys.push({ app_id, app_key });
    }
  }
  
  // Eğer environment'da yoksa, sabit kodlu anahtarları kullan
  if (keys.length === 0) {
    keys.push(
      { app_id: 'a19dd595', app_key: '0ca6f72f3a5cafae1643cfae18100181' },
      { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' },
      { app_id: 'a19dd595', app_key: '1a2a55f9ad16c54c2b2e8efa67151f39' },
      { app_id: 'a19dd595', app_key: '739d1471fef22292b75f15b401556bdb' },
      { app_id: 'a19dd595', app_key: 'b7e0a6d929446aa1b9610dc3f8d22dd8' }
    );
  }
  
  return keys;
}

// 20 ülke - Adzuna destekli ülkeler
const COUNTRIES = [
  'gb', 'us', 'de', 'fr', 'ca', 'au', 'nl', 'it', 'es', 'sg', 
  'at', 'be', 'br', 'ch', 'in', 'mx', 'nz', 'pl', 'ru', 'za'
];

// API'dan veri çek - Sadece maaşlı ilanlar
async function fetchFromAdzuna(country, page, apiKey, maxDays = 7) {
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?` +
    `app_id=${apiKey.app_id}&app_key=${apiKey.app_key}` +
    `&results_per_page=50&sort_by=date&max_days_old=${maxDays}` +
    `&salary_min=20000&salary_max=999999` + // Sadece gerçek maaşlı ilanlar
    `&what_exclude=internship%20volunteer%20unpaid%20commission%20freelance` + // maaşsızları filtrele
    `&content-type=application/json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// API database insertion - Form alanlarına uygun + maaş zorunlu
async function saveToDatabase(client, job, country) {
  // Form gereksinimlerine uygun kontrol
  if (!job.id || !job.title || !job.redirect_url) {
    return false;
  }
  
  // Harita için lokasyon mutlaka gerekli
  if (!job.latitude || !job.longitude) {
    return false;
  }
  
  // MAAŞ BİLGİSİ ZORUNLU - Form uyumlu
  if (!job.salary_min || !job.salary_max) {
    return false;
  }
  
  // Kalite kontrolü
  if (job.title.length < 5 || 
      job.title.toLowerCase().includes('earn money') ||
      job.title.toLowerCase().includes('work from home $')) {
    return false;
  }
  
  const query = `
    INSERT INTO jobs (
      adzuna_id, title, company, country, city, 
      lat, lon, url, salary_min, salary_max, currency, remote, source
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    ) ON CONFLICT (adzuna_id) DO UPDATE SET
      title = EXCLUDED.title,
      company = EXCLUDED.company,
      salary_min = EXCLUDED.salary_min,
      salary_max = EXCLUDED.salary_max
    RETURNING id;
  `;
  
  // Şehir bilgisini çıkar (display_name'den veya area'dan)
  let city = null;
  if (job.location?.display_name) {
    city = job.location.display_name.split(',')[0].trim();
  } else if (Array.isArray(job.location?.area) && job.location.area.length > 0) {
    city = job.location.area[job.location.area.length - 1];
  }
  
  // Remote iş tespiti (title'da kontrol yeter)
  const isRemote = job.title.toLowerCase().includes('remote') || 
                   job.title.toLowerCase().includes('work from home');
  
  // Minimal values array - sadece gerekli alanlar  
  const values = [
    job.id.toString(),                                    // Adzuna ID
    job.title.substring(0, 200).trim(),                  // Title (kısaltıldı)
    job.company?.display_name?.substring(0, 100) || null, // Company (kısaltıldı)
    country.toUpperCase(),                               // Country code
    city?.substring(0, 50) || null,                     // City (kısaltıldı)
    parseFloat(job.latitude),                           // Lat
    parseFloat(job.longitude),                          // Lon  
    job.redirect_url,                                   // Apply URL
    Math.round(job.salary_min),                         // Min salary
    Math.round(job.salary_max),                         // Max salary
    job.salary_currency?.substring(0, 3) || 'USD',      // Currency
    isRemote,                                           // Remote flag
    'adzuna'                                            // Source
  ];
  
  try {
    const result = await client.query(query, values);
    return result.rowCount > 0;
  } catch (error) {
    if (error.code === '23505') return false; // Duplicate
    if (error.code === '22003') return false; // Value out of range
    console.error(`DB error for job ${job.id}:`, error.message);
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const {
    countries = 'gb,us,de,fr,ca,au,nl,it,es,sg,at,be,br,ch,in,mx,nz,pl,ru,za',  // Tüm 20 ülke
    days = '7',        // Son 7 gün
    pages = '10'       // Ülke başına 10 sayfa (500 ilan)
  } = req.query;

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_URL environment variable not configured'
    });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const maxDays = parseInt(days);
  const maxPages = parseInt(pages);
  const countryList = countries.split(',').map(c => c.trim().toLowerCase());
  const apiKeys = getAdzunaKeys();
  
  const summary = {
    started_at: new Date().toISOString(),
    countries: countryList,
    total_inserted: 0,
    by_country: {},
    api_calls: 0,
    errors: []
  };

  let client;
  try {
    client = await pool.connect();
    let keyIndex = 0;

    for (const country of countryList) {
      if (!COUNTRIES.includes(country)) {
        summary.errors.push(`Unsupported country: ${country}`);
        continue;
      }

      let countryInserted = 0;
      
      for (let page = 1; page <= maxPages; page++) {
        try {
          const apiKey = apiKeys[keyIndex % apiKeys.length];
          keyIndex++;
          
          const data = await fetchFromAdzuna(country, page, apiKey, maxDays);
          summary.api_calls++;
          
          if (!data.results || data.results.length === 0) {
            break; // No more results
          }
          
          for (const job of data.results) {
            try {
              const inserted = await saveToDatabase(client, job, country);
              if (inserted) countryInserted++;
            } catch (dbError) {
              summary.errors.push(`DB error for job ${job.id}: ${dbError.message}`);
            }
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (apiError) {
          summary.errors.push(`API error ${country} page ${page}: ${apiError.message}`);
          break;
        }
      }
      
      summary.by_country[country] = countryInserted;
      summary.total_inserted += countryInserted;
    }

    summary.completed_at = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      message: `Loaded ${summary.total_inserted} jobs from ${countryList.length} countries`,
      summary
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      summary
    });
  } finally {
    if (client) client.release();
    await pool.end();
  }
};