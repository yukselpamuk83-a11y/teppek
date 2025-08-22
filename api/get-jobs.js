// GET JOBS API - PostgreSQL'den iş ilanlarını getir
const { Pool } = require('pg');

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

  const {
    q = '',           // Arama terimi
    country = '',     // Ülke filtresi
    city = '',        // Şehir filtresi  
    remote = '',      // Remote iş filtresi (true/false)
    page = '1',       // Sayfa numarası
    limit = '20',     // Sayfa başına kayıt
    clear = ''        // Filtreleri temizle (hızlı tüm veri)
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100000, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  let client;
  try {
    client = await pool.connect();
    
    // Eğer clear=true ise, hiçbir filtre uygulanmaz (hızlı tüm veri)
    let whereClause = '';
    let params = [];
    
    if (clear !== 'true') {
      // Normal filtreleme
      const conditions = [];
      
      if (q.trim()) {
        params.push(`%${q.trim().toLowerCase()}%`);
        conditions.push(`(
          LOWER(title) LIKE $${params.length} OR 
          LOWER(company) LIKE $${params.length}
        )`);
      }
      
      if (country.trim()) {
        params.push(country.trim().toUpperCase());
        conditions.push(`country = $${params.length}`);
      }
      
      if (city.trim()) {
        params.push(city.trim().toLowerCase());
        conditions.push(`LOWER(city) = $${params.length}`);
      }
      
      if (remote === 'true') {
        conditions.push('remote = true');
      } else if (remote === 'false') {
        conditions.push('remote = false');
      }

      whereClause = conditions.length > 0 ? 
        `WHERE ${conditions.join(' AND ')}` : '';
    }

    // Frontend için tüm form alanları + ilan türü ayırımı
    const mainQuery = `
      SELECT 
        id, adzuna_id, title, company, city, country, 
        lat, lon, url, contact, salary_min, salary_max, currency, 
        remote, source, created_at, marker_html, popup_html, icon_type
      FROM jobs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    // Toplam kayıt sayısı sorgusu
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs
      ${whereClause}
    `;

    params.push(limitNum, offset);
    
    const [jobsResult, countResult] = await Promise.all([
      client.query(mainQuery, params),
      client.query(countQuery, params.slice(0, -2)) // son 2 parametreyi çıkar
    ]);

    const jobs = jobsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    // İstatistikler
    const stats = {
      total_jobs: total,
      current_page: pageNum,
      total_pages: totalPages,
      jobs_per_page: limitNum,
      has_next_page: pageNum < totalPages,
      has_prev_page: pageNum > 1
    };

    return res.status(200).json({
      success: true,
      jobs,
      stats,
      filters: {
        search_query: q,
        country: country || 'all',
        city: city || 'all',
        remote: remote || 'all'
      }
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (client) client.release();
    await pool.end();
  }
};