// İLK YÜKLEME SCRİPTİ - 100.000+ İLAN
// Bu scripti bir kez çalıştırın, tüm Adzuna verilerini çeker

console.log('🚀 100.000+ ilan yükleme başlıyor...');
console.log('⏱️ Bu işlem 1-2 saat sürebilir...');
console.log('');

async function loadAllCountries() {
  const countries = [
    'gb', 'us', 'au', 'ca', 'de', 'nl', 'fr', 'at', 'nz', 'za',
    'sg', 'in', 'br', 'mx', 'it', 'es', 'pl', 'be', 'ch', 'ru'
  ];
  
  let totalListings = 0;
  
  for (const countryCode of countries) {
    console.log(`\n📍 ${countryCode.toUpperCase()} ülkesi işleniyor...`);
    
    try {
      const response = await fetch(
        `https://teppek.com/api/adzuna-massive?mode=fetch&initial=true&country=${countryCode}`
      );
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${countryCode.toUpperCase()}: ${result.stats?.totalFetched || 0} ilan yüklendi`);
        totalListings += result.stats?.totalFetched || 0;
      } else {
        console.log(`❌ ${countryCode.toUpperCase()}: Hata - ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ ${countryCode.toUpperCase()}: Bağlantı hatası`);
    }
    
    // Her ülke arasında 10 saniye bekle (API limiti)
    console.log('⏳ 10 saniye bekleniyor...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 TAMAMLANDI!`);
  console.log(`📊 Toplam yüklenen ilan: ${totalListings.toLocaleString()}`);
  console.log('='.repeat(50));
}

// Çalıştır
loadAllCountries().catch(console.error);

// NOT: Bu scripti şu şekilde çalıştırın:
// 1. Terminal açın
// 2. cd C:\Users\seher\Desktop\geoo
// 3. node initial-load.js