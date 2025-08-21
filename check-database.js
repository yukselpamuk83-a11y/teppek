// Veritabanı kontrol scripti
// Kaç ilan var kontrol edelim

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rjtzvcykmqquozppdbeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqdHp2Y3lrbXFxdW96cHBkYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMzM0MjUsImV4cCI6MjA0MzgwOTQyNX0.3Secqgbh-eVFWNe7WuPVQWCfRYDiRr9pMgdVqGYJ1UM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('📊 Veritabanı kontrolü başlıyor...\n');
  
  try {
    // Toplam ilan sayısı
    const { count: totalCount, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ HATA: Tablo bulunamadı veya bağlantı hatası!');
      console.error('Detay:', countError.message);
      console.log('\n🔧 ÇÖZÜM:');
      console.log('1. Supabase Dashboard\'a gidin');
      console.log('2. SQL Editor\'de supabase-schema.sql dosyasını çalıştırın');
      console.log('3. Tabloları oluşturun');
      return;
    }
    
    console.log(`✅ Toplam ilan sayısı: ${totalCount || 0}`);
    
    if (totalCount === 0) {
      console.log('\n⚠️ Veritabanı BOŞ!');
      console.log('\n🔧 ÇÖZÜM:');
      console.log('1. Veri yüklemek için: node initial-load.js');
      console.log('2. Veya tarayıcıdan: https://teppek.com/api/adzuna-massive?mode=fetch&initial=true&country=gb');
      return;
    }
    
    // Ülke bazında dağılım
    const { data: countries, error: countriesError } = await supabase
      .from('listings')
      .select('location_country')
      .limit(1000);
    
    if (countries) {
      const countryStats = {};
      countries.forEach(item => {
        countryStats[item.location_country] = (countryStats[item.location_country] || 0) + 1;
      });
      
      console.log('\n📍 Ülke Dağılımı (ilk 1000 ilan):');
      Object.entries(countryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([country, count]) => {
          console.log(`  ${country}: ${count} ilan`);
        });
    }
    
    // Son eklenen ilanlar
    const { data: recentListings, error: recentError } = await supabase
      .from('listings')
      .select('title, location_country, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentListings && recentListings.length > 0) {
      console.log('\n📅 Son eklenen 5 ilan:');
      recentListings.forEach((job, index) => {
        const date = new Date(job.created_at).toLocaleString('tr-TR');
        console.log(`  ${index + 1}. [${job.location_country}] ${job.title.substring(0, 50)}... (${date})`);
      });
    }
    
    console.log('\n✅ Veritabanı DOLU ve çalışıyor!');
    
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error);
  }
}

checkDatabase();

// Çalıştırma: node check-database.js