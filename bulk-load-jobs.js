#!/usr/bin/env node

// BULK JOB LOADER - Tüm ülkelerden son 7 günün ilanlarını çek
// Kullanım: node bulk-load-jobs.js

const API_BASE = 'https://teppek.com/api'; // Prod URL
// const API_BASE = 'http://localhost:3000/api'; // Local development

const COUNTRIES = [
  'gb', 'us', 'de', 'fr', 'ca', 'au', 'nl', 'it', 'es', 'sg', 
  'at', 'be', 'br', 'ch', 'in', 'mx', 'nz', 'pl', 'ru', 'za'
];

async function loadAllCountries() {
  console.log(`🌍 Starting bulk load for ${COUNTRIES.length} countries...`);
  console.log(`📅 Fetching last 7 days of job listings`);
  console.log(`🎯 Target: ~10,000 quality job listings`);
  console.log('');

  const startTime = Date.now();
  
  try {
    // Tüm ülkeleri tek seferde yükle
    const countriesParam = COUNTRIES.join(',');
    const url = `${API_BASE}/load-data?countries=${countriesParam}&days=7&pages=10`;
    
    console.log(`🚀 API Call: ${url}`);
    
    const response = await fetch(url);
    const result = await response.json();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (result.success) {
      console.log('\n✅ BULK LOAD COMPLETED SUCCESSFULLY!');
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`📊 Total Jobs Loaded: ${result.summary.total_inserted}`);
      console.log(`🌍 Countries Processed: ${Object.keys(result.summary.by_country).length}`);
      console.log(`📞 API Calls Made: ${result.summary.api_calls}`);
      
      console.log('\n📈 BREAKDOWN BY COUNTRY:');
      Object.entries(result.summary.by_country)
        .sort((a, b) => b[1] - a[1]) // En çok ilana sahip ülkeler önce
        .forEach(([country, count]) => {
          const flag = getCountryFlag(country);
          console.log(`  ${flag} ${country.toUpperCase()}: ${count} jobs`);
        });
      
      if (result.summary.errors.length > 0) {
        console.log(`\n⚠️  Errors (${result.summary.errors.length}):`);
        result.summary.errors.slice(0, 5).forEach(error => {
          console.log(`  - ${error}`);
        });
        if (result.summary.errors.length > 5) {
          console.log(`  ... and ${result.summary.errors.length - 5} more`);
        }
      }
      
    } else {
      console.error('❌ BULK LOAD FAILED');
      console.error('Error:', result.error);
      if (result.summary) {
        console.log('Partial results:', result.summary);
      }
    }
    
  } catch (error) {
    console.error('❌ Network/API Error:', error.message);
  }
}

function getCountryFlag(countryCode) {
  const flags = {
    'gb': '🇬🇧', 'us': '🇺🇸', 'de': '🇩🇪', 'fr': '🇫🇷', 'ca': '🇨🇦',
    'au': '🇦🇺', 'nl': '🇳🇱', 'it': '🇮🇹', 'es': '🇪🇸', 'sg': '🇸🇬',
    'at': '🇦🇹', 'be': '🇧🇪', 'br': '🇧🇷', 'ch': '🇨🇭', 'in': '🇮🇳',
    'mx': '🇲🇽', 'nz': '🇳🇿', 'pl': '🇵🇱', 'ru': '🇷🇺', 'za': '🇿🇦'
  };
  return flags[countryCode.toLowerCase()] || '🏳️';
}

// Script çalıştır
if (require.main === module) {
  loadAllCountries();
}

module.exports = { loadAllCountries };