// TEST API - Sistem durumunu kontrol et
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sistem bilgileri
  const systemInfo = {
    success: true,
    message: 'Teppek API çalışıyor',
    timestamp: new Date().toISOString(),
    environment: {
      node_version: process.version,
      platform: process.platform,
      memory_usage: process.memoryUsage(),
      uptime: process.uptime()
    },
    api_endpoints: {
      test: '/api/test',
      load_data: '/api/load-data',
      get_jobs: '/api/get-jobs'
    },
    database_status: process.env.DATABASE_URL ? 'configured' : 'not_configured',
    adzuna_keys: {
      key1: process.env.ADZUNA_APP_ID_1 ? 'configured' : 'missing',
      key2: process.env.ADZUNA_APP_ID_2 ? 'configured' : 'missing',
      key3: process.env.ADZUNA_APP_ID_3 ? 'configured' : 'missing',
      key4: process.env.ADZUNA_APP_ID_4 ? 'configured' : 'missing',
      key5: process.env.ADZUNA_APP_ID_5 ? 'configured' : 'missing'
    }
  };

  return res.status(200).json(systemInfo);
}