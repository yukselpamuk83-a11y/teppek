// Basit test API - Cache olmadan
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const APP_ID = 'a19dd595';
  const APP_KEY = '0ca6f72f3a5cafae1643cfae18100181'; // İlk key kullanılıyor
  
  try {
    // Sadece Londra'dan basit veri çek
    const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=20&what=developer&where=London&content-type=application/json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const listings = data.results.map(job => ({
      id: `adzuna-${job.id}`,
      type: 'job',
      title: job.title,
      company: job.company?.display_name || 'Şirket',
      location: {
        lat: job.latitude || 51.5074,
        lng: job.longitude || -0.1278
      },
      address: job.location?.display_name || 'London',
      description: job.description ? job.description.substring(0, 200) + '...' : 'İş detayları',
      salary_min: job.salary_min || 0,
      salary_max: job.salary_max || 0,
      applyUrl: job.redirect_url || `https://www.adzuna.com/details/${job.id}`,
      contact: null,
      source: 'adzuna',
      postedDate: job.created
    }));
    
    return res.status(200).json({
      success: true,
      count: listings.length,
      listings: listings
    });
    
  } catch (error) {
    return res.status(200).json({
      success: false,
      count: 0,
      listings: [],
      error: error.message
    });
  }
}