-- =====================================================
-- TEPPEK PROJESİ - ROW LEVEL SECURİTY KURULUMU
-- Bu SQL kodunu Supabase SQL Editor'a yapıştırın ve çalıştırın
-- =====================================================

-- 1. Jobs tablosu için user_id sütunu ekle (eğer yoksa)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Jobs tablosu için RLS'i etkinleştir
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 3. Jobs tablosu için RLS politikalarını oluştur

-- Politika 1: Herkes iş ilanlarını okuyabilir (iş ilanları herkese açık)
CREATE POLICY "jobs_select_policy" ON public.jobs
    FOR SELECT USING (true);

-- Politika 2: Sadece kimlik doğrulanmış kullanıcılar iş ilanı oluşturabilir
CREATE POLICY "jobs_insert_policy" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Politika 3: Kullanıcılar sadece kendi iş ilanlarını güncelleyebilir
CREATE POLICY "jobs_update_policy" ON public.jobs
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politika 4: Kullanıcılar sadece kendi iş ilanlarını silebilir
CREATE POLICY "jobs_delete_policy" ON public.jobs
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Profiles tablosu oluştur (kullanıcı profilleri için)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    user_type TEXT CHECK (user_type IN ('job_seeker', 'employer', 'company')),
    company_name TEXT,
    bio TEXT,
    location TEXT,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Profiles tablosu için RLS'i etkinleştir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Profiles tablosu için RLS politikalarını oluştur

-- Politika 1: Herkes profilleri görebilir
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (true);

-- Politika 2: Kullanıcılar kendi profillerini oluşturabilir
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Politika 3: Kullanıcılar sadece kendi profillerini güncelleyebilir
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 7. Yeni kullanıcı kaydolduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger oluştur (önce varsa sil)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Performans için indeksler oluştur
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON public.jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON public.jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON public.jobs(remote);
CREATE INDEX IF NOT EXISTS idx_jobs_country_city ON public.jobs(country, city);

-- 10. Günlük iş ilanı limiti fonksiyonu (opsiyonel güvenlik)
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

-- 11. Günlük limit trigger'ı
DROP TRIGGER IF EXISTS enforce_daily_job_limit ON public.jobs;
CREATE TRIGGER enforce_daily_job_limit
    BEFORE INSERT ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_job_limit();

-- =====================================================
-- KURULUM TAMAMLANDI!
-- =====================================================
-- Bu SQL'i çalıştırdıktan sonra şunları kontrol edin:
-- 1. Jobs tablosunda RLS aktif mi: SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'jobs';
-- 2. Politikalar oluştu mu: SELECT * FROM pg_policies WHERE tablename = 'jobs';
-- 3. Profiles tablosu var mı: SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
-- =====================================================