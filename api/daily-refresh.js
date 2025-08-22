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
  
  // Fallback keys
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

const COUNTRIES = ['gb', 'us', 'de', 'fr', 'ca', 'au', 'nl', 'it', 'es', 'sg', 'at', 'be', 'br', 'ch', 'in', 'mx', 'nz', 'pl', 'ru', 'za'];

// Aktif ilanları kontrol et (son 14 gün)
async function fetchActiveJobs(country, apiKey, page = 1) {
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?` +
    `app_id=${apiKey.app_id}&app_key=${apiKey.app_key}` +
    `&results_per_page=50&sort_by=date&max_days_old=14` + // Son 14 gün kontrolü
    `&salary_min=1&salary_max=999999` +
    `&what_exclude=internship%20volunteer%20unpaid%20commission%20freelance` +
    `&content-type=application/json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Database'e kaydet (aynı logic)
async function saveJobToDatabase(client, job, country) {
  if (!job.id || !job.title || !job.redirect_url || !job.latitude || !job.longitude || !job.salary_min || !job.salary_max) {
    return false;
  }
  
  if (job.title.length < 5 || job.title.toLowerCase().includes('earn money') || job.title.toLowerCase().includes('work from home $')) {
    return false;
  }
  
  const query = `
    INSERT INTO jobs (
      adzuna_id, title, company, country, city, 
      lat, lon, url, salary_min, salary_max, currency, remote, source,
      marker_html, popup_html, icon_type
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    ) ON CONFLICT (adzuna_id) DO UPDATE SET
      title = EXCLUDED.title,
      company = EXCLUDED.company,
      salary_min = EXCLUDED.salary_min,
      salary_max = EXCLUDED.salary_max,
      marker_html = EXCLUDED.marker_html,
      popup_html = EXCLUDED.popup_html,
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
  
  // Pre-computed HTML
  const markerHtml = `<div class="marker-container"><div class="icon-wrapper" style="border-color: #0097A7;"><i class="fa-solid fa-briefcase" style="color: #0097A7;"></i></div><div class="marker-label">${job.title.substring(0, 50)}</div></div>`;
  
  const address = `${city || ''}, ${country.toUpperCase()}`.replace(/^,\\s*|,\\s*$/g, '');
  const popupHtml = `
    <div class="custom-popup-container">
        <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">${job.title}</div>
        <div style="font-size: 15px; font-weight: bold; color: #059669; margin-bottom: 12px; padding: 8px; background-color: #f0fdf4; border-radius: 6px; display: flex; align-items: center;">
            <i class="fa-solid fa-dollar-sign" style="margin-right: 8px; font-size: 14px;"></i>
            ${job.salary_currency || 'USD'} ${Math.round(job.salary_min)?.toLocaleString() || '?'} - ${Math.round(job.salary_max)?.toLocaleString() || '?'}
        </div>
        <div style="font-size: 14px; color: #4b5563; margin-bottom: 12px; line-height: 1.4; border-left: 3px solid #e5e7eb; padding-left: 12px;">
            <i class="fa-solid fa-building" style="margin-right: 8px; color: #6b7280;"></i>${job.company?.display_name || 'Şirket bilgisi mevcut değil'}
            <br><i class="fa-solid fa-location-dot" style="margin-right: 8px; color: #6b7280; margin-top: 4px;"></i>${address}
        </div>
        <a href="${job.redirect_url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-bottom: 8px;">İlana Başvur</a>
        <div style="text-align: center; margin-top: 8px; font-size: 11px; color: #9ca3af;">Powered by Adzuna</div>
    </div>`;
  
  const values = [
    job.id.toString(),
    job.title.substring(0, 200).trim(),
    job.company?.display_name?.substring(0, 100) || null,
    country.toUpperCase(),
    city?.substring(0, 50) || null,
    parseFloat(job.latitude),
    parseFloat(job.longitude),
    job.redirect_url,
    Math.round(job.salary_min),
    Math.round(job.salary_max),
    job.salary_currency?.substring(0, 3) || 'USD',
    isRemote,
    'adzuna',
    markerHtml,
    popupHtml,
    'job'
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
    
    // 1. Mevcut database'deki tüm Adzuna ilan ID'lerini al
    const existingJobsResult = await client.query(`
      SELECT adzuna_id FROM jobs WHERE source = 'adzuna'
    `);
    const existingJobIds = new Set(existingJobsResult.rows.map(row => row.adzuna_id));

    // 2. Her ülkeden aktif ilanları çek (son 14 gün kontrolü için)
    const apiKeys = getAdzunaKeys();
    let keyIndex = 0;
    const activeJobIds = new Set(); // API'den gelen aktif ilan ID'leri

    for (const country of COUNTRIES) {
      try {
        const apiKey = apiKeys[keyIndex % apiKeys.length];
        keyIndex++;
        
        // Her ülkeden 3 sayfa çek (aktif ilanları tespit etmek için)
        for (let page = 1; page <= 3; page++) {
          const data = await fetchActiveJobs(country, apiKey, page);
          
          if (!data.results || data.results.length === 0) {
            break;
          }
          
          // API'den gelen aktif ilan ID'lerini kaydet
          data.results.forEach(job => {
            if (job.id) {
              activeJobIds.add(job.id.toString());
            }
          });
          
          // Yeni ilanları kaydet (sadece son 24 saatin)
          let countryAdded = 0;
          for (const job of data.results) {
            try {
              // Son 24 saatte yayınlanan ilanları kaydet
              const jobDate = new Date(job.created || job.updated || Date.now());
              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              
              if (jobDate >= oneDayAgo) {
                const inserted = await saveJobToDatabase(client, job, country);
                if (inserted) countryAdded++;
              }
            } catch (dbError) {
              summary.errors.push(`DB error for job ${job.id}: ${dbError.message}`);
            }
          }
          
          summary.by_country[country] = (summary.by_country[country] || 0) + countryAdded;
          summary.new_jobs += countryAdded;
          
          // Sayfa arası bekleme
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (apiError) {
        summary.errors.push(`API error ${country}: ${apiError.message}`);
      }
    }

    // 3. Yayından kaldırılmış ilanları sil
    const inactiveJobIds = [];
    for (const existingId of existingJobIds) {
      if (!activeJobIds.has(existingId)) {
        inactiveJobIds.push(existingId);
      }
    }
    
    if (inactiveJobIds.length > 0) {
      const deleteQuery = `
        DELETE FROM jobs 
        WHERE source = 'adzuna' 
        AND adzuna_id = ANY($1::text[])
      `;
      const deleteResult = await client.query(deleteQuery, [inactiveJobIds]);
      summary.deleted_jobs = deleteResult.rowCount;
    }

    summary.completed_at = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      message: `Daily refresh completed: ${summary.new_jobs} new jobs, ${summary.deleted_jobs} old jobs deleted`,
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