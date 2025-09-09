// CLEAR ADZUNA JOBS API - Eski Adzuna verilerini temizle
const { Pool } = require('pg');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
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
    deleted_jobs: 0,
    by_country: {},
    by_date_range: {},
    total_before: 0,
    total_after: 0
  };

  let client;
  try {
    client = await pool.connect();
    
    // Get count before deletion
    const beforeResult = await client.query(`
      SELECT COUNT(*) as total, 
             country,
             DATE(created_at) as created_date,
             COUNT(*) OVER() as grand_total
      FROM jobs 
      WHERE source = 'adzuna'
      GROUP BY country, DATE(created_at)
      ORDER BY country, created_date DESC;
    `);

    summary.total_before = beforeResult.rows.length > 0 ? parseInt(beforeResult.rows[0].grand_total) : 0;
    
    // Group by country for before stats
    beforeResult.rows.forEach(row => {
      if (!summary.by_country[row.country]) {
        summary.by_country[row.country] = { before: 0, after: 0, deleted: 0 };
      }
      summary.by_country[row.country].before += parseInt(row.total);
    });

    console.log(`🗑️  Starting deletion of ${summary.total_before} Adzuna jobs...`);

    // Delete all Adzuna jobs
    const deleteResult = await client.query(`
      DELETE FROM jobs 
      WHERE source = 'adzuna'
      RETURNING country, created_at;
    `);

    summary.deleted_jobs = deleteResult.rowCount;

    // Count by country what was deleted
    const deletedByCountry = {};
    deleteResult.rows.forEach(row => {
      const country = row.country;
      if (!deletedByCountry[country]) {
        deletedByCountry[country] = 0;
      }
      deletedByCountry[country]++;
    });

    // Update summary with deletion stats
    Object.keys(summary.by_country).forEach(country => {
      summary.by_country[country].deleted = deletedByCountry[country] || 0;
      summary.by_country[country].after = 0; // All deleted
    });

    // Get final count
    const afterResult = await client.query(`
      SELECT COUNT(*) as total
      FROM jobs 
      WHERE source = 'adzuna';
    `);

    summary.total_after = parseInt(afterResult.rows[0].total);

    // Reset auto-increment if needed (PostgreSQL)
    await client.query(`
      SELECT setval(pg_get_serial_sequence('jobs', 'id'), 
        (SELECT COALESCE(MAX(id), 1) FROM jobs));
    `);

    summary.completed_at = new Date().toISOString();
    
    console.log(`✅ Deletion completed: ${summary.deleted_jobs} jobs deleted`);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${summary.deleted_jobs} Adzuna jobs from database`,
      summary
    });

  } catch (error) {
    console.error('❌ Database cleanup error:', error);
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