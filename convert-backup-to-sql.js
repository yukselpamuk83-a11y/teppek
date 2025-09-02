// Convert GeoJSON backup to SQL INSERT statements for Supabase
import fs from 'fs';

// Read the backup file
const backupPath = 'D:\\Yeni klasör\\map-data.geojson';
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

// Generate SQL INSERT statements
console.log('🔄 Converting to SQL...');

let sqlStatements = [];
const batchSize = 100; // Process in batches for better performance

// SQL header
sqlStatements.push('-- Restore jobs from backup');
sqlStatements.push('-- Generated on: ' + new Date().toISOString());
sqlStatements.push('');

for (let i = 0; i < backupData.features.length; i += batchSize) {
  const batch = backupData.features.slice(i, i + batchSize);
  
  let insertStatement = 'INSERT INTO jobs (adzuna_id, title, company, lat, lon, url, country, city, remote, salary_min, salary_max, currency, created_at, contact, source, marker_html, popup_html, icon_type, created_by, user_id, location) VALUES\n';
  
  const values = [];
  
  for (const feature of batch) {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;
    
    // Skip invalid features
    if (!props.id || !props.title || !coords || coords.length !== 2) {
      console.warn(`⚠️  Skipping invalid feature: ID ${props.id}`);
      continue;
    }
    
    // Parse location from popup
    const { city, country } = parseLocation(props.popup_html);
    
    // Check if remote
    const remote = isRemoteJob(props.title, props.popup_html);
    
    // Build VALUES row - following exact table structure
    const row = [
      escapeSql(props.id.toString()), // adzuna_id (varchar)
      escapeSql(props.title?.substring(0, 200)), // title (varchar) 
      escapeSql(props.company?.substring(0, 100)), // company (varchar)
      coords[1], // lat (numeric) - GeoJSON is [lon, lat]
      coords[0], // lon (numeric) - GeoJSON is [lon, lat]
      escapeSql(props.url), // url (text)
      escapeSql(country?.substring(0, 50)), // country (varchar)
      escapeSql(city?.substring(0, 50)), // city (varchar)
      remote, // remote (boolean)
      props.salary_min || 'NULL', // salary_min (integer)
      props.salary_max || 'NULL', // salary_max (integer)
      escapeSql(props.currency?.substring(0, 3)), // currency (varchar)
      "NOW()", // created_at (timestamptz)
      'NULL', // contact (text)
      escapeSql(props.source || 'adzuna'), // source (varchar)
      'NULL', // marker_html (text) - not in backup
      escapeSql(props.popup_html), // popup_html (text)
      'NULL', // icon_type (varchar) - not in backup
      'NULL', // created_by (uuid) - not in backup
      'NULL', // user_id (uuid) - not in backup
      'NULL' // location (geography) - not in backup
    ];
    
    values.push(`  (${row.join(', ')})`);
  }
  
  if (values.length > 0) {
    insertStatement += values.join(',\n');
    insertStatement += '\nON CONFLICT (adzuna_id) DO NOTHING;'; // Handle duplicates
    insertStatement += '\n';
    
    sqlStatements.push(insertStatement);
  }
  
  console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(backupData.features.length/batchSize)} processed`);
}

// Add final statistics query
sqlStatements.push('-- Verify the restore');
sqlStatements.push('SELECT COUNT(*) as total_jobs, source FROM jobs GROUP BY source;');

// Write to file
const outputPath = 'C:\\Users\\seher\\Desktop\\geoo\\restore-jobs.sql';
const sqlContent = sqlStatements.join('\n');

fs.writeFileSync(outputPath, sqlContent, 'utf8');

console.log(`🎉 SQL file generated: ${outputPath}`);
console.log(`📊 Total features processed: ${backupData.features.length}`);
console.log(`📝 File size: ${Math.round(sqlContent.length / 1024 / 1024 * 100) / 100} MB`);
console.log('');
console.log('📋 Next steps:');
console.log('1. Open the generated restore-jobs.sql file');
console.log('2. Copy the content');  
console.log('3. Paste into Supabase SQL Editor');
console.log('4. Execute the queries');
console.log('');
console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/fcsggaggjtxqwatimplk/sql');