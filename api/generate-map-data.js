
// SON ADLİ TIP TEŞHİS KODU
export default async function handler(req, res) {
    // Güvenlik kontrolü
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    // Teşhis bilgilerini topla
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'BULUNAMADI';
    const supabaseUrl = process.env.SUPABASE_URL || 'BULUNAMADI';

    const debugInfo = {
        MESSAGE: "Bu son teşhis testidir.",
        TIMESTAMP: new Date().toISOString(),
        SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_KEY,
        SERVICE_KEY_LENGTH: serviceKey.length,
        SERVICE_KEY_FIRST_5_CHARS: serviceKey.substring(0, 5) + '...',
        SERVICE_KEY_LAST_5_CHARS: '...' + serviceKey.substring(serviceKey.length - 5),
        URL_PROJECT_REF_FROM_URL: supabaseUrl.split('.')[0].replace('https://', ''),
    };

    // Bu bilgiyi hem loglara yazdır hem de kullanıcıya döndür.
    console.log("--- ADLİ TIP KONTROLÜ ---");
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log("--- KONTROL SONU ---");

    try {
        // Normal işlemi yapmayı dene
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
        const { data, error } = await supabase.from('jobs').select('id').limit(1);
        if (error) throw error;

        return res.status(200).json({ message: "ADLİ TIP TESTİ BAŞARILI! Bağlantı kuruldu ve anahtar geçerli!" });

    } catch (error) {
        console.error('Supabase bağlantı hatası (Adli Tıp Testi):', error);
        // Hatayı ve teşhis bilgilerini birlikte döndür
        return res.status(500).json({ 
            error: 'Supabase istemcisi başlatılırken veya sorgu yapılırken hata oluştu.', 
            details: error.message,
            diagnostic_info: debugInfo
        });
    }
}
