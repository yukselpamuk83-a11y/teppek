// DAILY UPDATE API - Günlük veri güncelleme
// Cron job tarafından her gece çağrılır

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // load-data API'sini dahili olarak çağır
    const loadData = require('./load-data.js');
    
    // Son 1 günün verilerini çek, 3 ülkeden, sayfa başına 3 sayfa
    const mockReq = {
      query: {
        countries: 'gb,us,de', // Ana ülkeler
        days: '1',             // Son 24 saat
        pages: '3'             // Ülke başına 3 sayfa (150 ilan max)
      },
      method: 'GET'
    };
    
    // Response mock'ı
    let responseData = null;
    let statusCode = 200;
    
    const mockRes = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      }
    };
    
    // Load data çalıştır
    await loadData(mockReq, mockRes);
    
    return res.status(statusCode).json({
      success: true,
      message: 'Daily update completed',
      timestamp: new Date().toISOString(),
      result: responseData
    });
    
  } catch (error) {
    console.error('Daily update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};