import { createClient } from '@supabase/supabase-js';

// Bu Vercel Sunucusuz Fonksiyonu, harita verilerini oluşturmak için kullanılır.
export default async function handler(req, res) {
    // Güvenlik: Bu fonksiyonun sadece Vercel Cron Job tarafından tetiklendiğinden emin olun.
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // Supabase istemcisini, tüm verilere erişebilmek için SERVICE_ROLE anahtarı ile başlatıyoruz.
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        );

        const limit = 1000; // Supabase API varsayılan limiti

        // 1. Aktif olan tüm iş ilanlarını çek (sayfalama ile).
        let allJobs = [];
        let offset = 0;
        let hasMoreJobs = true;

        while (hasMoreJobs) {
            const { data: chunk, error: chunkError } = await supabase
                .from('jobs')
                .select('id, title, lat, lon, company')
                .range(offset, offset + limit - 1);

            if (chunkError) throw chunkError;

            allJobs = allJobs.concat(chunk);
            if (chunk.length < limit) {
                hasMoreJobs = false; // Daha fazla veri yok
            } else {
                offset += limit;
            }
        }
        const jobs = allJobs;

        // 2. İş arayan ve aktif olan tüm CV'leri çek (sayfalama ile).
        let allCvs = [];
        offset = 0; // Offset'i sıfırla
        let hasMoreCvs = true;

        while (hasMoreCvs) {
            const { data: chunk, error: chunkError } = await supabase
                .from('cvs')
                .select('id, title, lat, lon, full_name')
                .eq('available_for_work', true)
                .range(offset, offset + limit - 1);

            if (chunkError) throw chunkError;

            allCvs = allCvs.concat(chunk);
            if (chunk.length < limit) {
                hasMoreCvs = false; // Daha fazla veri yok
            } else {
                offset += limit;
            }
        }
        const cvs = allCvs;

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
                    type: 'job'
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