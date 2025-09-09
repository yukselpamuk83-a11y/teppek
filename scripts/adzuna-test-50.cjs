#!/usr/bin/env node

/**
 * ADZUNA TEST - 50 ILAN
 * 
 * Hızlı test için 50 ilan çeker
 * Marker ve popup için gerekli tüm veriyi içerir
 */

const fs = require('fs');
const fetch = globalThis.fetch || require('node-fetch');

// API Rate Limits
const DELAY_BETWEEN_REQUESTS = 300; // 300ms delay

// 5 API Key
const API_KEYS = [
  { app_id: 'a19dd595', app_key: '0ca6f72f3a5cafae1643cfae18100181' },
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' },
  { app_id: 'a19dd595', app_key: '1a2a55f9ad16c54c2b2e8efa67151f39' },
  { app_id: 'a19dd595', app_key: '739d1471fef22292b75f15b401556bdb' },
  { app_id: 'a19dd595', app_key: 'b7e0a6d929446aa1b9610dc3f8d22dd8' }
];

// Test için birkaç ülke
const TEST_COUNTRIES = ['us', 'gb', 'de', 'ca', 'au'];

let currentKeyIndex = 0;
let requestCount = 0;
let totalJobs = [];

// Rate limiting için delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Currency mapping
function getCurrencyByCountry(country) {
  const currencyMap = {
    'us': 'USD', 'gb': 'GBP', 'de': 'EUR', 'ca': 'CAD', 'au': 'AUD',
    'at': 'EUR', 'be': 'EUR', 'br': 'BRL', 'ch': 'CHF', 'es': 'EUR',
    'fr': 'EUR', 'in': 'INR', 'it': 'EUR', 'mx': 'MXN', 'nl': 'EUR',
    'nz': 'NZD', 'pl': 'PLN', 'sg': 'SGD', 'za': 'ZAR'
  };
  return currencyMap[country.toLowerCase()] || 'USD';
}

// API Key rotation
function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// Adzuna API'den veri çek - Enhanced version
async function fetchCountryJobs(country, page = 1) {
  const apiKey = getNextApiKey();
  
  // Corrected parameters based on Adzuna API documentation
  const params = new URLSearchParams({
    app_id: apiKey.app_id,
    app_key: apiKey.app_key,
    results_per_page: '50',
    sort_by: 'date',
    max_days_old: '30',
    salary_min: '7',
    what_exclude: 'internship volunteer unpaid',
    full_time: '1',
    'content-type': 'application/json'
  });

  const url = `http://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
  
  console.log(`🔍 ${country.toUpperCase()} - Page ${page} - Key ${currentKeyIndex}/5`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log(`⚠️  Rate limit hit for ${country}, switching key...`);
        await delay(2000);
        return await fetchCountryJobs(country, page);
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

// Job verisini DB formatına çevir - Enhanced with all popup/marker data
function formatJobForDB(job, country) {
  // Enhanced validation
  if (!job.id || !job.title || !job.redirect_url || 
      !job.latitude || !job.longitude || 
      (!job.salary_min && !job.salary_max)) {
    return null;
  }
  
  // Salary validation - more lenient for testing
  const salaryMin = job.salary_min || 0;
  const salaryMax = job.salary_max || 0;
  
  // Skip only if both are very low (less than $7)
  if (salaryMin < 7 && salaryMax < 7) {
    return null;
  }
  
  if (job.title.length < 3) {
    return null;
  }

  // Enhanced city extraction
  let city = null;
  if (job.location?.display_name) {
    const locationParts = job.location.display_name.split(',');
    city = locationParts[0]?.trim();
  } else if (Array.isArray(job.location?.area) && job.location.area.length > 0) {
    city = job.location.area[job.location.area.length - 1];
  }

  // Enhanced remote detection
  const titleLower = job.title.toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const isRemote = titleLower.includes('remote') || 
                   titleLower.includes('work from home') ||
                   titleLower.includes('wfh') ||
                   descLower.includes('remote work') ||
                   descLower.includes('work from home');

  // Clean and format description for popup
  let description = null;
  if (job.description) {
    // Remove HTML tags and clean up
    description = job.description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&')  // Replace &amp; with &
      .replace(/&lt;/g, '<')   // Replace &lt; with <
      .replace(/&gt;/g, '>')   // Replace &gt; with >
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .trim();
    
    // Limit to 2000 chars for DB
    if (description.length > 2000) {
      description = description.substring(0, 2000).trim();
    }
    
    // Don't store if too short or generic
    if (description.length < 50 || 
        description.toLowerCase().includes('job description not available')) {
      description = null;
    }
  }

  // Enhanced company name extraction
  let company = null;
  if (job.company?.display_name) {
    company = job.company.display_name.substring(0, 200).trim();
  }

  return {
    adzuna_id: job.id.toString(),
    title: job.title.substring(0, 500).trim(), // Match DB schema
    company: company,
    country: country.toUpperCase(),
    city: city?.substring(0, 100) || null, // Match DB schema
    lat: parseFloat(job.latitude),
    lon: parseFloat(job.longitude),
    url: job.redirect_url,
    salary_min: Math.round(salaryMin),
    salary_max: Math.round(salaryMax),
    currency: job.salary_currency?.substring(0, 3) || getCurrencyByCountry(country),
    remote: isRemote,
    source: 'adzuna',
    icon_type: 'job',
    description: description,
    // Additional fields for enhanced popup/marker display
    created_at: new Date().toISOString(),
    contact: null, // Will be null for Adzuna jobs
    user_id: null,
    created_by: null
  };
}

// Test veri çekme - sadece 50 job
async function collectTestJobs() {
  console.log('🚀 Starting TEST collection - 50 jobs...');
  console.log(`📊 Test Countries: ${TEST_COUNTRIES.length}`);
  console.log(`🔑 API Keys: ${API_KEYS.length}`);
  console.log(`🎯 Target: 50 jobs total`);
  
  for (const country of TEST_COUNTRIES) {
    console.log(`\n🌍 Processing ${country.toUpperCase()}...`);
    
    // Sadece 1 sayfa çek (50 job)
    const data = await fetchCountryJobs(country, 1);
    
    if (!data.results || data.results.length === 0) {
      console.log(`   ❌ No results for ${country}`);
      continue;
    }
    
    // Jobs'ları formatla ve filtrele
    let countryJobs = [];
    for (const job of data.results) {
      const formattedJob = formatJobForDB(job, country);
      if (formattedJob) {
        countryJobs.push(formattedJob);
      }
      
      // 50 job'a ulaştık mı?
      if (totalJobs.length + countryJobs.length >= 50) {
        countryJobs = countryJobs.slice(0, 50 - totalJobs.length);
        break;
      }
    }
    
    totalJobs = totalJobs.concat(countryJobs);
    
    console.log(`   ✅ ${country.toUpperCase()}: ${countryJobs.length} jobs`);
    console.log(`   📊 Total collected: ${totalJobs.length}/50`);
    
    // Rate limiting
    await delay(DELAY_BETWEEN_REQUESTS);
    
    // 50'ye ulaştık mı?
    if (totalJobs.length >= 50) {
      console.log('🎯 Target reached: 50 jobs collected!');
      break;
    }
  }
  
  return totalJobs.slice(0, 50); // Kesin 50 job return et
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 ADZUNA TEST - 50 JOBS');
    console.log('========================');
    
    const jobs = await collectTestJobs();
    
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total requests: ${requestCount}`);
    console.log(`Jobs collected: ${jobs.length}`);
    console.log(`Countries processed: ${TEST_COUNTRIES.length}`);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Duration: ${duration} seconds`);
    
    // JSON dosyasına kaydet
    const outputFile = `adzuna-test-50-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(jobs, null, 2), 'utf8');
    
    console.log(`\n💾 Data saved to: ${outputFile}`);
    console.log(`📦 File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
    
    // İstatistikler
    const countryStats = {};
    jobs.forEach(job => {
      countryStats[job.country] = (countryStats[job.country] || 0) + 1;
    });
    
    console.log('\n🌍 COUNTRY BREAKDOWN');
    console.log('===================');
    Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([country, count]) => {
        console.log(`${country}: ${count} jobs`);
      });
      
    // Sample job göster
    if (jobs.length > 0) {
      console.log('\n📋 SAMPLE JOB DATA');
      console.log('==================');
      const sampleJob = jobs[0];
      console.log(`Title: ${sampleJob.title}`);
      console.log(`Company: ${sampleJob.company}`);
      console.log(`Location: ${sampleJob.city}, ${sampleJob.country}`);
      console.log(`Salary: ${sampleJob.currency} ${sampleJob.salary_min} - ${sampleJob.salary_max}`);
      console.log(`URL: ${sampleJob.url}`);
      console.log(`Description: ${sampleJob.description ? sampleJob.description.substring(0, 100) + '...' : 'N/A'}`);
    }
      
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
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

module.exports = { main, collectTestJobs, formatJobForDB };