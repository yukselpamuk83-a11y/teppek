// TEST ADZUNA API - Database olmadan sadece Adzuna'dan veri çek
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { country = 'gb', pages = '2' } = req.query;
  
  const API_KEYS = [
    { app_id: 'a19dd595', app_key: '0ca6f72f3a5cafae1643cfae18100181' },
    { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' }
  ];

  try {
    const jobs = [];
    const maxPages = parseInt(pages);
    
    for (let page = 1; page <= maxPages; page++) {
      const apiKey = API_KEYS[(page - 1) % API_KEYS.length];
      
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?` +
        `app_id=${apiKey.app_id}&app_key=${apiKey.app_key}` +
        `&results_per_page=50&sort_by=date&max_days_old=7` +
        `&content-type=application/json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        // Sadece lokasyonu olan ilanları filtrele
        const validJobs = data.results.filter(job => 
          job.id && job.title && job.redirect_url && 
          job.latitude && job.longitude
        ).map(job => ({
          id: job.id,
          title: job.title,
          company: job.company?.display_name,
          city: job.location?.area?.[job.location.area.length - 1],
          country: country.toUpperCase(),
          lat: job.latitude,
          lng: job.longitude,
          url: job.redirect_url,
          salary_min: job.salary_min,
          salary_max: job.salary_max
        }));
        
        jobs.push(...validJobs);
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return res.status(200).json({
      success: true,
      message: `Fetched ${jobs.length} valid jobs from Adzuna`,
      country: country.toUpperCase(),
      total_jobs: jobs.length,
      sample_jobs: jobs.slice(0, 3),
      api_calls: maxPages
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}