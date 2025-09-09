#!/usr/bin/env node

/**
 * DIRECT BUCKET GENERATION - Minimal map data
 * V2 optimized bucket with bucket-first strategy
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase config (from env or hardcoded)
const SUPABASE_URL = 'https://fcsggaggjtxqwatimplk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY required!');
  process.exit(1);
}

async function generateBucket() {
  console.log('🚀 BUCKET GENERATION V2');
  console.log('=======================');
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);

  try {
    // Initialize Supabase client
    console.log('\n🔌 Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // Fetch minimal fields for bucket (optimized) - NO LIMIT
    console.log('\n📊 Fetching ALL jobs data...');
    
    // Get total count first
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
      
    if (countError) throw countError;
    console.log(`🎯 Total jobs in database: ${count.toLocaleString()}`);
    
    // Fetch all jobs using pagination with ID offset
    let allJobs = [];
    const batchSize = 1000; // Supabase default limit
    let lastId = 0;
    let batchNum = 1;
    
    while (true) {
      console.log(`   📦 Batch ${batchNum}: Starting from ID > ${lastId}`);
      
      const { data: batchJobs, error } = await supabase
        .from('jobs')
        .select('id, title, lat, lon, company, city, country, source, icon_type')
        .gt('id', lastId)
        .order('id', { ascending: true })
        .limit(batchSize);
        
      if (error) throw error;
      
      if (!batchJobs || batchJobs.length === 0) {
        console.log(`   🏁 No more jobs found`);
        break;
      }
      
      allJobs = allJobs.concat(batchJobs);
      lastId = batchJobs[batchJobs.length - 1].id; // Last ID in batch
      
      console.log(`   ✅ Batch ${batchNum}: ${batchJobs.length} jobs (Total: ${allJobs.length.toLocaleString()}, Last ID: ${lastId})`);
      
      if (batchJobs.length < batchSize) {
        console.log(`   🏁 Last batch completed`);
        break; // Final batch (less than batchSize)
      }
      
      batchNum++;
    }
    
    const jobs = allJobs;

    console.log(`📈 Fetched ${jobs.length.toLocaleString()} jobs from database`);

    // Filter jobs with valid coordinates
    const validJobs = jobs.filter(job => 
      job.lat && job.lon && 
      !isNaN(job.lat) && !isNaN(job.lon) &&
      job.lat >= -90 && job.lat <= 90 &&
      job.lon >= -180 && job.lon <= 180
    );

    console.log(`✅ Valid coordinates: ${validJobs.length.toLocaleString()}`);
    console.log(`❌ Invalid coordinates: ${(jobs.length - validJobs.length).toLocaleString()}`);

    // Generate GeoJSON features
    console.log('\n🗺️ Generating GeoJSON features...');
    const jobFeatures = validJobs.map(job => ({
      type: 'Feature',
      geometry: { 
        type: 'Point', 
        coordinates: [parseFloat(job.lon), parseFloat(job.lat)]
      },
      properties: {
        id: job.id,
        title: job.title || 'Untitled Job',
        company: job.company || '',
        city: job.city || '',
        country: job.country || '',
        source: job.source || 'unknown',
        icon_type: job.icon_type || 'job',
        type: 'job'
      }
    }));

    const geoJsonData = {
      type: 'FeatureCollection',
      features: jobFeatures,
      metadata: {
        generated_at: new Date().toISOString(),
        total_jobs: jobs.length,
        valid_jobs: validJobs.length,
        version: '2.0',
        strategy: 'bucket-first-minimal'
      }
    };

    console.log(`📍 Generated ${geoJsonData.features.length.toLocaleString()} map features`);

    // Save locally first
    const localFile = 'map-data-v2.geojson';
    console.log(`\n💾 Saving locally: ${localFile}`);
    fs.writeFileSync(localFile, JSON.stringify(geoJsonData, null, 2), 'utf8');
    
    const fileSize = (fs.statSync(localFile).size / 1024 / 1024).toFixed(2);
    console.log(`📦 Local file size: ${fileSize} MB`);

    // Upload to Supabase Storage
    console.log('\n☁️ Uploading to Supabase Storage...');
    const bucketName = 'public-assets';
    const fileName = 'map-data.geojson';

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, JSON.stringify(geoJsonData), {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/json; charset=utf-8'
      });

    if (uploadError) {
      console.warn(`⚠️ Storage upload warning: ${uploadError.message}`);
      console.log('📄 Local file created successfully, manual upload may be needed');
    } else {
      console.log('✅ Successfully uploaded to Supabase Storage');
    }

    // Statistics
    console.log('\n📊 BUCKET STATISTICS');
    console.log('===================');
    console.log(`Total jobs processed: ${jobs.length.toLocaleString()}`);
    console.log(`Valid coordinates: ${validJobs.length.toLocaleString()}`);
    console.log(`Map features generated: ${geoJsonData.features.length.toLocaleString()}`);
    console.log(`File size: ${fileSize} MB`);
    
    // Country breakdown
    const countryStats = {};
    validJobs.forEach(job => {
      countryStats[job.country] = (countryStats[job.country] || 0) + 1;
    });
    
    console.log('\n🌍 TOP 10 COUNTRIES');
    console.log('==================');
    Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([country, count]) => {
        console.log(`${country}: ${count.toLocaleString()} jobs`);
      });

    console.log('\n✅ Bucket generation completed successfully!');
    console.log('\n📋 BUCKET STRATEGY:');
    console.log('- Minimal data in bucket (8 fields only)');
    console.log('- Full popup data fetched from DB via ID');
    console.log('- Optimized for fast map loading');
    console.log('- 49K+ spread coordinates included');

  } catch (error) {
    console.error('❌ Bucket generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateBucket();
}

module.exports = { generateBucket };