// api/jobs.js
const { Pool } = require('pg');

module.exports = async (req, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const q = (req.query.q || '').trim();
  const country = (req.query.country || '').trim();
  const city = (req.query.city || '').trim();
  const perPage = Math.min(parseInt(req.query.per_page || '20', 10), 100);
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const offset = (page - 1) * perPage;

  const where = [];
  const params = [];
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`(lower(title) like $${params.length} or lower(company) like $${params.length})`);
  }
  if (country) {
    params.push(country.toUpperCase());
    where.push(`country = $${params.length}`);
  }
  if (city) {
    params.push(city.toLowerCase());
    where.push(`lower(city) = $${params.length}`);
  }

  const whereSql = where.length ? `where ${where.join(' and ')}` : '';
  const sql = `
    select id, provider, provider_id, title, company, city, region, country,
           lat, lon, url, posted_at, salary_min, salary_max, currency, contract_time, remote
    from jobs
    ${whereSql}
    order by posted_at desc
    limit $${params.length + 1} offset $${params.length + 2}
  `;

  try {
    const client = await pool.connect();
    const { rows } = await client.query(sql, [...params, perPage, offset]);
    res.status(200).json({ results: rows });
    client.release();
    await pool.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
};
