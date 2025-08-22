// Simple database connection test
const { Pool } = require('pg');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (!process.env.DATABASE_URL) {
    return res.json({ success: false, error: 'DATABASE_URL not set' });
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version()');
    client.release();
    await pool.end();

    return res.json({
      success: true,
      message: 'Database connection successful',
      database_info: result.rows[0],
      connection_url_preview: process.env.DATABASE_URL.substring(0, 50) + '...'
    });

  } catch (error) {
    return res.json({
      success: false,
      error: error.message,
      connection_url_preview: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 50) + '...' : 'not set'
    });
  }
};