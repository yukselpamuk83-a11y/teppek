#!/usr/bin/env node

/**
 * ADZUNA 50K COMPLETE DATA COLLECTOR
 * 
 * Tüm ülkelerden 50,000 ilan çeker
 * 5 API key ile rate limiting'e dikkat eder
 * Marker ve popup için gerekli tüm veriyi içerir
 * Supabase DB formatında JSON output verir
 */

const fs = require('fs');
const fetch = globalThis.fetch || require('node-fetch');

// API Rate Limits (Adzuna Documentation)
const DAILY_LIMIT = 1000;   // Her API key için günlük limit
const REQUESTS_PER_SECOND = 4; // Saniye başına max request
const DELAY_BETWEEN_REQUESTS = 300; // 300ms = 0.3s delay

// 5 API Key
const API_KEYS = [
  { app_id: 'a19dd595', app_key: '0ca6f72f3a5cafae1643cfae18100181' },
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' },
  { app_id: 'a19dd595', app_key: '1a2a55f9ad16c54c2b2e8efa67151f39' },
  { app_id: 'a19dd595', app_key: '739d1471fef22292b75f15b401556bdb' },
  { app_id: 'a19dd595', app_key: 'b7e0a6d929446aa1b9610dc3f8d22dd8' }
];

// TÜM AKTIF ÜLKELER (discovery tool ile bulunan 19 ülke)
const COUNTRIES = ['at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'es', 'fr', 'gb', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'sg', 'us', 'za'];

// Target: 50,000 jobs total (~2,600 per country)
const TARGET_JOBS = 50000;
const JOBS_PER_COUNTRY = Math.ceil(TARGET_JOBS / COUNTRIES.length);
const MAX_PAGES_PER_COUNTRY = Math.ceil(JOBS_PER_COUNTRY / 50); // 50 results per page

let currentKeyIndex = 0;
let requestCount = 0;
let totalJobs = [];

// Rate limiting için delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced currency mapping - 19 aktif ülke
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

// API Key rotation with usage tracking
function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// Enhanced Adzuna API call with better parameters
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
  
  console.log(`🔍 ${country.toUpperCase()} - Page ${page}/${MAX_PAGES_PER_COUNTRY} - Key ${currentKeyIndex}/5`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log(`⚠️  Rate limit hit for ${country}, switching key and waiting...`);
        await delay(5000); // 5 saniye bekle
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

// Enhanced job formatting with complete popup/marker data
function formatJobForDB(job, country) {
  // Strict validation for quality data
  if (!job.id || !job.title || !job.redirect_url || 
      !job.latitude || !job.longitude || 
      (!job.salary_min && !job.salary_max)) {
    return null;
  }
  
  // Salary validation
  const salaryMin = job.salary_min || 0;
  const salaryMax = job.salary_max || 0;
  
  // Skip only very low salaries (less than $7)
  if (salaryMin < 7 && salaryMax < 7) {
    return null;
  }
  
  // Title quality check
  if (job.title.length < 5 || job.title.length > 500) {
    return null;
  }

  // Enhanced city extraction with better parsing
  let city = null;
  if (job.location?.display_name) {
    const locationParts = job.location.display_name.split(',').map(s => s.trim());
    // Try to get the most specific location (usually first part)
    city = locationParts[0];
    
    // If first part looks like a country/state code, try second part
    if (city && city.length <= 2) {
      city = locationParts[1] || locationParts[0];
    }
  } else if (Array.isArray(job.location?.area) && job.location.area.length > 0) {
    city = job.location.area[job.location.area.length - 1];
  }

  // Enhanced remote detection with multiple patterns
  const titleLower = job.title.toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const isRemote = titleLower.includes('remote') || 
                   titleLower.includes('work from home') ||
                   titleLower.includes('wfh') ||
                   titleLower.includes('telecommute') ||
                   descLower.includes('remote work') ||
                   descLower.includes('work from home') ||
                   descLower.includes('100% remote');

  // Enhanced description processing for popup display
  let description = null;
  if (job.description) {
    // Clean HTML and format for popup display
    description = job.description
      .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
      .replace(/<p>/gi, '\n')         // Convert <p> to newlines  
      .replace(/<\/p>/gi, '')         // Remove </p>
      .replace(/<[^>]*>/g, '')        // Remove all other HTML tags
      .replace(/&nbsp;/g, ' ')        // Replace &nbsp; with space
      .replace(/&amp;/g, '&')         // Replace &amp; with &
      .replace(/&lt;/g, '<')          // Replace &lt; with <
      .replace(/&gt;/g, '>')          // Replace &gt; with >
      .replace(/&quot;/g, '"')        // Replace &quot; with "
      .replace(/&#39;/g, "'")         // Replace &#39; with '
      .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n')      // Replace multiple newlines with single
      .trim();
    
    // Quality checks for description
    if (description.length < 100) {
      description = null; // Too short, probably not useful
    } else if (description.length > 2000) {
      description = description.substring(0, 2000).trim(); // Trim to DB limit
    }
    
    // Skip generic/useless descriptions
    const genericPhrases = [
      'job description not available',
      'no description provided',
      'description coming soon',
      'apply now',
      'click here'
    ];
    
    const descLowerCheck = description ? description.toLowerCase() : '';
    if (genericPhrases.some(phrase => descLowerCheck.includes(phrase))) {
      description = null;
    }
  }

  // Enhanced company name processing
  let company = null;
  if (job.company?.display_name) {
    company = job.company.display_name
      .substring(0, 200)
      .trim()
      .replace(/\s+/g, ' '); // Clean up extra spaces
  }

  // Create complete job object for DB and popup/marker display
  return {
    adzuna_id: job.id.toString(),
    title: job.title.substring(0, 500).trim(), // Match DB schema exactly
    company: company,
    country: country.toUpperCase(),
    city: city?.substring(0, 100) || null, // Match DB schema exactly
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
    // Standard DB fields
    created_at: new Date().toISOString(),
    contact: null, // Adzuna jobs don't have direct contact
    user_id: null,
    created_by: null
  };
}

// Main data collection function - Optimized for 50K jobs
async function collectAllJobs() {
  console.log('🚀 Starting 50K COMPLETE data collection...');
  console.log(`📊 Countries: ${COUNTRIES.length}`);
  console.log(`🔑 API Keys: ${API_KEYS.length}`);
  console.log(`🎯 Target: ${TARGET_JOBS.toLocaleString()} jobs`);
  console.log(`📄 Jobs per country: ~${JOBS_PER_COUNTRY}`);
  console.log(`📋 Max pages per country: ${MAX_PAGES_PER_COUNTRY}`);
  console.log(`⏰ Max days old: 30`);
  console.log(`💰 Only jobs with salary data`);
  console.log(`🎪 Complete popup/marker data included`);
  
  for (const country of COUNTRIES) {
    console.log(`\n🌍 Processing ${country.toUpperCase()}...`);
    
    let page = 1;
    let hasMorePages = true;
    let countryJobs = [];
    
    // Collect up to target jobs per country
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
        
        // Stop if we've reached country target
        if (countryJobs.length >= JOBS_PER_COUNTRY) {
          break;
        }
      }
      
      const newJobs = countryJobs.length - prevCount;
      console.log(`   📄 Page ${page}: ${data.results.length} raw → ${newJobs} formatted → ${countryJobs.length} total`);
      
      // Pagination check
      if (data.results.length < 50) {
        hasMorePages = false;
      }
      
      page++;
      
      // Rate limiting
      await delay(DELAY_BETWEEN_REQUESTS);
      
      // Progress reporting
      if (requestCount % 50 === 0) {
        const totalCollected = totalJobs.length + countryJobs.length;
        const progress = ((totalCollected / TARGET_JOBS) * 100).toFixed(1);
        console.log(`📊 Progress: ${totalCollected.toLocaleString()}/${TARGET_JOBS.toLocaleString()} jobs (${progress}%)`);
      }
    }
    
    // Add country jobs to total
    totalJobs = totalJobs.concat(countryJobs);
    
    console.log(`✅ ${country.toUpperCase()} completed: ${countryJobs.length} jobs`);
    console.log(`📊 Total collected: ${totalJobs.length.toLocaleString()}/${TARGET_JOBS.toLocaleString()}`);
    
    // Stop if we've reached our target
    if (totalJobs.length >= TARGET_JOBS) {
      console.log(`🎯 Target reached: ${TARGET_JOBS.toLocaleString()} jobs collected!`);
      break;
    }
  }
  
  return totalJobs.slice(0, TARGET_JOBS); // Ensure exactly target number
}

// Main execution with enhanced reporting
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 ADZUNA 50K COMPLETE DATA COLLECTION');
    console.log('=====================================');
    
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
    console.log(`API keys used: ${API_KEYS.length}`);
    console.log(`Target achievement: ${((uniqueJobs.length / TARGET_JOBS) * 100).toFixed(1)}%`);
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`Duration: ${duration} minutes`);
    
    // Save to JSON file
    const outputFile = `adzuna-50k-complete-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(uniqueJobs, null, 2), 'utf8');
    
    console.log(`\n💾 Data saved to: ${outputFile}`);
    console.log(`📦 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Enhanced statistics
    const countryStats = {};
    const salaryStats = { withSalary: 0, totalSalarySum: 0 };
    const currencyStats = {};
    let remoteCount = 0;
    let withDescription = 0;
    
    uniqueJobs.forEach(job => {
      // Country stats
      countryStats[job.country] = (countryStats[job.country] || 0) + 1;
      
      // Salary stats
      if (job.salary_min && job.salary_max) {
        salaryStats.withSalary++;
        salaryStats.totalSalarySum += (job.salary_min + job.salary_max) / 2;
      }
      
      // Currency stats
      currencyStats[job.currency] = (currencyStats[job.currency] || 0) + 1;
      
      // Remote count
      if (job.remote) remoteCount++;
      
      // Description count
      if (job.description) withDescription++;
    });
    
    console.log('\n🌍 COUNTRY BREAKDOWN');
    console.log('===================');
    Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([country, count]) => {
        console.log(`${country}: ${count.toLocaleString()} jobs`);
      });
    
    console.log('\n💰 DATA QUALITY METRICS');
    console.log('=======================');
    console.log(`Jobs with salary: ${salaryStats.withSalary.toLocaleString()} (${((salaryStats.withSalary/uniqueJobs.length)*100).toFixed(1)}%)`);
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
      
    console.log('\n✅ Collection completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Import this data to Supabase using restore API');
    console.log('2. Run generate-map-data-v2 API to create bucket data');
    console.log('3. Test the enhanced popup/marker system');
    console.log('4. Deploy to production');
    
  } catch (error) {
    console.error('❌ Collection failed:', error);
    console.log(`📊 Jobs collected before failure: ${totalJobs.length.toLocaleString()}`);
    process.exit(1);
  }
}

// Enhanced process termination handling
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted by user');
  console.log(`📊 Jobs collected so far: ${totalJobs.length.toLocaleString()}`);
  console.log('💾 Saving partial data...');
  
  if (totalJobs.length > 0) {
    const outputFile = `adzuna-partial-${totalJobs.length}-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(totalJobs, null, 2), 'utf8');
    console.log(`💾 Partial data saved to: ${outputFile}`);
  }
  
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, collectAllJobs, formatJobForDB };