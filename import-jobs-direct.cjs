#!/usr/bin/env node

/**
 * DIRECT IMPORT SCRIPT - JSON dosyasından Supabase'e import
 * Vercel API kullanmadan direkt bağlantı
 */

const fs = require('fs');
const { Pool } = require('pg');

// Supabase connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.fcsggaggjtxqwatimplk:WN6FTXCnvzftaQCY@aws-1-eu-central-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importJobs() {
  const filename = 'adzuna-merged-49859-2025-09-09-spread-2025-09-09.json';
  
  if (!fs.existsSync(filename)) {
    console.error(`❌ File not found: ${filename}`);
    process.exit(1);
  }

  console.log('📄 DIRECT JOBS IMPORT');
  console.log('====================');
  console.log(`File: ${filename}`);

  let client;
  try {
    // Read JSON file
    console.log('\n📖 Reading JSON file...');
    const jobs = JSON.parse(fs.readFileSync(filename, 'utf8'));
    console.log(`📊 Jobs to import: ${jobs.length.toLocaleString()}`);

    // Connect to database
    console.log('\n🔌 Connecting to database...');
    client = await pool.connect();

    // Check current job count
    const beforeResult = await client.query('SELECT COUNT(*) as count FROM jobs');
    const beforeCount = parseInt(beforeResult.rows[0].count);
    console.log(`📊 Current jobs in database: ${beforeCount.toLocaleString()}`);

    // Import jobs in batches
    console.log('\n📥 Starting import...');
    const batchSize = 1000;
    let importedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(jobs.length / batchSize);
      
      console.log(`   📦 Batch ${batchNum}/${totalBatches}: ${batch.length} jobs`);

      // Prepare batch insert
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      batch.forEach(job => {
        const placeholder = `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16})`;
        placeholders.push(placeholder);
        
        values.push(
          job.adzuna_id,
          job.title,
          job.company,
          job.country,
          job.city,
          job.lat,
          job.lon,
          job.url,
          job.salary_min,
          job.salary_max,
          job.currency,
          job.remote,
          job.source,
          job.icon_type,
          job.description,
          job.created_at,
          job.contact
        );
        
        paramIndex += 17;
      });

      const insertQuery = `
        INSERT INTO jobs (
          adzuna_id, title, company, country, city, lat, lon, url,
          salary_min, salary_max, currency, remote, source, icon_type,
          description, created_at, contact
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (adzuna_id) DO NOTHING
      `;

      try {
        const result = await client.query(insertQuery, values);
        importedCount += result.rowCount;
        console.log(`   ✅ Batch ${batchNum}: ${result.rowCount} jobs inserted`);
      } catch (error) {
        console.error(`   ❌ Batch ${batchNum} error:`, error.message);
        errorCount += batch.length;
      }
    }

    // Final count
    const afterResult = await client.query('SELECT COUNT(*) as count FROM jobs');
    const afterCount = parseInt(afterResult.rows[0].count);
    
    console.log('\n📊 IMPORT SUMMARY');
    console.log('================');
    console.log(`Jobs before import: ${beforeCount.toLocaleString()}`);
    console.log(`Jobs after import: ${afterCount.toLocaleString()}`);
    console.log(`Successfully imported: ${importedCount.toLocaleString()}`);
    console.log(`Errors: ${errorCount.toLocaleString()}`);
    console.log(`Net increase: ${(afterCount - beforeCount).toLocaleString()}`);

    console.log('\n✅ Import completed!');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

if (require.main === module) {
  importJobs();
}

module.exports = { importJobs };