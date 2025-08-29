import { createClient } from '@supabase/supabase-js';

// SON TEŞHİS KODU
export default async function handler(req, res) {
    // Güvenlik kontrolü
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    // 1. ADIM: Teşhis bilgilerini Vercel Loglarına yazdır.
    console.log("--- FONKSİYON İÇİ ORTAM DEĞİŞKENİ KONTROLÜ ---");
    console.log("SUPABASE_URL Değişkeni Var Mı?", !!process.env.SUPABASE_URL);
    console.log("SUPABASE_SERVICE_KEY Değişkeni Var Mı?", !!process.env.SUPABASE_SERVICE_KEY);
    console.log("SERVICE_KEY İlk 5 Karakteri:", process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 5) + '...' : 'BULUNAMADI');
    console.log("--- KONTROL SONU ---");

    try {
        // 2. ADIM: Normal işlemi yapmayı dene.
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        );

        const { data, error } = await supabase.from('jobs').select('id').limit(1);
        if (error) throw error;

        return res.status(200).json({ message: "Bağlantı başarılı ve anahtar geçerli!" });

    } catch (error) {
        console.error('Supabase bağlantı hatası:', error);
        return res.status(500).json({ error: 'Supabase istemcisi başlatılırken veya sorgu yapılırken hata oluştu.', details: error.message });
    }
}