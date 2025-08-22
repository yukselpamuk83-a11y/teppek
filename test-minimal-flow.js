#!/usr/bin/env node

// MINIMAL DATA FLOW TEST
// 1. Supabase'de minimal tabloyu oluştur
// 2. Birkaç ülkeden minimal veri çek
// 3. Frontend'in doğru çalıştığını test et

const API_BASE = 'https://teppek.com/api';

async function testMinimalFlow() {
  console.log('🧪 MINIMAL DATA FLOW TEST');
  console.log('=========================\n');

  // 1. Database bağlantısı test et
  console.log('1️⃣ Database bağlantısı test ediliyor...');
  try {
    const dbResponse = await fetch(`${API_BASE}/db-test`);
    const dbResult = await dbResponse.json();
    
    if (dbResult.success) {
      console.log('✅ Database bağlantısı OK\n');
    } else {
      console.log('❌ Database bağlantısı başarısız:', dbResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ Database test hatası:', error.message);
    return;
  }

  // 2. Minimal veri yükleme (sadece 3 ülke, 2 sayfa)
  console.log('2️⃣ Minimal veri yükleniyor (GB, US, DE - son 7 gün)...');
  try {
    const loadUrl = `${API_BASE}/load-data?countries=gb,us,de&days=7&pages=2`;
    console.log(`API: ${loadUrl}`);
    
    const loadResponse = await fetch(loadUrl);
    const loadResult = await loadResponse.json();
    
    if (loadResult.success) {
      console.log(`✅ ${loadResult.summary.total_inserted} ilan yüklendi`);
      console.log(`📞 ${loadResult.summary.api_calls} API çağrısı yapıldı`);
      
      // Ülke dağılımı
      Object.entries(loadResult.summary.by_country).forEach(([country, count]) => {
        console.log(`   ${country.toUpperCase()}: ${count} ilan`);
      });
      console.log('');
    } else {
      console.log('❌ Veri yükleme hatası:', loadResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ Veri yükleme network hatası:', error.message);
    return;
  }

  // 3. Veri okuma testi
  console.log('3️⃣ Database\'den veri okuma test ediliyor...');
  try {
    const getResponse = await fetch(`${API_BASE}/get-jobs?limit=50`);
    const getResult = await getResponse.json();
    
    if (getResult.success && getResult.jobs) {
      console.log(`✅ ${getResult.jobs.length} ilan okundu`);
      console.log(`📊 Toplam database'de: ${getResult.stats.total_jobs} ilan`);
      
      // İlk ilanın yapısını kontrol et
      if (getResult.jobs.length > 0) {
        const firstJob = getResult.jobs[0];
        console.log('\n📝 İlk ilan yapısı:');
        console.log(`   ID: ${firstJob.adzuna_id}`);
        console.log(`   Title: ${firstJob.title}`);
        console.log(`   Company: ${firstJob.company || 'N/A'}`);
        console.log(`   Location: ${firstJob.lat}, ${firstJob.lon}`);
        console.log(`   Country: ${firstJob.country}`);
        console.log(`   City: ${firstJob.city || 'N/A'}`);
        console.log(`   Remote: ${firstJob.remote}`);
        console.log(`   Salary: ${firstJob.salary_min || 'N/A'} - ${firstJob.salary_max || 'N/A'} ${firstJob.currency}`);
        console.log(`   URL: ${firstJob.url}`);
      }
      
      // İstatistikler
      const remoteCount = getResult.jobs.filter(job => job.remote).length;
      const withSalaryCount = getResult.jobs.filter(job => job.salary_min).length;
      const countries = [...new Set(getResult.jobs.map(job => job.country))];
      
      console.log('\n📈 Önemli istatistikler:');
      console.log(`   🏠 Remote işler: ${remoteCount}`);
      console.log(`   💰 Maaşlı ilanlar: ${withSalaryCount}`);
      console.log(`   🌍 Ülkeler: ${countries.join(', ')}`);
      
    } else {
      console.log('❌ Veri okuma hatası:', getResult.error || 'Jobs array bulunamadı');
    }
  } catch (error) {
    console.log('❌ Veri okuma network hatası:', error.message);
  }

  console.log('\n🎉 Minimal data flow test tamamlandı!');
  console.log('\n💡 Sonraki adımlar:');
  console.log('   1. create-tables.sql dosyasını Supabase\'de çalıştırın');
  console.log('   2. index.html sayfasını açın');
  console.log('   3. Console\'da verilerin yüklendiğini kontrol edin');
}

// Test çalıştır
testMinimalFlow().catch(console.error);