import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    try {
        // Supabase istemcisini SERVICE_ROLE anahtarı ile başlat
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        );

        console.log('🧹 Clearing popup_html from all jobs...');

        // Tüm kayıtlarda popup_html'i NULL yap
        const { error: updateError } = await supabase
            .from('jobs')
            .update({ popup_html: null })
            .neq('id', 0); // Tüm kayıtlar için

        if (updateError) throw updateError;

        console.log('✅ popup_html cleared from all jobs');

        return res.status(200).json({
            message: 'popup_html başarıyla temizlendi',
            success: true
        });

    } catch (error) {
        console.error('❌ popup_html temizleme hatası:', error);
        return res.status(500).json({ 
            error: 'popup_html temizlenemedi', 
            details: error.message 
        });
    }
}