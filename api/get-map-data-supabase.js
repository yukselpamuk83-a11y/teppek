// GET MAP DATA API - Supabase Client Version (PostgreSQL yerine)
import { createClient } from '@supabase/supabase-js';

export default async function getMapDataHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  // Check Supabase environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Supabase environment variables missing!');
    return res.status(500).json({
      success: false,
      error: 'Database configuration error - Supabase credentials missing',
      code: 'SUPABASE_CONFIG_ERROR'
    });
  }

  const {
    q = '',           // Arama terimi
    country = '',     // Ülke filtresi
    city = '',        // Şehir filtresi  
    remote = '',      // Remote iş filtresi (true/false)
    type = 'all',     // 'jobs', 'cvs', 'all'
    page = '1',       // Sayfa numarası
    limit = '50',     // Sayfa başına kayıt
    clear = ''        // Filtreleri temizle
  } = req.query;

  // Input validation and sanitization
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * limitNum;

  const sanitizedQuery = q.trim().substring(0, 100);
  const sanitizedCountry = country.trim().substring(0, 50);
  const sanitizedCity = city.trim().substring(0, 50);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    let allData = [];
    let totalCount = 0;

    // İş ilanlarını getir
    if (type === 'all' || type === 'jobs') {
      try {
        let jobsQuery = supabase
          .from('jobs')
          .select('id, adzuna_id, title, company, city, country, lat, lon, url, contact, salary_min, salary_max, currency, remote, source, created_at', { count: 'exact' });

        // Filtreleri uygula
        if (clear !== 'true') {
          if (sanitizedQuery) {
            jobsQuery = jobsQuery.or(`title.ilike.%${sanitizedQuery}%,company.ilike.%${sanitizedQuery}%`);
          }
          
          if (sanitizedCountry) {
            jobsQuery = jobsQuery.eq('country', sanitizedCountry.toUpperCase());
          }
          
          if (sanitizedCity) {
            jobsQuery = jobsQuery.ilike('city', sanitizedCity);
          }
          
          if (remote === 'true') {
            jobsQuery = jobsQuery.eq('remote', true);
          } else if (remote === 'false') {
            jobsQuery = jobsQuery.eq('remote', false);
          }
        }

        // Sıralama ve sayfalama
        const { data: jobsData, error: jobsError, count: jobsCount } = await jobsQuery
          .order('created_at', { ascending: false })
          .range(0, 999); // Supabase max 1000 limit

        if (jobsError) {
          console.error('Jobs query error:', jobsError);
        } else {
          const jobs = jobsData.map(job => ({
            id: `job-${job.id}`,
            adzuna_id: job.adzuna_id,
            type: 'job',
            title: job.title,
            company: job.company,
            name: job.company,
            location: {
              lat: parseFloat(job.lat),
              lng: parseFloat(job.lon)
            },
            address: `${job.city || ''}, ${job.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
            url: job.url,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            currency: job.currency,
            remote: job.remote,
            contact: job.contact,
            source: job.source,
            postedDate: job.created_at
          }));

          allData = allData.concat(jobs);
          totalCount += jobsCount || 0;
        }
      } catch (jobError) {
        console.error('Job query error:', jobError);
      }
    }

    // CV'leri getir
    if (type === 'all' || type === 'cvs') {
      try {
        let cvsQuery = supabase
          .from('cvs')
          .select('id, full_name, title, city, country, lat, lon, contact, salary_expectation_min, salary_expectation_max, currency, remote_available, skills, experience_years, created_at', { count: 'exact' })
          .eq('available_for_work', true);

        // Filtreleri uygula
        if (clear !== 'true') {
          if (sanitizedQuery) {
            cvsQuery = cvsQuery.or(`title.ilike.%${sanitizedQuery}%,full_name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
          }
          
          if (sanitizedCountry) {
            cvsQuery = cvsQuery.eq('country', sanitizedCountry.toUpperCase());
          }
          
          if (sanitizedCity) {
            cvsQuery = cvsQuery.ilike('city', sanitizedCity);
          }
          
          if (remote === 'true') {
            cvsQuery = cvsQuery.eq('remote_available', true);
          } else if (remote === 'false') {
            cvsQuery = cvsQuery.eq('remote_available', false);
          }
        }

        const { data: cvsData, error: cvsError, count: cvsCount } = await cvsQuery
          .order('created_at', { ascending: false })
          .range(0, 999);

        if (cvsError) {
          console.warn('CVs query error:', cvsError.message);
        } else {
          const cvs = cvsData.map(cv => ({
            id: `cv-${cv.id}`,
            type: 'cv',
            title: cv.title,
            name: cv.full_name,
            company: cv.full_name,
            location: {
              lat: parseFloat(cv.lat),
              lng: parseFloat(cv.lon)
            },
            address: `${cv.city || ''}, ${cv.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
            salary_min: cv.salary_expectation_min,
            salary_max: cv.salary_expectation_max,
            currency: cv.currency,
            remote: cv.remote_available,
            contact: cv.contact,
            skills: cv.skills,
            experience_years: cv.experience_years,
            source: 'manual',
            postedDate: cv.created_at
          }));

          allData = allData.concat(cvs);
          totalCount += cvsCount || 0;
        }
      } catch (cvError) {
        console.warn('CV query error:', cvError.message);
      }
    }

    // Sayfalama uygula (client-side, Supabase limit'i 1000)
    const paginatedData = allData
      .sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate))
      .slice(offset, offset + limitNum);

    const totalPages = Math.ceil(totalCount / limitNum);

    // İstatistikler
    const stats = {
      total_items: totalCount,
      total_jobs: allData.filter(item => item.type === 'job').length,
      total_cvs: allData.filter(item => item.type === 'cv').length,
      current_page: pageNum,
      total_pages: totalPages,
      items_per_page: limitNum,
      has_next_page: pageNum < totalPages,
      has_prev_page: pageNum > 1
    };

    return res.status(200).json({
      success: true,
      data: paginatedData,
      stats,
      filters: {
        search_query: sanitizedQuery,
        country: sanitizedCountry || 'all',
        city: sanitizedCity || 'all',
        remote: remote || 'all',
        type: type
      }
    });

  } catch (error) {
    console.error('❌ Supabase API error:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      success: false,
      error: isDevelopment ? `Supabase error: ${error.message}` : 'Internal server error',
      code: 'SUPABASE_ERROR',
      ...(isDevelopment && {
        details: {
          message: error.message,
          stack: error.stack
        }
      })
    });
  }
}