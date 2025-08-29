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

        // 1. Aktif olan tüm iş ilanlarını çek. Sadece gerekli sütunları alıyoruz.
        const { data: jobs, error: jobsError } = await supabase
            .from('jobs')
            .select('id, title, lat, lon, company')
            

        if (jobsError) throw jobsError;

        // 2. İş arayan ve aktif olan tüm CV'leri çek.
        const { data: cvs, error: cvsError } = await supabase
            .from('cvs')
            .select('id, title, lat, lon, full_name').range(0, 19999)
            .eq('available_for_work', true);

        if (cvsError) throw cvsError;

        // 3. Veriyi GeoJSON formatına dönüştür.
        const jobFeatures = jobs
            .filter(job => job.lat && job.lon) // Konumu olmayanları filtrele
            .map(job => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [job.lon, job.lat] },
                properties: {
                    id: job.id,
                    title: job.title,
                    company: job.company_name,
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