// Direct database connection to restore jobs
import pkg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Supabase PostgreSQL connection - using session pooler (port 5432)
const client = new Client({
  host: 'aws-1-eu-central-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.fcsggaggjtxqwatimplk',
  password: 'guvenlisifre',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000
});

// Function to escape SQL strings
function escapeSql(str) {
  if (!str) return null;
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
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

async function restoreJobs() {
  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Read backup file
    console.log('📖 Reading backup file...');
    const backupPath = 'D:\\Yeni klasör\\map-data.geojson';
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);

    console.log(`📊 Found ${backupData.features.length} features to restore`);

    let processedCount = 0;
    let errorCount = 0;
    const batchSize = 100;

    // Process in batches
    for (let i = 0; i < backupData.features.length; i += batchSize) {
      const batch = backupData.features.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(backupData.features.length/batchSize)}`);

      const values = [];
      const params = [];
      let paramIndex = 1;

      for (const feature of batch) {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        // Skip invalid features
        if (!props.id || !props.title || !coords || coords.length !== 2) {
          errorCount++;
          continue;
        }

        // Parse location
        const { city, country } = parseLocation(props.popup_html);
        
        // Check if remote
        const remote = isRemoteJob(props.title, props.popup_html);

        // Build parameterized values
        values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, NOW(), $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        
        params.push(
          props.id.toString(), // adzuna_id
          props.title?.substring(0, 200) || null, // title
          props.company?.substring(0, 100) || null, // company
          parseFloat(coords[1]), // lat
          parseFloat(coords[0]), // lon
          props.url, // url
          country?.substring(0, 50) || null, // country
          city?.substring(0, 50) || null, // city
          remote, // remote
          props.salary_min || null, // salary_min
          props.salary_max || null, // salary_max
          props.currency?.substring(0, 3) || null, // currency
          null, // contact
          props.source || 'adzuna', // source
          null, // marker_html
          props.popup_html || null, // popup_html
          null, // icon_type
          null, // created_by
          null, // user_id
          null // location
        );
      }

      if (values.length > 0) {
        const query = `
          INSERT INTO jobs (adzuna_id, title, company, lat, lon, url, country, city, remote, salary_min, salary_max, currency, created_at, contact, source, marker_html, popup_html, icon_type, created_by, user_id, location) 
          VALUES ${values.join(', ')}
          ON CONFLICT (adzuna_id) DO NOTHING
        `;

        try {
          const result = await client.query(query, params);
          processedCount += result.rowCount;
          console.log(`✅ Batch completed: ${result.rowCount} rows inserted`);
        } catch (error) {
          console.error(`❌ Batch error:`, error.message);
          errorCount += values.length;
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');
    console.log('🎉 Restore completed!');
    console.log(`📊 Total processed: ${processedCount} jobs`);
    console.log(`❌ Errors: ${errorCount}`);

    // Verification
    const countResult = await client.query('SELECT COUNT(*) as total, source FROM jobs GROUP BY source');
    console.log('');
    console.log('📋 Verification:');
    countResult.rows.forEach(row => {
      console.log(`  ${row.source}: ${row.total} jobs`);
    });

  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the restore
restoreJobs();