// Simple database connection test
const { Pool } = require('pg');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
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

  let client;
  try {
    client = await pool.connect();
    
    // Simple count query
    const result = await client.query('SELECT COUNT(*) as total FROM jobs');
    const count = result.rows[0].total;
    
    // Get sample data
    const sample = await client.query('SELECT id, title, company, city FROM jobs LIMIT 3');
    
    res.status(200).json({
      success: true,
      message: 'Database connection OK',
      total_jobs: parseInt(count),
      sample_data: sample.rows
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  } finally {
    if (client) client.release();
  }
};