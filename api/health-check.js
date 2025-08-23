// Simple health check API
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const dbUrl = process.env.DATABASE_URL ? 'configured' : 'missing';
    
    res.status(200).json({
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString(),
      database_url: dbUrl,
      node_version: process.version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};