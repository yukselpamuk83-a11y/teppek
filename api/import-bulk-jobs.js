// BULK JOBS IMPORT API - JSON dosyasından 50K job import et
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const { filename, batch_size = 1000, clear_existing = false } = req.body;

  if (!filename) {
    return res.status(400).json({
      success: false,
      error: 'Filename is required. Example: "adzuna-50k-complete-2025-09-09.json"'
    });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_URL not configured'
    });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const summary = {
    started_at: new Date().toISOString(),
    filename: filename,
    total_jobs_in_file: 0,
    successful_inserts: 0,
    failed_inserts: 0,
    duplicates_skipped: 0,
    batch_size: batch_size,
    batches_processed: 0,
    by_country: {},
    errors: [],
    cleared_existing: false,
    existing_jobs_deleted: 0
  };

  let client;
  try {
    client = await pool.connect();
    
    // Read and validate JSON file
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: `File not found: ${filename}. Make sure the file is in the project root directory.`
      });
    }

    console.log(`📄 Reading file: ${filename}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jobs = JSON.parse(fileContent);

    if (!Array.isArray(jobs)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON format. Expected an array of job objects.'
      });
    }

    summary.total_jobs_in_file = jobs.length;
    console.log(`📊 Found ${jobs.length} jobs in file`);

    // Clear existing Adzuna jobs if requested
    if (clear_existing) {
      console.log('🗑️  Clearing existing Adzuna jobs...');
      const deleteResult = await client.query(`
        DELETE FROM jobs WHERE source = 'adzuna'
      `);
      summary.cleared_existing = true;
      summary.existing_jobs_deleted = deleteResult.rowCount;
      console.log(`✅ Deleted ${deleteResult.rowCount} existing jobs`);
    }

    // Prepare batch insert statement
    const insertQuery = `
      INSERT INTO jobs (
        adzuna_id, title, company, country, city, lat, lon, url,
        salary_min, salary_max, currency, remote, source, icon_type,
        description, created_at, contact, user_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (adzuna_id) DO UPDATE SET
        title = EXCLUDED.title,
        company = EXCLUDED.company,
        salary_min = EXCLUDED.salary_min,
        salary_max = EXCLUDED.salary_max,
        currency = EXCLUDED.currency,
        description = EXCLUDED.description,
        created_at = EXCLUDED.created_at
      RETURNING id, (xmax = 0) AS inserted;
    `;

    // Process jobs in batches
    console.log(`🚀 Starting batch import (batch size: ${batch_size})...`);
    
    for (let i = 0; i < jobs.length; i += batch_size) {
      const batch = jobs.slice(i, i + batch_size);
      summary.batches_processed++;
      
      console.log(`📦 Processing batch ${summary.batches_processed} (jobs ${i + 1}-${Math.min(i + batch_size, jobs.length)})`);

      // Process each job in the current batch
      for (const job of batch) {
        try {
          // Validate required fields
          if (!job.adzuna_id || !job.title || !job.lat || !job.lon) {
            summary.failed_inserts++;
            summary.errors.push(`Missing required fields for job: ${job.adzuna_id || 'unknown'}`);
            continue;
          }

          const values = [
            job.adzuna_id,
            job.title?.substring(0, 500) || null,
            job.company?.substring(0, 200) || null,
            job.country || 'US',
            job.city?.substring(0, 100) || null,
            parseFloat(job.lat),
            parseFloat(job.lon),
            job.url || null,
            job.salary_min || null,
            job.salary_max || null,
            job.currency || 'USD',
            job.remote || false,
            job.source || 'adzuna',
            job.icon_type || 'job',
            job.description?.substring(0, 2000) || null,
            job.created_at || new Date().toISOString(),
            job.contact || null,
            job.user_id || null,
            job.created_by || null
          ];

          const result = await client.query(insertQuery, values);
          
          if (result.rows[0]?.inserted) {
            summary.successful_inserts++;
            
            // Count by country
            const country = job.country || 'US';
            if (!summary.by_country[country]) {
              summary.by_country[country] = 0;
            }
            summary.by_country[country]++;
          } else {
            summary.duplicates_skipped++;
          }

        } catch (jobError) {
          summary.failed_inserts++;
          const errorMsg = `Job ${job.adzuna_id}: ${jobError.message}`;
          summary.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      // Progress update
      const progress = ((i + batch_size) / jobs.length * 100).toFixed(1);
      console.log(`📊 Progress: ${progress}% (${summary.successful_inserts} inserted, ${summary.failed_inserts} failed, ${summary.duplicates_skipped} duplicates)`);

      // Small delay to prevent overwhelming the database
      if (i + batch_size < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final statistics
    summary.completed_at = new Date().toISOString();
    const duration = ((new Date(summary.completed_at) - new Date(summary.started_at)) / 1000).toFixed(1);

    console.log('\n📊 IMPORT SUMMARY');
    console.log('=================');
    console.log(`Duration: ${duration} seconds`);
    console.log(`Total jobs in file: ${summary.total_jobs_in_file.toLocaleString()}`);
    console.log(`Successfully inserted: ${summary.successful_inserts.toLocaleString()}`);
    console.log(`Duplicates skipped: ${summary.duplicates_skipped.toLocaleString()}`);
    console.log(`Failed inserts: ${summary.failed_inserts.toLocaleString()}`);
    console.log(`Batches processed: ${summary.batches_processed}`);
    
    if (summary.cleared_existing) {
      console.log(`Existing jobs cleared: ${summary.existing_jobs_deleted.toLocaleString()}`);
    }

    console.log('\n🌍 BY COUNTRY:');
    Object.entries(summary.by_country)
      .sort(([,a], [,b]) => b - a)
      .forEach(([country, count]) => {
        console.log(`${country}: ${count.toLocaleString()}`);
      });

    if (summary.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${summary.errors.length} (showing first 5):`);
      summary.errors.slice(0, 5).forEach(error => console.log(`- ${error}`));
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${summary.successful_inserts.toLocaleString()} jobs from ${filename}`,
      summary
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      summary
    });
  } finally {
    if (client) client.release();
    await pool.end();
  }
};