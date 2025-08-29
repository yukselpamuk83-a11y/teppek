-- =====================================================
-- DUPLICATE RLS POLİTİKALARINI TEMİZLEME
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- =====================================================

-- Eski/gereksiz politikaları sil
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "jobs_api_management" ON public.jobs;
DROP POLICY IF EXISTS "jobs_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_public_read" ON public.jobs;

-- Temiz politikaları kontrol et (bunlar kalacak)
-- jobs_select_policy - Okuma izni
-- jobs_insert_policy - Ekleme izni  
-- jobs_update_policy - Güncelleme izni
-- jobs_delete_policy - Silme izni

-- Kontrol sorgusu - politika sayısı 4 olmalı
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'jobs';

-- Son durum
SELECT tablename, policyname, cmd as operation
FROM pg_policies 
WHERE tablename = 'jobs'
ORDER BY policyname;