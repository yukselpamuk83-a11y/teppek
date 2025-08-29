// Debug API - Environment variables kontrolü
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Environment variables check
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'NOT SET',
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      SUPABASE_URL: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 30)}...` : 'NOT SET',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      VERCEL: process.env.VERCEL || 'undefined',
      VERCEL_ENV: process.env.VERCEL_ENV || 'undefined'
    };

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envVars,
      request: {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'host': req.headers['host']
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Debug API failed',
      message: error.message,
      stack: error.stack
    });
  }
}