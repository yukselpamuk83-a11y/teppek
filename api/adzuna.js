export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const APP_ID = 'a19dd595';
  const APP_KEY = '0f8160edaa39c3dcac3962d77b32236b';
  
  const { lat, lng, radius = 50, page = 1 } = req.query;
  
  try {
    // Major cities around the world for demo
    const locations = [
      { country: 'us', location: 'New York', lat: 40.7128, lng: -74.0060 },
      { country: 'gb', location: 'London', lat: 51.5074, lng: -0.1278 },
      { country: 'de', location: 'Berlin', lat: 52.5200, lng: 13.4050 },
      { country: 'fr', location: 'Paris', lat: 48.8566, lng: 2.3522 },
      { country: 'jp', location: 'Tokyo', lat: 35.6762, lng: 139.6503 },
      { country: 'au', location: 'Sydney', lat: -33.8688, lng: 151.2093 },
      { country: 'ca', location: 'Toronto', lat: 43.6532, lng: -79.3832 },
      { country: 'nl', location: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
      { country: 'sg', location: 'Singapore', lat: 1.3521, lng: 103.8198 },
      { country: 'br', location: 'São Paulo', lat: -23.5505, lng: -46.6333 }
    ];
    
    // Find nearest location or use default
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
    
    // Fetch from Adzuna API
    const url = `https://api.adzuna.com/v1/api/jobs/${targetLocation.country}/search/${page}?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=20&what=developer%20engineer%20software&where=${encodeURIComponent(targetLocation.location)}&content-type=application/json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Adzuna data to our format
    const listings = data.results.map((job, index) => ({
      id: `adzuna-${job.id}`,
      type: 'job',
      title: job.title,
      company: job.company.display_name,
      location: {
        lat: job.latitude || targetLocation.lat + (Math.random() - 0.5) * 0.1,
        lng: job.longitude || targetLocation.lng + (Math.random() - 0.5) * 0.1,
        address: job.location.display_name,
        city: targetLocation.location,
        country: targetLocation.country.toUpperCase()
      },
      description: job.description ? job.description.substring(0, 200) + '...' : 'Click to view full job description',
      salary: job.salary_min ? {
        min: job.salary_min,
        max: job.salary_max || job.salary_min * 1.2,
        currency: job.salary_currency || 'USD',
        period: job.salary_is_predicted ? 'Estimated Annual' : 'Annual'
      } : null,
      employmentType: job.contract_type || job.contract_time || 'Full-time',
      postedDate: job.created,
      applyUrl: job.redirect_url,
      source: 'adzuna',
      category: job.category ? job.category.label : 'Technology'
    }));
    
    // Add some test data if Adzuna returns few results
    if (listings.length < 10) {
      for (let i = listings.length; i < 20; i++) {
        listings.push({
          id: `test-${i}`,
          type: 'job',
          title: `Software Developer Position ${i}`,
          company: `Tech Company ${i}`,
          location: {
            lat: targetLocation.lat + (Math.random() - 0.5) * 0.2,
            lng: targetLocation.lng + (Math.random() - 0.5) * 0.2,
            address: `Tech District ${i}`,
            city: targetLocation.location,
            country: targetLocation.country.toUpperCase()
          },
          description: 'Join our innovative team working on cutting-edge technologies...',
          salary: {
            min: 60000 + (i * 5000),
            max: 80000 + (i * 5000),
            currency: 'USD',
            period: 'Annual'
          },
          employmentType: 'Full-time',
          postedDate: new Date(Date.now() - i * 86400000).toISOString(),
          applyUrl: null,
          source: 'internal',
          category: 'Technology'
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      count: listings.length,
      total: data.count || listings.length,
      page: parseInt(page),
      listings: listings
    });
    
  } catch (error) {
    console.error('Error fetching Adzuna data:', error);
    
    // Return fallback data on error
    const fallbackListings = [];
    for (let i = 0; i < 20; i++) {
      fallbackListings.push({
        id: `fallback-${i}`,
        type: 'job',
        title: `Software Developer Position ${i}`,
        company: `Tech Company ${i}`,
        location: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.2,
          lng: -74.0060 + (Math.random() - 0.5) * 0.2,
          address: `Tech Park ${i}`,
          city: 'New York',
          country: 'US'
        },
        description: 'Exciting opportunity in software development...',
        salary: {
          min: 70000 + (i * 3000),
          max: 90000 + (i * 3000),
          currency: 'USD',
          period: 'Annual'
        },
        employmentType: 'Full-time',
        postedDate: new Date(Date.now() - i * 86400000).toISOString(),
        applyUrl: null,
        source: 'internal',
        category: 'Technology'
      });
    }
    
    return res.status(200).json({
      success: true,
      count: fallbackListings.length,
      total: fallbackListings.length,
      page: 1,
      listings: fallbackListings,
      error: 'Using fallback data due to API error'
    });
  }
}