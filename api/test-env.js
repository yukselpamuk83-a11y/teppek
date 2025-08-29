
// Bu dosya, Vercel Ortam Değişkenlerinin doğru okunup okunmadığını test etmek için geçici bir araçtır.
export default function handler(req, res) {
  const debugInfo = {
    message: "Bu test fonksiyonu başarıyla çalıştı.",
    timestamp: new Date().toISOString(),
    variables_seen_by_function: {
      SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_KEY,
      SERVICE_KEY_FIRST_5_CHARS: process.env.SUPABASE_SERVICE_KEY 
        ? process.env.SUPABASE_SERVICE_KEY.substring(0, 5) + '...' 
        : 'BULUNAMADI',
      CRON_SECRET_EXISTS: !!process.env.CRON_SECRET,
      CRON_SECRET_FIRST_5_CHARS: process.env.CRON_SECRET 
        ? process.env.CRON_SECRET.substring(0, 5) + '...' 
        : 'BULUNAMADI',
    }
  };

  res.status(200).json(debugInfo);
}
