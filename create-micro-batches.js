// Create very small SQL batches for Supabase SQL Editor
import fs from 'fs';

const backupPath = 'D:\\Yeni klasör\\map-data.geojson';
const outputDir = 'C:\\Users\\seher\\Desktop\\geoo\\micro-batches\\';

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📖 Reading backup file...');
const backupContent = fs.readFileSync(backupPath, 'utf8');
const backupData = JSON.parse(backupContent);

console.log(`📊 Found ${backupData.features.length} features to convert`);

// Function to escape SQL strings
function escapeSql(str) {
  if (!str) return 'NULL';
  return "'" + str.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Function to parse city/country from popup HTML
function parseLocation(popupHtml) {
  if (!popupHtml) return { city: null, country: null };
  
  const locationMatch = popupHtml.match(/<i class="fa-solid fa-location-dot"[^>]*><\/i>([^<]+)/);
  if (locationMatch) {
    const location = locationMatch[1].trim();
    const parts = location.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        city: parts[0],
        country: parts[parts.length - 1]
      };
    }
  }
  return { city: null, country: null };
}

// Function to detect remote job
function isRemoteJob(title, popupHtml) {
  const titleLower = (title || '').toLowerCase();
  const popupLower = (popupHtml || '').toLowerCase();
  
  return titleLower.includes('remote') || 
         titleLower.includes('work from home') ||
         popupLower.includes('remote');
}

// Create VERY small batches - only 25 records per file to stay under 500KB
const batchSize = 25;
const features = backupData.features;
let batchNumber = 1;

console.log('🔄 Creating micro batches...');

for (let i = 0; i < features.length; i += batchSize) {
  const batch = features.slice(i, i + batchSize);
  
  let fileContent = [];
  
  // Header
  fileContent.push(`-- Restore jobs from backup - Micro Batch ${batchNumber}`);
  fileContent.push(`-- Records ${i + 1}-${Math.min(i + batchSize, features.length)} of ${features.length}`);
  fileContent.push(`-- Generated on: ${new Date().toISOString()}`);
  fileContent.push('');
  
  // Single INSERT statement for this batch
  let insertStatement = 'INSERT INTO jobs (adzuna_id, title, company, lat, lon, url, country, city, remote, salary_min, salary_max, currency, created_at, contact, source, marker_html, popup_html, icon_type, created_by, user_id, location) VALUES\n';
  
  const values = [];
  
  for (const feature of batch) {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;
    
    // Skip invalid features
    if (!props.id || !props.title || !coords || coords.length !== 2) {
      continue;
    }
    
    // Parse location from popup
    const { city, country } = parseLocation(props.popup_html);
    
    // Check if remote
    const remote = isRemoteJob(props.title, props.popup_html);
    
    // Build VALUES row
    const row = [
      escapeSql(props.id.toString()), // adzuna_id
      escapeSql(props.title?.substring(0, 200)), // title
      escapeSql(props.company?.substring(0, 100)), // company
      coords[1], // lat
      coords[0], // lon
      escapeSql(props.url), // url
      escapeSql(country?.substring(0, 50)), // country
      escapeSql(city?.substring(0, 50)), // city
      remote, // remote
      props.salary_min || 'NULL', // salary_min
      props.salary_max || 'NULL', // salary_max
      escapeSql(props.currency?.substring(0, 3)), // currency
      "NOW()", // created_at
      'NULL', // contact
      escapeSql(props.source || 'adzuna'), // source
      'NULL', // marker_html
      escapeSql(props.popup_html), // popup_html
      'NULL', // icon_type
      'NULL', // created_by
      'NULL', // user_id
      'NULL' // location
    ];
    
    values.push(`  (${row.join(', ')})`);
  }
  
  if (values.length > 0) {
    insertStatement += values.join(',\n');
    insertStatement += '\nON CONFLICT (adzuna_id) DO NOTHING;';
    fileContent.push(insertStatement);
    fileContent.push('');
    
    // Add progress check query
    fileContent.push('-- Check progress');
    fileContent.push('SELECT COUNT(*) as total_restored FROM jobs WHERE source = \'adzuna\';');
  }
  
  // Write batch file
  const fileName = `batch-${String(batchNumber).padStart(3, '0')}.sql`;
  const filePath = outputDir + fileName;
  
  fs.writeFileSync(filePath, fileContent.join('\n'), 'utf8');
  
  const fileSize = Math.round(fs.statSync(filePath).size / 1024 * 100) / 100;
  console.log(`✅ Batch ${batchNumber}: ${fileName} (${fileSize} KB)`);
  
  batchNumber++;
}

const totalBatches = batchNumber - 1;

// Create a master verification file
let verifyContent = [];
verifyContent.push('-- Final verification queries');
verifyContent.push('-- Run this after all batches are completed');
verifyContent.push('');
verifyContent.push('SELECT COUNT(*) as total_jobs, source FROM jobs GROUP BY source;');
verifyContent.push('SELECT MIN(created_at) as first_restore, MAX(created_at) as last_restore FROM jobs WHERE source = \'adzuna\';');
verifyContent.push('SELECT country, COUNT(*) as job_count FROM jobs WHERE source = \'adzuna\' GROUP BY country ORDER BY job_count DESC LIMIT 10;');

fs.writeFileSync(outputDir + 'verify-restore.sql', verifyContent.join('\n'), 'utf8');

console.log('');
console.log('🎉 Micro batches created successfully!');
console.log(`📁 Location: ${outputDir}`);
console.log(`📊 Total batches: ${totalBatches}`);
console.log(`📝 Each batch: ~25 records (~${Math.round(500)} KB)`);
console.log('');
console.log('📋 Instructions:');
console.log('1. Run batches in order: batch-001.sql, batch-002.sql, etc.');
console.log('2. Each batch is very small and should work in SQL Editor');
console.log('3. After all batches, run verify-restore.sql to check results');
console.log('4. Each batch has "ON CONFLICT DO NOTHING" - safe to re-run');
console.log('');
console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/fcsggaggjtxqwatimplk/sql');