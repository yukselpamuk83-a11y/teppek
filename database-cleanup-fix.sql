-- =====================================================
-- VERİTABANI TEMİZLİK VE DÜZELTME
-- Auth callback sorunlarını çözmek için eski yapıları temizleyip
-- doğru RLS politikalarını kuracağız
-- =====================================================

-- 1. Eski tabloları ve politikalarını temizle
DROP TABLE IF EXISTS public.candidate_profiles CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;

-- 2. Profiles tablosu için eksik politikaları düzelt
-- Önce mevcut politikaları kontrol et ve eksikleri ekle

-- Profiles için DELETE politikası ekle (eksikti)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'profiles_delete_policy'
    ) THEN
        CREATE POLICY "profiles_delete_policy" ON public.profiles
            FOR DELETE USING (auth.uid() = id);
    END IF;
END $$;

-- 3. Jobs tablosu RLS politikalarını düzelt
-- Insert policy'sini düzelt (şu anda WITH CHECK eksik)
DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
CREATE POLICY "jobs_insert_policy" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Profiles insert policy'sini düzelt
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. RLS'i her iki tablo için de aktif et
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Profil oluşturma trigger'ını kontrol et ve düzelt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Jobs tablosu için günlük limit fonksiyonunu ekle
CREATE OR REPLACE FUNCTION check_daily_job_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM public.jobs
        WHERE user_id = NEW.user_id
        AND created_at > NOW() - INTERVAL '1 day'
    ) >= 10 THEN
        RAISE EXCEPTION 'Günlük iş ilanı oluşturma limitini aştınız (günde 10 ilan)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Günlük limit trigger'ı
DROP TRIGGER IF EXISTS enforce_daily_job_limit ON public.jobs;
CREATE TRIGGER enforce_daily_job_limit
    BEFORE INSERT ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_job_limit();

-- =====================================================
-- KONTROL SORULARI
-- =====================================================

-- Temizlik sonrası tabloları listele
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- RLS politikalarını kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Trigger'ları kontrol et
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;