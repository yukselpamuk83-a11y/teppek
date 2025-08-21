// Basit veri yükleme - Tek ülkeden başlayalım
console.log('🚀 Veri yükleme başlıyor...\n');

async function loadData() {
  try {
    // İngiltere'den veri çek
    console.log('🇬🇧 İngiltere verisi yükleniyor...');
    const response = await fetch(
      'https://teppek.com/api/adzuna-massive?mode=fetch&initial=true&country=gb'
    );
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Başarılı!`);
      console.log(`📊 İstatistikler:`, result.stats);
    } else {
      console.log(`❌ Hata:`, result.error);
    }
    
  } catch (error) {
    console.error('❌ Bağlantı hatası:', error.message);
  }
}

// Web sayfasında çalıştırmak için
if (typeof window !== 'undefined') {
  loadData();
} else {
  // Node.js'de çalıştırmak için fetch ekle
  const fetch = require('node-fetch');
  loadData();
}