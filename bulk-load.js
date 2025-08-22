// BULK DATA LOADER - Terminal'den 50K ilan yükle
const https = require('https');

const COUNTRIES = ['gb', 'us', 'de', 'fr', 'ca', 'au', 'nl', 'it', 'es', 'sg', 'at', 'be', 'br', 'ch', 'in', 'mx', 'nz', 'pl', 'ru', 'za'];

async function loadSingleCountry(country, pages = 20) {
  const url = `https://teppek.com/api/load-data?countries=${country}&days=14&pages=${pages}`;
  
  console.log(`🇺🇳 Yükleniyor: ${country.toUpperCase()} - ${pages} sayfa`);
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout after 5 minutes'));
    }, 300000); // 5 dakika timeout
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const result = JSON.parse(data);
          const inserted = result.summary?.total_inserted || 0;
          console.log(`✅ ${country.toUpperCase()}: ${inserted} ilan eklendi`);
          resolve(result);
        } catch (err) {
          console.log(`❌ ${country.toUpperCase()}: JSON parse hatası`);
          reject(err);
        }
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      console.log(`❌ ${country.toUpperCase()}: Network hatası`);
      reject(err);
    });
  });
}

async function main() {
  console.log('🎯 HEDEF: 50,000 ilan yükleme başlıyor...\n');
  let totalInserted = 0;
  
  try {
    // Her ülkeyi tek tek yükle
    for (let i = 0; i < COUNTRIES.length; i++) {
      const country = COUNTRIES[i];
      console.log(`\n--- ${i + 1}/${COUNTRIES.length} ---`);
      
      try {
        const result = await loadSingleCountry(country, 25); // 25 sayfa/ülke
        totalInserted += result.summary?.total_inserted || 0;
        console.log(`📊 Toplam: ${totalInserted} ilan`);
      } catch (error) {
        console.log(`⚠️ ${country.toUpperCase()} atlandı: ${error.message}`);
      }
      
      // Ülkeler arası 10 saniye bekle
      if (i < COUNTRIES.length - 1) {
        console.log('⏳ 10 saniye bekleniyor...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log(`\n🎉 TÜM YÜKLEME TAMAMLANDI! Toplam: ${totalInserted} ilan`);
    
  } catch (error) {
    console.error('❌ Genel Hata:', error.message);
  }
}

main();