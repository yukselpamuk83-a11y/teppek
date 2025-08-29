import { createClient } from '@supabase/supabase-js';

// HATA AYIKLAMA MODU - BU KOD GEÇİCİDİR
export default async function handler(req, res) {
    // Güvenlik kontrolünü geçici olarak basitleştiriyoruz
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // Hata ayıklama için ortam değişkenlerini kontrol et
        const debugInfo = {
            SUPABASE_URL_VAR_EXISTS: !!process.env.SUPABASE_URL,
            SUPABASE_SERVICE_KEY_VAR_EXISTS: !!process.env.SUPABASE_SERVICE_KEY,
            SERVICE_KEY_FIRST_5_CHARS: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 5) + '...' : 'NOT FOUND',
            VITE_SUPABASE_URL_VAR_EXISTS: !!process.env.VITE_SUPABASE_URL, // Bunu da kontrol edelim
        };

        // Asıl işlemi çalıştırmadan önce bu bilgiyi döndür
        return res.status(200).json({
            message: "DEBUGGING OUTPUT",
            variables_seen_by_function: debugInfo
        });

    } catch (error) {
        return res.status(500).json({ error: 'Hata ayıklama sırasında bir sorun oluştu.', details: error.message });
    }
}