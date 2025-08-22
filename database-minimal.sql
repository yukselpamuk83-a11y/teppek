-- Teppek Minimal Database Setup - Sadece Gerekli Alanlar
-- Gereksiz alan yok, sadece harita ve iş arama için gerekli veriler

DROP TABLE IF EXISTS jobs CASCADE;

-- Minimal jobs tablosu - Sadece gerekli alanlar
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    
    -- Temel iş bilgileri (ZORUNLU)
    provider_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    company VARCHAR(300),
    
    -- Lokasyon (ZORUNLU - Harita için)
    country VARCHAR(5) NOT NULL,
    city VARCHAR(100),
    lat DECIMAL(10, 6),
    lon DECIMAL(11, 6),
    
    -- Başvuru linki (ZORUNLU)
    url TEXT NOT NULL,
    
    -- Maaş (OPSIYONEL - Ama önemli)
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(5) DEFAULT 'USD',
    
    -- İş türü (Filtreleme için)
    employment_type VARCHAR(50), -- full-time, part-time, contract
    remote BOOLEAN DEFAULT FALSE,
    
    -- Tarih (Sıralama için)
    posted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Tekrar etmesin
    CONSTRAINT unique_provider_job UNIQUE (provider_id)
);

-- Sadece performans kritik indeksler
CREATE INDEX idx_jobs_country ON jobs (country);
CREATE INDEX idx_jobs_location ON jobs (lat, lon) WHERE lat IS NOT NULL AND lon IS NOT NULL;
CREATE INDEX idx_jobs_posted_at ON jobs (posted_at DESC);
CREATE INDEX idx_jobs_title ON jobs USING GIN (to_tsvector('english', title));

-- Test verisi - 2 minimal kayıt
INSERT INTO jobs (
    provider_id, title, company, country, city, lat, lon, 
    url, salary_min, salary_max, currency, employment_type, 
    posted_at
) VALUES 
('test-1', 'Senior Developer', 'Tech Corp', 'GB', 'London', 
 51.5074, -0.1278, 'https://example.com/job/1', 
 70000, 90000, 'GBP', 'full-time', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('test-2', 'Frontend Developer', 'Startup Inc', 'DE', 'Berlin', 
 52.5200, 13.4050, 'https://example.com/job/2', 
 50000, 70000, 'EUR', 'full-time', CURRENT_TIMESTAMP - INTERVAL '2 days');

SELECT 'Minimal database ready! 🎯' as status;
SELECT COUNT(*) as records FROM jobs;