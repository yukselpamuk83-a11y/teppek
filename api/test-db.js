// Test API endpoint to debug 500 errors
import pg from 'pg'
const { Pool } = pg

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Environment check
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Environment check:', envCheck);

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL environment variable not set',
        envCheck
      });
    }

    // Database connection test
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    let client;
    try {
      client = await pool.connect();
      
      // Test query
      const result = await client.query('SELECT NOW() as server_time, version() as pg_version');
      const dbInfo = result.rows[0];
      
      // Check tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('jobs', 'cvs')
        ORDER BY table_name
      `);
      
      const availableTables = tablesResult.rows.map(row => row.table_name);

      return res.status(200).json({
        success: true,
        message: 'Database connection successful',
        envCheck,
        database: {
          server_time: dbInfo.server_time,
          postgres_version: dbInfo.pg_version,
          available_tables: availableTables
        }
      });

    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        envCheck,
        details: {
          message: dbError.message,
          code: dbError.code,
          hint: dbError.hint
        }
      });
    } finally {
      if (client) client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('❌ Test API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unexpected error in test API',
      details: error.message
    });
  }
}