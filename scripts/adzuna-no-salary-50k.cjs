#!/usr/bin/env node

/**
 * ADZUNA ZERO-SALARY 50K COLLECTOR
 * 
 * Maaş bilgisi olmayan 50,000 ilan çeker
 * Önceki 27K ile birleştirmek için
 * Tüm ülkelerden comprehensive data
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

// TÜM AKTIF ÜLKELER
const COUNTRIES = ['at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'es', 'fr', 'gb', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'sg', 'us', 'za'];

// Target: 50,000 jobs without salary requirements
const TARGET_JOBS = 50000;
const JOBS_PER_COUNTRY = Math.ceil(TARGET_JOBS / COUNTRIES.length);
const MAX_PAGES_PER_COUNTRY = Math.ceil(JOBS_PER_COUNTRY / 50);

let currentKeyIndex = 0;
let requestCount = 0;
let totalJobs = [];

// Rate limiting için delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Currency mapping
function getCurrencyByCountry(country) {
  const currencyMap = {
    'at': 'EUR', 'au': 'AUD', 'be': 'EUR', 'br': 'BRL', 'ca': 'CAD',
    'ch': 'CHF', 'de': 'EUR', 'es': 'EUR', 'fr': 'EUR', 'gb': 'GBP',
    'in': 'INR', 'it': 'EUR', 'mx': 'MXN', 'nl': 'EUR', 'nz': 'NZD',
    'pl': 'PLN', 'sg': 'SGD', 'us': 'USD', 'za': 'ZAR'
  };
  return currencyMap[country.toLowerCase()] || 'USD';
}

// API Key rotation
function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// Adzuna API call - NO salary requirements
async function fetchCountryJobs(country, page = 1) {
  const apiKey = getNextApiKey();
  
  // ONLY jobs WITHOUT salary info - exclude salary jobs
  const params = new URLSearchParams({
    app_id: apiKey.app_id,
    app_key: apiKey.app_key,
    results_per_page: '50',
    sort_by: 'date',
    max_days_old: '30',
    what_exclude: 'internship volunteer unpaid',
    salary_include_unknown: '1', // Include jobs with unknown salary
    'content-type': 'application/json'
  });

  const url = `http://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
  
  console.log(`🔍 ${country.toUpperCase()} - Page ${page}/${MAX_PAGES_PER_COUNTRY} - Key ${currentKeyIndex}/5`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log(`⚠️  Rate limit hit for ${country}, switching key and waiting...`);
        await delay(5000);
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

// Job formatting - ONLY jobs WITHOUT salary info
function formatJobForDB(job, country) {
  // Basic validation
  if (!job.id || !job.title || !job.redirect_url || 
      !job.latitude || !job.longitude) {
    return null;
  }
  
  // FILTER OUT jobs with salary info - we only want no-salary jobs
  if (job.salary_min || job.salary_max) {
    return null; // Skip jobs with any salary info
  }
  
  // Title quality check
  if (job.title.length < 3 || job.title.length > 500) {
    return null;
  }

  // Enhanced city extraction
  let city = null;
  if (job.location?.display_name) {
    const locationParts = job.location.display_name.split(',').map(s => s.trim());
    city = locationParts[0];
    
    if (city && city.length <= 2) {
      city = locationParts[1] || locationParts[0];
    }
  } else if (Array.isArray(job.location?.area) && job.location.area.length > 0) {
    city = job.location.area[job.location.area.length - 1];
  }

  // Remote detection
  const titleLower = job.title.toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const isRemote = titleLower.includes('remote') || 
                   titleLower.includes('work from home') ||
                   titleLower.includes('wfh') ||
                   titleLower.includes('telecommute') ||
                   descLower.includes('remote work') ||
                   descLower.includes('work from home') ||
                   descLower.includes('100% remote');

  // Description processing
  let description = null;
  if (job.description) {
    description = job.description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>/gi, '\n')
      .replace(/<\/p>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    if (description.length < 100) {
      description = null;
    } else if (description.length > 2000) {
      description = description.substring(0, 2000).trim();
    }
    
    const genericPhrases = [
      'job description not available',
      'no description provided',
      'description coming soon'
    ];
    
    const descLowerCheck = description ? description.toLowerCase() : '';
    if (genericPhrases.some(phrase => descLowerCheck.includes(phrase))) {
      description = null;
    }
  }

  // Company name processing
  let company = null;
  if (job.company?.display_name) {
    company = job.company.display_name
      .substring(0, 200)
      .trim()
      .replace(/\s+/g, ' ');
  }

  // These jobs should NOT have salary info (we filtered them out above)
  const salaryMin = null;
  const salaryMax = null;

  return {
    adzuna_id: job.id.toString(),
    title: job.title.substring(0, 500).trim(),
    company: company,
    country: country.toUpperCase(),
    city: city?.substring(0, 100) || null,
    lat: parseFloat(job.latitude),
    lon: parseFloat(job.longitude),
    url: job.redirect_url,
    salary_min: null, // No salary jobs only
    salary_max: null, // No salary jobs only,
    currency: job.salary_currency?.substring(0, 3) || getCurrencyByCountry(country),
    remote: isRemote,
    source: 'adzuna',
    icon_type: 'job',
    description: description,
    created_at: new Date().toISOString(),
    contact: null,
    user_id: null,
    created_by: null
  };
}

// Main data collection - 50K without salary requirements
async function collectAllJobs() {
  console.log('🚀 Starting ZERO-SALARY 50K data collection...');
  console.log(`📊 Countries: ${COUNTRIES.length}`);
  console.log(`🔑 API Keys: ${API_KEYS.length}`);
  console.log(`🎯 Target: ${TARGET_JOBS.toLocaleString()} jobs`);
  console.log(`📄 Jobs per country: ~${JOBS_PER_COUNTRY}`);
  console.log(`📋 Max pages per country: ${MAX_PAGES_PER_COUNTRY}`);
  console.log(`⏰ Max days old: 30`);
  console.log(`💰 NO salary requirements - all jobs accepted`);
  console.log(`🎪 Complete popup/marker data included`);
  
  for (const country of COUNTRIES) {
    console.log(`\n🌍 Processing ${country.toUpperCase()}...`);
    
    let page = 1;
    let hasMorePages = true;
    let countryJobs = [];
    
    while (hasMorePages && page <= MAX_PAGES_PER_COUNTRY && countryJobs.length < JOBS_PER_COUNTRY) {
      const data = await fetchCountryJobs(country, page);
      
      if (!data.results || data.results.length === 0) {
        hasMorePages = false;
        break;
      }
      
      // Format and filter jobs
      const prevCount = countryJobs.length;
      for (const job of data.results) {
        const formattedJob = formatJobForDB(job, country);
        if (formattedJob) {
          countryJobs.push(formattedJob);
        }
        
        if (countryJobs.length >= JOBS_PER_COUNTRY) {
          break;
        }
      }
      
      const newJobs = countryJobs.length - prevCount;
      console.log(`   📄 Page ${page}: ${data.results.length} raw → ${newJobs} formatted → ${countryJobs.length} total`);
      
      if (data.results.length < 50) {
        hasMorePages = false;
      }
      
      page++;
      
      await delay(DELAY_BETWEEN_REQUESTS);
      
      if (requestCount % 50 === 0) {
        const totalCollected = totalJobs.length + countryJobs.length;
        const progress = ((totalCollected / TARGET_JOBS) * 100).toFixed(1);
        console.log(`📊 Progress: ${totalCollected.toLocaleString()}/${TARGET_JOBS.toLocaleString()} jobs (${progress}%)`);
      }
    }
    
    totalJobs = totalJobs.concat(countryJobs);
    
    console.log(`✅ ${country.toUpperCase()} completed: ${countryJobs.length} jobs`);
    console.log(`📊 Total collected: ${totalJobs.length.toLocaleString()}/${TARGET_JOBS.toLocaleString()}`);
    
    if (totalJobs.length >= TARGET_JOBS) {
      console.log(`🎯 Target reached: ${TARGET_JOBS.toLocaleString()} jobs collected!`);
      break;
    }
  }
  
  return totalJobs.slice(0, TARGET_JOBS);
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 ADZUNA ZERO-SALARY 50K DATA COLLECTION');
    console.log('======================================');
    
    const jobs = await collectAllJobs();
    
    // Enhanced duplicate removal
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
    console.log(`Total requests: ${requestCount.toLocaleString()}`);
    console.log(`Total jobs collected: ${jobs.length.toLocaleString()}`);
    console.log(`Unique jobs: ${uniqueJobs.length.toLocaleString()}`);
    console.log(`Duplicates removed: ${(jobs.length - uniqueJobs.length).toLocaleString()}`);
    console.log(`Countries processed: ${COUNTRIES.length}`);
    console.log(`Target achievement: ${((uniqueJobs.length / TARGET_JOBS) * 100).toFixed(1)}%`);
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`Duration: ${duration} minutes`);
    
    // Statistics
    const countryStats = {};
    const salaryStats = { withSalary: 0, withoutSalary: 0 };
    const currencyStats = {};
    let remoteCount = 0;
    let withDescription = 0;
    
    uniqueJobs.forEach(job => {
      countryStats[job.country] = (countryStats[job.country] || 0) + 1;
      
      if (job.salary_min && job.salary_max) {
        salaryStats.withSalary++;
      } else {
        salaryStats.withoutSalary++;
      }
      
      currencyStats[job.currency] = (currencyStats[job.currency] || 0) + 1;
      
      if (job.remote) remoteCount++;
      if (job.description) withDescription++;
    });
    
    // Save to JSON file
    const outputFile = `adzuna-zero-salary-50k-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(uniqueJobs, null, 2), 'utf8');
    
    console.log(`\n💾 Data saved to: ${outputFile}`);
    console.log(`📦 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🌍 COUNTRY BREAKDOWN');
    console.log('===================');
    Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([country, count]) => {
        console.log(`${country}: ${count.toLocaleString()} jobs`);
      });
    
    console.log('\n💰 SALARY STATISTICS');
    console.log('===================');
    console.log(`Jobs with salary: ${salaryStats.withSalary.toLocaleString()} (${((salaryStats.withSalary/uniqueJobs.length)*100).toFixed(1)}%)`);
    console.log(`Jobs without salary: ${salaryStats.withoutSalary.toLocaleString()} (${((salaryStats.withoutSalary/uniqueJobs.length)*100).toFixed(1)}%)`);
    console.log(`Jobs with description: ${withDescription.toLocaleString()} (${((withDescription/uniqueJobs.length)*100).toFixed(1)}%)`);
    console.log(`Remote jobs: ${remoteCount.toLocaleString()} (${((remoteCount/uniqueJobs.length)*100).toFixed(1)}%)`);
    
    console.log('\n💱 CURRENCY BREAKDOWN');
    console.log('====================');
    Object.entries(currencyStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([currency, count]) => {
        console.log(`${currency}: ${count.toLocaleString()} jobs`);
      });
      
    console.log('\n✅ ZERO-SALARY collection completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Merge this with previous 27K jobs');
    console.log('2. Import combined data to Supabase');
    console.log('3. Run generate-map-data-v2 API');
    console.log('4. Test comprehensive system');
    
  } catch (error) {
    console.error('❌ Collection failed:', error);
    console.log(`📊 Jobs collected before failure: ${totalJobs.length.toLocaleString()}`);
    process.exit(1);
  }
}

// Process termination handling
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted by user');
  console.log(`📊 Jobs collected so far: ${totalJobs.length.toLocaleString()}`);
  console.log('💾 Saving partial data...');
  
  if (totalJobs.length > 0) {
    const outputFile = `adzuna-zero-salary-partial-${totalJobs.length}-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(totalJobs, null, 2), 'utf8');
    console.log(`💾 Partial data saved to: ${outputFile}`);
  }
  
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { main, collectAllJobs, formatJobForDB };