-- MINIMAL jobs tablosu - Sadece frontend'in ihtiyacı olan alanlar
DROP TABLE IF EXISTS jobs CASCADE;

CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  adzuna_id VARCHAR(50) UNIQUE NOT NULL,     -- Adzuna job ID
  
  -- Harita ve popup için kritik
  title VARCHAR(500) NOT NULL,               -- İlan başlığı
  company VARCHAR(200),                      -- Şirket adı
  description TEXT,                          -- İlan açıklaması (popup için)
  lat DECIMAL(10, 8) NOT NULL,              -- Enlem (harita)
  lon DECIMAL(11, 8) NOT NULL,              -- Boylam (harita)
  -- Başvuru bilgileri (farklı ilan türleri için)
  url TEXT,                                 -- API ilanları için başvuru linki  
  contact TEXT,                             -- Manuel ilanlar için iletişim
  
  -- Filtreleme ve arama için
  country VARCHAR(2) NOT NULL,              -- Ülke kodu (GB, US, etc)
  city VARCHAR(100),                        -- Şehir
  remote BOOLEAN DEFAULT false,             -- Remote iş mi
  
  -- Maaş bilgileri (zorunlu - form uyumlu)
  salary_min INTEGER NOT NULL,             -- Minimum maaş (zorunlu)
  salary_max INTEGER NOT NULL,             -- Maximum maaş (zorunlu) 
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Meta
  source VARCHAR(20) DEFAULT 'manual',      -- 'adzuna', 'manual', 'other-api'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indeksler 100K+ ilan için
CREATE INDEX idx_jobs_location ON jobs(lat, lon);           -- Harita sorguları
CREATE INDEX idx_jobs_country ON jobs(country);             -- Ülke filtresi  
CREATE INDEX idx_jobs_city ON jobs(city);                   -- Şehir filtresi
CREATE INDEX idx_jobs_remote ON jobs(remote) WHERE remote = true;
CREATE INDEX idx_jobs_salary ON jobs(salary_min, salary_max); -- Maaş filtresi
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);   -- Tarih sıralaması
CREATE INDEX idx_jobs_title_search ON jobs USING gin(to_tsvector('english', title)); -- Metin arama

-- Minimal test data
INSERT INTO jobs (
  adzuna_id, title, company, country, city, lat, lon, url,
  salary_min, salary_max, currency, remote
) VALUES 
  ('test-1', 'Software Developer', 'Tech Corp', 'GB', 'London', 51.5074, -0.1278, 
   'https://www.adzuna.co.uk/jobs/details/1', 50000, 70000, 'GBP', false),
  ('test-2', 'Data Scientist', 'Data Inc', 'US', 'New York', 40.7128, -74.0060, 
   'https://www.adzuna.com/jobs/details/2', 80000, 120000, 'USD', false),
  ('test-3', 'Remote Developer', 'Startup GmbH', 'DE', 'Berlin', 52.5200, 13.4050, 
   'https://www.adzuna.de/jobs/details/3', 60000, 90000, 'EUR', true);

-- Verification
SELECT COUNT(*) as total FROM jobs;
SELECT country, COUNT(*) FROM jobs GROUP BY country;
SELECT COUNT(*) as remote FROM jobs WHERE remote = true;