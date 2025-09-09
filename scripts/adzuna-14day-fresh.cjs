#!/usr/bin/env node

/**
 * ADZUNA 30-DAY QUALITY DATA COLLECTOR
 * 
 * Tüm ülkelerden son 30 günün maaşlı ilanlarını çeker
 * 5 API key ile rate limiting'e dikkat eder
 * Supabase DB formatında JSON output verir
 */

const fs = require('fs');
// Node.js 18+ built-in fetch kullan
const fetch = globalThis.fetch || require('node-fetch');

// API Rate Limits (Adzuna Documentation)
const DAILY_LIMIT = 1000;   // Her API key için günlük limit
const REQUESTS_PER_SECOND = 4; // Saniye başına max request
const DELAY_BETWEEN_REQUESTS = 300; // 300ms = 0.3s delay

// 5 API Key (Senin Vercel panelinden)
const API_KEYS = [
  { app_id: 'a19dd595', app_key: '0ca6f72f3a5cafae1643cfae18100181' },
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' },
  { app_id: 'a19dd595', app_key: '1a2a55f9ad16c54c2b2e8efa67151f39' },
  { app_id: 'a19dd595', app_key: '739d1471fef22292b75f15b401556bdb' },
  { app_id: 'a19dd595', app_key: 'b7e0a6d929446aa1b9610dc3f8d22dd8' }
];

// TÜM AKTIF ÜLKELER (discovery tool ile bulunan 19 ülke)
const COUNTRIES = ['at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'es', 'fr', 'gb', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'sg', 'us', 'za'];

// Supabase DB columns için mapping
const JOB_COLUMNS = [
  'adzuna_id', 'title', 'company', 'country', 'city', 
  'lat', 'lon', 'url', 'salary_min', 'salary_max', 
  'currency', 'remote', 'source', 'icon_type', 'description'
];

let currentKeyIndex = 0;
let requestCount = 0;
let totalJobs = [];

// Rate limiting için delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ülkeye göre currency mapping - 19 aktif ülke
function getCurrencyByCountry(country) {
  const currencyMap = {
    'at': 'EUR', // Austria
    'au': 'AUD', // Australia
    'be': 'EUR', // Belgium
    'br': 'BRL', // Brazil
    'ca': 'CAD', // Canada
    'ch': 'CHF', // Switzerland
    'de': 'EUR', // Germany
    'es': 'EUR', // Spain
    'fr': 'EUR', // France
    'gb': 'GBP', // United Kingdom
    'in': 'INR', // India
    'it': 'EUR', // Italy
    'mx': 'MXN', // Mexico
    'nl': 'EUR', // Netherlands
    'nz': 'NZD', // New Zealand
    'pl': 'PLN', // Poland
    'sg': 'SGD', // Singapore
    'us': 'USD', // United States
    'za': 'ZAR'  // South Africa
  };
  return currencyMap[country.toLowerCase()] || 'USD';
}

// API Key rotation
function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// Adzuna API'den veri çek - Son 14 gün
async function fetchCountryJobs(country, page = 1) {
  const apiKey = getNextApiKey();
  
  // Son 20 gün parametreler (duplicate kontrol sonradan)
  const params = new URLSearchParams({
    app_id: apiKey.app_id,
    app_key: apiKey.app_key,
    results_per_page: '50',
    sort_by: 'date',
    max_days_old: '20',  // Son 20 gün
    salary_min: '1',
    salary_max: '999999',
    what_exclude: 'internship volunteer unpaid commission freelance'
  });

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
  
  console.log(`🔍 ${country.toUpperCase()} - Page ${page} - Key ${currentKeyIndex}/5`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log(`⚠️  Rate limit hit for ${country}, switching key...`);
        await delay(2000); // 2 saniye bekle
        return await fetchCountryJobs(country, page); // Yeni key ile tekrar dene
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    requestCount++;
    
    return data;
    
  } catch (error) {
    console.error(`❌ Error fetching ${country} page ${page}:`, error.message);
    return { results: [], count: 0 };
  }
}

// Job verisini DB formatına çevir
function formatJobForDB(job, country) {
  // Validation - maaş verisi zorunlu
  if (!job.id || !job.title || !job.redirect_url || !job.latitude || !job.longitude || !job.salary_min || !job.salary_max) {
    return null;
  }
  
  // Fake ilanları filtrele (çok düşük maaş)
  if (job.salary_min < 5 || job.salary_max < 5) {
    return null;
  }
  
  if (job.title.length < 5) {
    return null;
  }

  // City bilgisi çıkar
  let city = null;
  if (job.location?.display_name) {
    city = job.location.display_name.split(',')[0].trim();
  } else if (Array.isArray(job.location?.area) && job.location.area.length > 0) {
    city = job.location.area[job.location.area.length - 1];
  }

  // Remote check
  const isRemote = job.title.toLowerCase().includes('remote') || 
                   job.title.toLowerCase().includes('work from home');

  return {
    adzuna_id: job.id.toString(),
    title: job.title.substring(0, 200).trim(),
    company: job.company?.display_name?.substring(0, 100) || null,
    country: country.toUpperCase(),
    city: city?.substring(0, 50) || null,
    lat: parseFloat(job.latitude),
    lon: parseFloat(job.longitude),
    url: job.redirect_url,
    salary_min: Math.round(job.salary_min || 0),
    salary_max: Math.round(job.salary_max || 0),
    currency: job.salary_currency?.substring(0, 3) || getCurrencyByCountry(country),
    remote: isRemote,
    source: 'adzuna',
    icon_type: 'job',
    description: job.description?.substring(0, 2000).trim() || null
  };
}

// Ana veri çekme fonksiyonu
async function collectAllJobs() {
  console.log('🚀 Starting 20-DAY COMPLETE data collection...');
  console.log(`📊 Countries: ${COUNTRIES.length}`);
  console.log(`🔑 API Keys: ${API_KEYS.length}`);
  console.log(`⏰ Max days old: 20`);
  console.log(`💰 Only jobs with salary data`);
  console.log(`📋 ALL DB fields included`);
  
  for (const country of COUNTRIES) {
    console.log(`\n🌍 Processing ${country.toUpperCase()}...`);
    
    let page = 1;
    let hasMorePages = true;
    let countryJobs = [];
    
    while (hasMorePages && page <= 100) { // Max 100 sayfa (5000 job per country - 50k total)
      const data = await fetchCountryJobs(country, page);
      
      if (!data.results || data.results.length === 0) {
        hasMorePages = false;
        break;
      }
      
      // Jobs'ları formatla ve filtrele
      const prevCount = countryJobs.length;
      for (const job of data.results) {
        const formattedJob = formatJobForDB(job, country);
        if (formattedJob) {
          countryJobs.push(formattedJob);
        }
      }
      
      console.log(`   📄 Page ${page}: ${data.results.length} jobs, formatted: ${countryJobs.length - prevCount}`);
      
      // Pagination check
      if (data.results.length < 50) {
        hasMorePages = false;
      }
      
      page++;
      totalJobs = totalJobs.concat(countryJobs.slice(totalJobs.length));
      
      // Rate limiting
      await delay(DELAY_BETWEEN_REQUESTS);
      
      // Request count kontrol
      if (requestCount % 100 === 0) {
        console.log(`📊 Progress: ${requestCount} requests, ${totalJobs.length} jobs collected`);
      }
    }
    
    console.log(`✅ ${country.toUpperCase()} completed: ${countryJobs.length} jobs`);
  }
  
  return totalJobs;
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 ADZUNA 14-DAY FRESH DATA COLLECTION');
    console.log('=====================================');
    
    const jobs = await collectAllJobs();
    
    // Duplicate check
    const uniqueJobs = [];
    const seenIds = new Set();
    
    for (const job of jobs) {
      if (!seenIds.has(job.adzuna_id)) {
        seenIds.add(job.adzuna_id);
        uniqueJobs.push(job);
      }
    }
    
    console.log('\n📊 COLLECTION SUMMARY');
    console.log('====================');
    console.log(`Total requests: ${requestCount}`);
    console.log(`Total jobs collected: ${jobs.length}`);
    console.log(`Unique jobs: ${uniqueJobs.length}`);
    console.log(`Duplicates removed: ${jobs.length - uniqueJobs.length}`);
    console.log(`Countries processed: ${COUNTRIES.length}`);
    console.log(`API keys used: ${API_KEYS.length}`);
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`Duration: ${duration} minutes`);
    
    // JSON dosyasına kaydet
    const outputFile = `adzuna-20day-complete-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(uniqueJobs, null, 2), 'utf8');
    
    console.log(`\n💾 Data saved to: ${outputFile}`);
    console.log(`📦 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    // İstatistikler
    const countryStats = {};
    uniqueJobs.forEach(job => {
      countryStats[job.country] = (countryStats[job.country] || 0) + 1;
    });
    
    console.log('\n🌍 COUNTRY BREAKDOWN');
    console.log('===================');
    Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([country, count]) => {
        console.log(`${country}: ${count} jobs`);
      });
      
    console.log('\n✅ Collection completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Import this data to Supabase');
    console.log('2. Run generate-map-data API');
    console.log('3. Test the optimized system');
    
  } catch (error) {
    console.error('❌ Collection failed:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted by user');
  console.log(`📊 Jobs collected so far: ${totalJobs.length}`);
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, collectAllJobs, formatJobForDB };