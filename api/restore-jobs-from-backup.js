// Restore jobs table from GeoJSON backup
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Supabase environment variables not set'
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    // NOTE: In real scenario, this would read from uploaded file or cloud storage
    // For now, we'll parse from the backup data structure
    const { backupData } = req.body;
    
    if (!backupData || !backupData.features) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup data format. Expected GeoJSON with features array.'
      });
    }

    console.log(`🔄 Starting restore of ${backupData.features.length} jobs...`);

    let processedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process in batches of 100 to avoid timeout
    const batchSize = 100;
    const features = backupData.features;
    
    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(features.length/batchSize)}`);
      
      const jobsToInsert = [];
      
      for (const feature of batch) {
        try {
          const props = feature.properties;
          const coords = feature.geometry.coordinates;
          
          // Validate required fields
          if (!props.id || !props.title || !props.url || !coords || coords.length !== 2) {
            errorCount++;
            errors.push(`Invalid feature: missing required fields - ID: ${props.id}`);
            continue;
          }
          
          // Extract city/country from popup HTML if possible
          let city = null;
          let country = null;
          
          if (props.popup_html) {
            // Look for location pattern in popup HTML
            const locationMatch = props.popup_html.match(/<i class="fa-solid fa-location-dot"[^>]*><\/i>([^<]+)</);
            if (locationMatch) {
              const location = locationMatch[1].trim();
              const parts = location.split(',').map(p => p.trim());
              if (parts.length >= 2) {
                city = parts[0];
                country = parts[parts.length - 1];
              }
            }
          }
          
          // Check if it's a remote job from title or popup
          const isRemote = (props.title?.toLowerCase().includes('remote') || 
                          props.title?.toLowerCase().includes('work from home') ||
                          props.popup_html?.toLowerCase().includes('remote')) || false;
          
          const jobData = {
            adzuna_id: props.id.toString(),
            title: props.title.substring(0, 200).trim(),
            company: props.company?.substring(0, 100) || null,
            country: country?.substring(0, 50) || null,
            city: city?.substring(0, 50) || null,
            lat: parseFloat(coords[1]), // GeoJSON is [lon, lat]
            lon: parseFloat(coords[0]), // GeoJSON is [lon, lat]  
            url: props.url,
            salary_min: props.salary_min || null,
            salary_max: props.salary_max || null,
            currency: props.currency?.substring(0, 3) || null,
            remote: isRemote,
            source: props.source || 'adzuna',
            popup_html: props.popup_html || null,
            marker_html: null, // Not in backup
            contact: null, // Not in backup
            created_at: new Date().toISOString(),
            created_by: null,
            user_id: null,
            icon_type: null
          };
          
          jobsToInsert.push(jobData);
          
        } catch (error) {
          errorCount++;
          errors.push(`Error processing feature ID ${feature.properties?.id}: ${error.message}`);
        }
      }
      
      // Insert batch to Supabase
      if (jobsToInsert.length > 0) {
        const { data, error } = await supabase
          .from('jobs')
          .insert(jobsToInsert)
          .select('id');
          
        if (error) {
          console.error(`❌ Batch insert error:`, error);
          // Try individual inserts for this batch
          for (const job of jobsToInsert) {
            try {
              const { error: singleError } = await supabase
                .from('jobs')
                .insert([job]);
                
              if (singleError) {
                if (singleError.code !== '23505') { // Not a duplicate
                  errorCount++;
                  errors.push(`DB error for job ${job.adzuna_id}: ${singleError.message}`);
                }
              } else {
                processedCount++;
              }
            } catch (singleJobError) {
              errorCount++;
              errors.push(`Single insert error for job ${job.adzuna_id}: ${singleJobError.message}`);
            }
          }
        } else {
          processedCount += data.length;
          console.log(`✅ Batch inserted: ${data.length} jobs`);
        }
      }
    }

    console.log(`🎉 Restore completed: ${processedCount} jobs restored, ${errorCount} errors`);

    return res.status(200).json({
      success: true,
      message: `Jobs restore completed`,
      summary: {
        total_features: features.length,
        jobs_restored: processedCount,
        errors: errorCount,
        error_details: errors.slice(0, 10) // First 10 errors only
      }
    });

  } catch (error) {
    console.error('❌ Restore failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
}