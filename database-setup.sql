-- Teppek Database Setup - PostgreSQL
-- Bu dosyayı PostgreSQL/Supabase'de çalıştırın

-- Önce mevcut tabloları temizle (dikkatli olun!)
DROP TABLE IF EXISTS jobs CASCADE;

-- Jobs tablosu (ana iş ilanları tablosu)
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    
    -- Provider bilgileri
    provider VARCHAR(50) NOT NULL DEFAULT 'adzuna',
    provider_id VARCHAR(255) NOT NULL,
    
    -- İş ilan bilgileri
    title TEXT,
    company VARCHAR(500),
    description TEXT,
    
    -- Lokasyon bilgileri
    city VARCHAR(255),
    region VARCHAR(255),
    country VARCHAR(10) NOT NULL,
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    
    -- İletişim/Başvuru
    url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Maaş bilgileri
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- İş türü bilgileri
    employment_type VARCHAR(100), -- full-time, part-time, contract, etc.
    contract_time VARCHAR(100),   -- permanent, temporary, etc.
    remote BOOLEAN DEFAULT FALSE,
    
    -- Tarih bilgileri
    posted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ham veri (debugging için)
    raw JSONB,
    
    -- Unique constraint
    CONSTRAINT unique_provider_job UNIQUE (provider, provider_id)
);

-- İndeksler (performans için)
CREATE INDEX idx_jobs_country ON jobs (country);
CREATE INDEX idx_jobs_city ON jobs (city);
CREATE INDEX idx_jobs_posted_at ON jobs (posted_at DESC);
CREATE INDEX idx_jobs_location ON jobs (lat, lon) WHERE lat IS NOT NULL AND lon IS NOT NULL;
CREATE INDEX idx_jobs_salary ON jobs (salary_min, salary_max) WHERE salary_min IS NOT NULL;
CREATE INDEX idx_jobs_title_search ON jobs USING GIN (to_tsvector('english', title));
CREATE INDEX idx_jobs_company_search ON jobs USING GIN (to_tsvector('english', company));

-- Updated_at trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Test verisi ekle
INSERT INTO jobs (
    provider, provider_id, title, company, city, region, country,
    lat, lon, url, posted_at, salary_min, salary_max, currency,
    employment_type, remote
) VALUES 
(
    'test', 'test-1', 
    'Senior Software Developer', 
    'Tech Corp', 
    'London', 'England', 'GB',
    51.5074, -0.1278,
    'https://example.com/job/1',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    70000, 90000, 'GBP',
    'full-time', false
),
(
    'test', 'test-2',
    'Frontend Developer',
    'Startup Inc',
    'Berlin', 'Berlin', 'DE', 
    52.5200, 13.4050,
    'https://example.com/job/2',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    50000, 70000, 'EUR',
    'full-time', true
);

-- Veritabanı durumunu kontrol et
SELECT 
    'jobs' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT country) as countries,
    COUNT(DISTINCT provider) as providers,
    MIN(posted_at) as oldest_job,
    MAX(posted_at) as newest_job
FROM jobs;

-- Ülke bazında özet
SELECT 
    country,
    COUNT(*) as job_count,
    COUNT(DISTINCT company) as company_count,
    AVG(salary_min) as avg_min_salary,
    AVG(salary_max) as avg_max_salary
FROM jobs 
WHERE salary_min IS NOT NULL 
GROUP BY country 
ORDER BY job_count DESC;

-- Başarılı kurulum mesajı
SELECT 'Database setup completed successfully!' as status;