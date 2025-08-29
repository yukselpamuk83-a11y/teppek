// GET MAP DATA API - Hem iş ilanları hem CV'leri getir
const { Pool } = require('pg');

async function getMapDataHandler(req, res) {
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

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is missing!');
    return res.status(500).json({
      success: false,
      error: 'Database configuration error - DATABASE_URL missing',
      code: 'DATABASE_CONFIG_ERROR'
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

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  let client;
  try {
    client = await pool.connect();
    
    let allData = [];
    let totalCount = 0;

    // İş ilanlarını getir
    if (type === 'all' || type === 'jobs') {
      let jobWhereClause = '';
      let jobParams = [];
      
      if (clear !== 'true') {
        const jobConditions = [];
        
        if (sanitizedQuery) {
          jobParams.push(`%${sanitizedQuery.toLowerCase()}%`);
          jobConditions.push(`(
            LOWER(title) LIKE $${jobParams.length} OR 
            LOWER(company) LIKE $${jobParams.length}
          )`);
        }
        
        if (sanitizedCountry) {
          jobParams.push(sanitizedCountry.toUpperCase());
          jobConditions.push(`country = $${jobParams.length}`);
        }
        
        if (sanitizedCity) {
          jobParams.push(sanitizedCity.toLowerCase());
          jobConditions.push(`LOWER(city) = $${jobParams.length}`);
        }
        
        if (remote === 'true') {
          jobConditions.push('remote = true');
        } else if (remote === 'false') {
          jobConditions.push('remote = false');
        }

        jobWhereClause = jobConditions.length > 0 ? 
          `WHERE ${jobConditions.join(' AND ')}` : '';
      }

      const jobQuery = `
        SELECT 
          id, adzuna_id, title, company as name, city, country, 
          lat, lon, url, contact, salary_min, salary_max, currency, 
          remote, source, created_at,
          'job' as type
        FROM jobs
        ${jobWhereClause}
        ORDER BY created_at DESC
      `;

      const jobCountQuery = `
        SELECT COUNT(*) as total
        FROM jobs
        ${jobWhereClause}
      `;

      try {
        const [jobsResult, jobCountResult] = await Promise.all([
          client.query(jobQuery, jobParams),
          client.query(jobCountQuery, jobParams)
        ]);

        const jobs = jobsResult.rows.map(job => ({
          id: `job-${job.id}`,
          adzuna_id: job.adzuna_id,
          type: 'job',
          title: job.title,
          company: job.name,
          name: job.name,
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
        totalCount += parseInt(jobCountResult.rows[0].total);
      } catch (jobError) {
        console.error('Job query error:', jobError);
        // Jobs query başarısız olursa boş array dön
      }
    }

    // CV'leri getir - sadece CV tablosu mevcutsa
    if ((type === 'all' || type === 'cvs')) {
      try {
        // Önce CV tablosunun var olup olmadığını kontrol et
        await client.query('SELECT 1 FROM cvs LIMIT 1');
        
        let cvWhereClause = '';
        let cvParams = [];
        
        if (clear !== 'true') {
          const cvConditions = [];
          
          if (sanitizedQuery) {
            cvParams.push(`%${sanitizedQuery.toLowerCase()}%`);
            cvConditions.push(`(
              LOWER(title) LIKE $${cvParams.length} OR 
              LOWER(full_name) LIKE $${cvParams.length} OR
              LOWER(description) LIKE $${cvParams.length}
            )`);
          }
          
          if (sanitizedCountry) {
            cvParams.push(sanitizedCountry.toUpperCase());
            cvConditions.push(`country = $${cvParams.length}`);
          }
          
          if (sanitizedCity) {
            cvParams.push(sanitizedCity.toLowerCase());
            cvConditions.push(`LOWER(city) = $${cvParams.length}`);
          }
          
          if (remote === 'true') {
            cvConditions.push('remote_available = true');
          } else if (remote === 'false') {
            cvConditions.push('remote_available = false');
          }

          cvWhereClause = cvConditions.length > 0 ? 
            `WHERE ${cvConditions.join(' AND ')}` : '';
        }

        const cvQuery = `
          SELECT 
            id, full_name, title, city, country, 
            lat, lon, contact, salary_expectation_min, salary_expectation_max, currency, 
            remote_available, skills, experience_years, created_at,
            'cv' as type
          FROM cvs
          ${cvWhereClause}
          AND available_for_work = true
          ORDER BY created_at DESC
        `;

        const cvCountQuery = `
          SELECT COUNT(*) as total
          FROM cvs
          ${cvWhereClause}
          AND available_for_work = true
        `;

        const [cvsResult, cvCountResult] = await Promise.all([
          client.query(cvQuery, cvParams),
          client.query(cvCountQuery, cvParams)
        ]);

        const cvs = cvsResult.rows.map(cv => ({
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
        totalCount += parseInt(cvCountResult.rows[0].total);
      } catch (cvError) {
        console.warn('CV table not available or query failed:', cvError.message);
        // CV tablosu yoksa veya hata varsa sessizce devam et
      }
    }

    // Sayfalama uygula
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
    console.error('❌ Database error in get-map-data:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      success: false,
      error: isDevelopment ? `Database error: ${error.message}` : 'Internal server error',
      code: 'DATABASE_ERROR',
      ...(isDevelopment && {
        details: {
          code: error.code,
          detail: error.detail,
          hint: error.hint
        }
      })
    });
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

module.exports = getMapDataHandler;