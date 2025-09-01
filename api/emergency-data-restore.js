// Emergency data restore using Supabase (not PostgreSQL)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Supabase environment variables not set'
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  const summary = {
    started_at: new Date().toISOString(),
    new_jobs: 0,
    by_country: {},
    errors: []
  };

  // Adzuna API keys - hardcoded for emergency
  const apiKeys = [
    { app_id: 'a6b1fdde', app_key: 'a2c82d658f8b46a7bf4ad58c1b4d5c9f' }
  ];

  const COUNTRIES = ['gb', 'us', 'de', 'fr', 'ca', 'au', 'nl', 'it', 'es'];
  let keyIndex = 0;

  try {
    for (const country of COUNTRIES) {
      try {
        const apiKey = apiKeys[keyIndex % apiKeys.length];
        keyIndex++;
        
        // Fetch from Adzuna - more results for emergency restore
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?` +
          `app_id=${apiKey.app_id}&app_key=${apiKey.app_key}` +
          `&results_per_page=50&sort_by=salary&max_days_old=7` +
          `&salary_min=1000&salary_max=999999` +
          `&content-type=application/json`;
        
        console.log(`🌍 Fetching jobs from ${country}...`);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
          console.log(`❌ No jobs found for ${country}`);
          continue;
        }

        console.log(`📋 Found ${data.results.length} jobs for ${country}`);
        let countryAdded = 0;

        for (const job of data.results) {
          try {
            // Validate required fields
            if (!job.id || !job.title || !job.redirect_url || !job.latitude || !job.longitude || !job.salary_min || !job.salary_max) {
              continue;
            }
            
            // Skip low quality jobs
            if (job.title.length < 5) continue;
            
            // Get city info
            let city = null;
            if (job.location?.display_name) {
              city = job.location.display_name.split(',')[0].trim();
            } else if (Array.isArray(job.location?.area) && job.location.area.length > 0) {
              city = job.location.area[job.location.area.length - 1];
            }
            
            const isRemote = job.title.toLowerCase().includes('remote') || job.title.toLowerCase().includes('work from home');
            const address = `${city || ''}, ${country.toUpperCase()}`.replace(/^,\s*|,\s*$/g, '');
            
            // Create popup HTML
            const popupHtml = `
              <div class="custom-popup-container adzuna-popup">
                <div class="popup-header">
                  <div class="popup-title">${job.title}</div>
                  <div class="popup-source">
                    <i class="fa-solid fa-globe"></i>
                    Adzuna
                  </div>
                </div>
                
                <div class="popup-salary adzuna-salary">
                  <i class="fa-solid fa-dollar-sign"></i>
                  ${job.salary_currency || 'USD'} ${Math.round(job.salary_min)?.toLocaleString() || '?'} - ${Math.round(job.salary_max)?.toLocaleString() || '?'}
                </div>
                
                <div class="popup-details">
                  <div class="popup-company">
                    <i class="fa-solid fa-building"></i>
                    ${job.company?.display_name || 'Şirket bilgisi mevcut değil'}
                  </div>
                  <div class="popup-location">
                    <i class="fa-solid fa-location-dot"></i>
                    ${address}
                  </div>
                </div>
                
                <a href="${job.redirect_url}" target="_blank" rel="noopener noreferrer" class="popup-apply-btn adzuna-apply">
                  <i class="fa-solid fa-external-link"></i>
                  İlana Başvur
                </a>
                
                <div class="popup-footer">
                  <small>Powered by Adzuna API</small>
                </div>
              </div>`;

            // Insert into Supabase
            const { data: inserted, error } = await supabase
              .from('jobs')
              .upsert({
                adzuna_id: job.id.toString(),
                title: job.title.substring(0, 200).trim(),
                company: job.company?.display_name?.substring(0, 100) || null,
                country: country.toUpperCase(),
                city: city?.substring(0, 50) || null,
                lat: parseFloat(job.latitude),
                lon: parseFloat(job.longitude),
                url: job.redirect_url,
                salary_min: Math.round(job.salary_min),
                salary_max: Math.round(job.salary_max),
                currency: job.salary_currency?.substring(0, 3) || 'USD',
                remote: isRemote,
                source: 'adzuna',
                popup_html: popupHtml,
                created_at: new Date().toISOString()
              })
              .select();

            if (error) {
              if (error.code !== '23505') { // Not a duplicate
                summary.errors.push(`DB error for job ${job.id}: ${error.message}`);
              }
            } else {
              countryAdded++;
            }

          } catch (jobError) {
            summary.errors.push(`Job processing error ${job.id}: ${jobError.message}`);
          }
        }

        summary.by_country[country] = countryAdded;
        summary.new_jobs += countryAdded;
        
        console.log(`✅ ${country}: Added ${countryAdded} jobs`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (apiError) {
        summary.errors.push(`API error ${country}: ${apiError.message}`);
        console.error(`❌ API error for ${country}:`, apiError.message);
      }
    }

    // Trigger map data regeneration
    try {
      const mapGenResponse = await fetch(`${req.headers.origin || 'https://teppek-nicnpk7q0-yuksels-projects-5a72b11a.vercel.app'}/api/generate-map-data`);
      if (mapGenResponse.ok) {
        console.log('✅ Map data regenerated successfully');
      }
    } catch (mapError) {
      console.error('⚠️  Map regeneration failed:', mapError.message);
    }

    summary.completed_at = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      message: `🆘 Emergency restore completed: ${summary.new_jobs} jobs restored from Adzuna API`,
      summary
    });

  } catch (error) {
    console.error('❌ Emergency restore failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      summary
    });
  }
}