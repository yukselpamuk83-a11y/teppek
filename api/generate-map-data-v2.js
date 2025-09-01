import { createClient } from '@supabase/supabase-js';

// Optimized bucket generation for cleaned jobs table
export default async function handler(req, res) {
    try {
        console.log('🚀 Starting optimized bucket generation');
        
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        );

        console.log('✅ Supabase client initialized');

        // Fetch all jobs with optimized fields
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('id, title, lat, lon, company, city, country, salary_min, salary_max, currency, url, source, remote, icon_type');

        if (error) throw error;

        console.log(`📊 Fetched ${jobs.length} jobs from optimized table`);

        // Generate GeoJSON
        const jobFeatures = jobs
            .filter(job => job.lat && job.lon)
            .map(job => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [job.lon, job.lat] },
                properties: {
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    city: job.city,
                    country: job.country,
                    salary_min: job.salary_min,
                    salary_max: job.salary_max,
                    currency: job.currency,
                    url: job.url,
                    source: job.source,
                    remote: job.remote,
                    icon_type: job.icon_type || 'job',
                    type: 'job'
                }
            }));

        const geoJsonData = {
            type: 'FeatureCollection',
            features: jobFeatures
        };

        console.log(`🗺️ Generated ${geoJsonData.features.length} map features`);

        // Upload to Supabase Storage
        const fileName = 'map-data.geojson';
        const bucketName = 'public-assets';

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, JSON.stringify(geoJsonData), {
                cacheControl: '3600',
                upsert: true,
                contentType: 'application/json; charset=utf-8'
            });

        if (uploadError) throw uploadError;

        console.log('✅ Optimized bucket uploaded successfully');

        return res.status(200).json({
            message: `Optimized bucket created: ${fileName}`,
            jobs_processed: jobs.length,
            total_features: geoJsonData.features.length,
            version: '2.0'
        });

    } catch (error) {
        console.error('❌ Optimized bucket generation failed:', error);
        return res.status(500).json({ 
            error: 'Optimized bucket generation failed', 
            details: error.message 
        });
    }
}