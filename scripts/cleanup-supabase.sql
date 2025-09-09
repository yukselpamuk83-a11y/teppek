-- SUPABASE DB CLEANUP - Tüm eski verileri temizle
-- Fresh 14-day data için hazırlık

-- 1. BACKUP KONTROL (İsteğe bağlı)
-- SELECT COUNT(*) as current_jobs FROM jobs WHERE source = 'adzuna';
-- SELECT MIN(created_at), MAX(created_at) FROM jobs WHERE source = 'adzuna';

-- 2. ADZUNA JOB'LARINI TEMİZLE
DELETE FROM jobs WHERE source = 'adzuna';

-- 3. AUTO-INCREMENT RESET (PostgreSQL)
-- jobs tablosu sequence'ini sıfırla
-- Bu işlem yeni veriler için ID=1'den başlatır
ALTER SEQUENCE jobs_id_seq RESTART WITH 1;

-- 4. VACUUM (Performans için - opsiyonel)
-- VACUUM ANALYZE jobs;

-- 5. KONTROL SORGUSU
SELECT 
  COUNT(*) as remaining_jobs,
  COUNT(CASE WHEN source = 'adzuna' THEN 1 END) as adzuna_jobs,
  COUNT(CASE WHEN source != 'adzuna' THEN 1 END) as manual_jobs
FROM jobs;

-- SONUÇ BEKLENTISI:
-- remaining_jobs: manuel eklenen job'lar + CV'ler (varsa)
-- adzuna_jobs: 0 olmalı
-- manual_jobs: manuel eklenen job'lar