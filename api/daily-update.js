// GÜNLÜK GÜNCELLEME API'si
// Her gece saat 3'te çalışır
// Son 24 saatin yeni ilanlarını ekler

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Güvenlik kontrolü - sadece Vercel cron job'ı çalıştırabilir
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🌙 Günlük güncelleme başladı:', new Date().toLocaleString('tr-TR'));
  
  try {
    // Son 24 saatin ilanlarını çek
    const response = await fetch('https://teppek.com/api/adzuna-massive?mode=fetch&initial=false');
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Güncelleme tamamlandı!');
      console.log(`📊 İstatistikler:`, result.stats);
      
      return res.status(200).json({
        success: true,
        message: `Günlük güncelleme başarılı`,
        stats: result.stats,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(result.error || 'Güncelleme başarısız');
    }
    
  } catch (error) {
    console.error('❌ Günlük güncelleme hatası:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}