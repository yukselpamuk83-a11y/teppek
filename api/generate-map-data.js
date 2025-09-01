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

        // ONCE: Clear popup_html from all records
        console.log('🧹 Clearing popup_html from all jobs...');
        const { error: clearError } = await supabase
            .from('jobs')
            .update({ popup_html: null })
            .neq('id', 0);
        
        if (clearError) console.warn('Clear popup_html error:', clearError);
        else console.log('✅ popup_html cleared from all jobs');

        // 1. Aktif olan tüm iş ilanlarını çek (sayfalama ile).
        let allJobs = [];
        let offset = 0;
        let hasMoreJobs = true;

        while (hasMoreJobs) {
            // Sadece popup için gerekli field'ları al
            const { data: chunk, error: chunkError } = await supabase
                .from('jobs')
                .select('id, title, lat, lon, company, city, country, salary_min, salary_max, currency, url, source, remote')
                .range(offset, offset + limit - 1);
            
            // DEBUG: İlk kaydın tüm field'larını kontrol et
            if (offset === 0 && chunk && chunk.length > 0) {
                console.log('🔍 DB\'deki tüm field\'lar:', Object.keys(chunk[0]));
                console.log('🔍 İlk kayıt örneği:', {
                    id: chunk[0].id,
                    title: chunk[0].title,
                    source: chunk[0].source,
                    popup_html: chunk[0].popup_html ? 'EXISTS' : 'MISSING',
                    salary_min: chunk[0].salary_min,
                    salary_max: chunk[0].salary_max,
                    currency: chunk[0].currency,
                    url: chunk[0].url,
                    company: chunk[0].company
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
                    type: 'job'
                    // popup_html removed - frontend will generate dynamically
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