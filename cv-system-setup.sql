-- =====================================================
-- CV/RESUME SYSTEM KURULUMU
-- Çalışanların haritaya CV bırakabilmesi için
-- =====================================================

-- 1. CV'ler için yeni tablo oluştur
CREATE TABLE IF NOT EXISTS public.cvs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    full_name VARCHAR NOT NULL,
    title VARCHAR NOT NULL, -- Ünvan (örn: Frontend Developer)
    description TEXT NOT NULL, -- Yetenek özeti
    lat NUMERIC NOT NULL,
    lon NUMERIC NOT NULL,
    country VARCHAR NOT NULL,
    city VARCHAR,
    contact TEXT, -- İletişim bilgileri
    skills TEXT[], -- Yetenekler dizisi
    experience_years INTEGER DEFAULT 0,
    education_level VARCHAR, -- Eğitim seviyesi
    remote_available BOOLEAN DEFAULT false, -- Uzaktan çalışmaya açık mı
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    currency VARCHAR DEFAULT 'TRY',
    available_for_work BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR DEFAULT 'manual',
    marker_html TEXT,
    popup_html TEXT,
    icon_type VARCHAR DEFAULT 'cv'
);

-- 2. CV'ler için RLS politikaları
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

-- Herkes CV'leri görebilir (public)
CREATE POLICY "cvs_select_policy" ON public.cvs
    FOR SELECT USING (true);

-- Sadece kimlik doğrulanmış kullanıcılar CV ekleyebilir
CREATE POLICY "cvs_insert_policy" ON public.cvs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Kullanıcılar sadece kendi CV'lerini güncelleyebilir
CREATE POLICY "cvs_update_policy" ON public.cvs
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar sadece kendi CV'lerini silebilir
CREATE POLICY "cvs_delete_policy" ON public.cvs
    FOR DELETE USING (auth.uid() = user_id);

-- 3. CV'ler için indeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_location ON public.cvs(lat, lon);
CREATE INDEX IF NOT EXISTS idx_cvs_country ON public.cvs(country);
CREATE INDEX IF NOT EXISTS idx_cvs_city ON public.cvs(city);
CREATE INDEX IF NOT EXISTS idx_cvs_remote ON public.cvs(remote_available) WHERE remote_available = true;
CREATE INDEX IF NOT EXISTS idx_cvs_available ON public.cvs(available_for_work) WHERE available_for_work = true;
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON public.cvs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cvs_title_search ON public.cvs USING gin (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_cvs_skills_search ON public.cvs USING gin (skills);

-- 4. CV günlük limit fonksiyonu
CREATE OR REPLACE FUNCTION check_daily_cv_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM public.cvs
        WHERE user_id = NEW.user_id
        AND created_at > NOW() - INTERVAL '1 day'
    ) >= 3 THEN
        RAISE EXCEPTION 'Günlük CV ekleme limitini aştınız (günde 3 CV)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CV limit trigger'ı
DROP TRIGGER IF EXISTS enforce_daily_cv_limit ON public.cvs;
CREATE TRIGGER enforce_daily_cv_limit
    BEFORE INSERT ON public.cvs
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_cv_limit();

-- 5. Profiles tablosunu güncelle (user_type için constraint ekle)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('job_seeker', 'employer', 'company'));

-- =====================================================
-- TEST DATA (İsteğe bağlı)
-- =====================================================

-- Bir kaç test CV'si ekleyelim
INSERT INTO public.cvs (
    full_name, title, description, lat, lon, country, city, 
    contact, skills, experience_years, remote_available, 
    salary_expectation_min, salary_expectation_max
) VALUES 
(
    'Ahmet Yılmaz', 
    'Frontend Developer', 
    'React, Vue.js ve modern JavaScript frameworkleri konusunda deneyimli. 3+ yıl sektör tecrübesi.',
    41.0082, 28.9784, 'Turkey', 'İstanbul',
    'ahmet@example.com',
    ARRAY['React', 'Vue.js', 'JavaScript', 'TypeScript', 'CSS'],
    3,
    true,
    15000, 25000
),
(
    'Elif Demir',
    'UI/UX Designer',
    'Kullanıcı deneyimi ve arayüz tasarımı konusunda uzman. Adobe Creative Suite ve Figma kullanıcısı.',
    39.9334, 32.8597, 'Turkey', 'Ankara',
    'elif@example.com',
    ARRAY['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'User Research'],
    2,
    true,
    12000, 20000
),
(
    'Mehmet Kaya',
    'DevOps Engineer',
    'AWS, Docker, Kubernetes ve CI/CD pipeline kurulumu konusunda deneyimli.',
    38.4237, 27.1428, 'Turkey', 'İzmir',
    'mehmet@example.com',
    ARRAY['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
    5,
    true,
    25000, 35000
);

-- =====================================================
-- KONTROL SORULARI
-- =====================================================

-- CV'leri listele
SELECT 
    full_name, title, city, country, 
    created_at, available_for_work
FROM public.cvs
ORDER BY created_at DESC;

-- RLS politikalarını kontrol et
SELECT 
    schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'cvs'
ORDER BY policyname;

-- İndeksleri kontrol et
SELECT 
    indexname, indexdef
FROM pg_indexes
WHERE tablename = 'cvs'
ORDER BY indexname;