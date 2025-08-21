// Cron job - Her gece saat 3'te çalışır
export default async function handler(req, res) {
  // Vercel cron güvenlik kontrolü
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('🌙 Gece güncelleme başladı:', new Date().toLocaleString('tr-TR'));
  
  try {
    // Cache'i güncelle
    const response = await fetch('https://teppek.com/api/listings-cached?forceRefresh=true', {
      headers: {
        'x-admin-key': 'your-secret-admin-key'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gece güncellemesi tamamlandı. Toplam ilan:', data.count);
      
      return res.status(200).json({
        success: true,
        message: 'Cache başarıyla güncellendi',
        timestamp: new Date().toISOString(),
        totalListings: data.count,
        sources: data.sources
      });
    } else {
      throw new Error('Cache güncelleme başarısız');
    }
  } catch (error) {
    console.error('❌ Gece güncelleme hatası:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}