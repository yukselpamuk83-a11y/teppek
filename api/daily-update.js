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
    
    // Tüm 20 ülkeden son 3 günün verilerini çek
    const mockReq = {
      query: {
        countries: 'gb,us,de,fr,ca,au,nl,it,es,sg,at,be,br,ch,in,mx,nz,pl,ru,za', // Tüm 20 ülke
        days: '3',             // Son 3 gün (yeni ilanları yakalamak için)
        pages: '5'             // Ülke başına 5 sayfa (250 ilan max)
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