// DAILY REFRESH API - Son 24 saatin ilanlarını çek, eskilerini temizle
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
  
  
  
  return keys;
}

const COUNTRIES = ['at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'es', 'fr', 'gb', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'sg', 'us', 'za'];

// Currency mapping function
function getCurrencyByCountry(country) {
  const currencyMap = {
    'at': 'EUR', 'au': 'AUD', 'be': 'EUR', 'br': 'BRL', 'ca': 'CAD',
    'ch': 'CHF', 'de': 'EUR', 'es': 'EUR', 'fr': 'EUR', 'gb': 'GBP',
    'in': 'INR', 'it': 'EUR', 'mx': 'MXN', 'nl': 'EUR', 'nz': 'NZD',
    'pl': 'PLN', 'sg': 'SGD', 'us': 'USD', 'za': 'ZAR'
  };
  return currencyMap[country.toLowerCase()] || 'USD';
}

// Son 24 saatin ilanlarını çek - Fixed API endpoint
async function fetchDailyJobs(country, apiKey) {
  const params = new URLSearchParams({
    app_id: apiKey.app_id,
    app_key: apiKey.app_key,
    results_per_page: '50',
    sort_by: 'date',
    max_days_old: '1', // Sadece son 24 saat
    salary_min: '7', // Minimum $7
    what_exclude: 'internship volunteer unpaid',
    full_time: '1',
    'content-type': 'application/json'
  });
  
  const url = `http://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Database'e kaydet - Enhanced validation
async function saveJobToDatabase(client, job, country) {
  if (!job.id || !job.title || !job.redirect_url || !job.latitude || !job.longitude || 
      (!job.salary_min && !job.salary_max)) {
    return false;
  }
  
  // Enhanced validation
  const salaryMin = job.salary_min || 0;
  const salaryMax = job.salary_max || 0;
  
  if (salaryMin < 7 && salaryMax < 7) {
    return false;
  }
  
  if (job.title.length < 3 || job.title.length > 500) {
    return false;
  }
  
  const query = `
    INSERT INTO jobs (
      adzuna_id, title, company, country, city, 
      lat, lon, url, salary_min, salary_max, currency, remote, source,
      icon_type, description
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    ) ON CONFLICT (adzuna_id) DO UPDATE SET
      title = EXCLUDED.title,
      company = EXCLUDED.company,
      salary_min = EXCLUDED.salary_min,
      salary_max = EXCLUDED.salary_max,
      description = EXCLUDED.description,
      created_at = NOW()
    RETURNING id;
  `;
  
  // Şehir bilgisi
  let city = null;
  if (job.location?.display_name) {
    city = job.location.display_name.split(',')[0].trim();
  } else if (Array.isArray(job.location?.area) && job.location.area.length > 0) {
    city = job.location.area[job.location.area.length - 1];
  }
  
  const isRemote = job.title.toLowerCase().includes('remote') || job.title.toLowerCase().includes('work from home');
  
  // Enhanced description processing for popup
  let description = null;
  if (job.description) {
    description = job.description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&')  // Replace &amp; with &
      .replace(/&lt;/g, '<')   // Replace &lt; with <
      .replace(/&gt;/g, '>')   // Replace &gt; with >
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .trim();
    
    if (description.length > 2000) {
      description = description.substring(0, 2000).trim();
    }
    
    if (description.length < 50) {
      description = null;
    }
  }
  
  const values = [
    job.id.toString(),
    job.title.substring(0, 500).trim(), // Match DB schema
    job.company?.display_name?.substring(0, 200) || null, // Match DB schema
    country.toUpperCase(),
    city?.substring(0, 100) || null, // Match DB schema
    parseFloat(job.latitude),
    parseFloat(job.longitude),
    job.redirect_url,
    Math.round(salaryMin),
    Math.round(salaryMax),
    job.salary_currency?.substring(0, 3) || getCurrencyByCountry(country),
    isRemote,
    'adzuna',
    'job',
    description
  ];
  
  try {
    const result = await client.query(query, values);
    return result.rowCount > 0;
  } catch (error) {
    if (error.code === '23505') return false; // Duplicate
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

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_URL not configured'
    });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const summary = {
    started_at: new Date().toISOString(),
    new_jobs: 0,
    updated_jobs: 0,
    deleted_jobs: 0,
    by_country: {},
    errors: []
  };

  let client;
  try {
    client = await pool.connect();
    
    // Her ülkeden son 24 saatin ilanlarını çek ve kaydet
    const apiKeys = getAdzunaKeys();
    let keyIndex = 0;
    const dailyJobIds = new Set(); // Bugün çekilen ilan ID'leri

    for (const country of COUNTRIES) {
      try {
        const apiKey = apiKeys[keyIndex % apiKeys.length];
        keyIndex++;
        
        const data = await fetchDailyJobs(country, apiKey);
        
        if (!data.results || data.results.length === 0) {
          continue;
        }
        
        let countryAdded = 0;
        for (const job of data.results) {
          try {
            // Yeni ilanları kaydet
            const inserted = await saveJobToDatabase(client, job, country);
            if (inserted) {
              countryAdded++;
              dailyJobIds.add(job.id.toString()); // Aktif ilan olarak kaydet
            }
          } catch (dbError) {
            summary.errors.push(`DB error for job ${job.id}: ${dbError.message}`);
          }
        }
        
        summary.by_country[country] = countryAdded;
        summary.new_jobs += countryAdded;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (apiError) {
        summary.errors.push(`API error ${country}: ${apiError.message}`);
      }
    }

    // 30 günlük rolling window - bizim çektiğimiz tarihten 30 gün öncesini sil
    const deleteResult = await client.query(`
      DELETE FROM jobs 
      WHERE source = 'adzuna' 
      AND created_at < NOW() - INTERVAL '30 days'
    `);
    summary.deleted_jobs = deleteResult.rowCount;

    summary.completed_at = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      message: `Daily refresh completed: ${summary.new_jobs} new jobs added, ${summary.deleted_jobs} jobs older than 30 days deleted`,
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