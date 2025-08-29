-- Supabase Database Temizliği - Tablo Analizi

-- 1. Tüm kullanıcı tablolarını listele
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Her tablodaki kayıt sayısını öğren
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count
FROM jobs
UNION ALL
SELECT 
    'cvs' as table_name,
    COUNT(*) as record_count  
FROM cvs
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as record_count
FROM profiles;

-- 3. Jobs tablosu source dağılımı
SELECT 
    source,
    COUNT(*) as count
FROM jobs 
GROUP BY source
ORDER BY count DESC;

-- 4. Son 30 günde eklenen kayıtlar
SELECT 
    'jobs' as table_name,
    COUNT(*) as recent_records
FROM jobs 
WHERE created_at > NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'cvs' as table_name,
    COUNT(*) as recent_records
FROM cvs 
WHERE created_at > NOW() - INTERVAL '30 days';

-- 5. Storage bucket'ları listele
SELECT name, public FROM storage.buckets;