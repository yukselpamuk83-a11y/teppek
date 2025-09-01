import { createClient } from '@supabase/supabase-js';

// Bu Vercel Sunucusuz Fonksiyonu, harita verilerini oluşturmak için kullanılır.
export default async function handler(req, res) {
    // TEMP: Authorization tamamen kapatıldı - test için
    console.log('🧪 Authorization bypassed for testing');

    try {
        // Supabase istemcisini, tüm verilere erişebilmek için SERVICE_ROLE anahtarı ile başlatıyoruz.
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        );

        const limit = 1000; // Normal limit geri

        // Table optimized - no more cleanup needed
        console.log('✅ Using optimized jobs table structure');

        // 1. Aktif olan tüm iş ilanlarını çek (sayfalama ile).
        let allJobs = [];
        let offset = 0;
        let hasMoreJobs = true;

        while (hasMoreJobs) {
            // Optimized bucket için gerekli field'ları al
            const { data: chunk, error: chunkError } = await supabase
                .from('jobs')
                .select('id, title, lat, lon, company, city, country, salary_min, salary_max, currency, url, source, remote, icon_type')
                .range(offset, offset + limit - 1);
            
            // DEBUG: Optimized table structure
            if (offset === 0 && chunk && chunk.length > 0) {
                console.log('🔍 Optimized DB fields:', Object.keys(chunk[0]));
                console.log('🔍 Sample record:', {
                    id: chunk[0].id,
                    title: chunk[0].title,
                    source: chunk[0].source,
                    remote: chunk[0].remote,
                    icon_type: chunk[0].icon_type,
                    salary_min: chunk[0].salary_min,
                    salary_max: chunk[0].salary_max,
                    currency: chunk[0].currency
                });
            }

            if (chunkError) throw chunkError;

            allJobs = allJobs.concat(chunk);
            if (chunk.length < limit) {
                hasMoreJobs = false; // Daha fazla veri yok
            } else {
                offset += limit;
            }
        }
        const jobs = allJobs;

        // 2. CV'ler şu an için devre dışı (tablo yok)
        const cvs = [];

        // 3. Veriyi GeoJSON formatına dönüştür.
        const jobFeatures = jobs
            .filter(job => job.lat && job.lon) // Konumu olmayanları filtrele
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
                    // Optimized: No popup_html, frontend generates dynamically
                }
            }));

        const cvFeatures = cvs
            .filter(cv => cv.lat && cv.lon) // Konumu olmayanları filtrele
            .map(cv => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [cv.lon, cv.lat] },
                properties: {
                    id: cv.id,
                    title: cv.title,
                    user: cv.full_name,
                    name: cv.full_name,
                    type: 'cv'
                }
            }));

        const geoJsonData = {
            type: 'FeatureCollection',
            features: [...jobFeatures, ...cvFeatures]
        };

        // 4. Oluşturulan GeoJSON dosyasını Supabase Storage'a yükle.
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

        // 5. Başarılı yanıtı gönder.
        return res.status(200).json({
            message: `Harita verisi başarıyla oluşturuldu ve yüklendi: ${fileName}`,
            jobs_processed: jobs.length,
            cvs_processed: cvs.length,
            total_features: geoJsonData.features.length
        });

    } catch (error) {
        console.error('Harita verisi oluşturma hatası:', error);
        return res.status(500).json({ error: 'Harita verisi oluşturulamadı.', details: error.message });
    }
}