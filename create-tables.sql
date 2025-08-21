-- Supabase'de çalıştırın
-- Önce eski tabloyu silelim (varsa)
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS manual_listings CASCADE;
DROP TABLE IF EXISTS fetch_stats CASCADE;

-- Ana listings tablosu
CREATE TABLE listings (
  id BIGSERIAL PRIMARY KEY,
  adzuna_id VARCHAR(255) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company VARCHAR(500),
  description TEXT,
  
  -- Lokasyon bilgileri
  location_city VARCHAR(255),
  location_country VARCHAR(10),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  
  -- Maaş bilgileri
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'USD',
  salary_is_predicted BOOLEAN DEFAULT false,
  
  -- İş detayları
  employment_type VARCHAR(100),
  contract_time VARCHAR(100),
  category VARCHAR(255),
  
  -- Başvuru
  apply_url TEXT,
  
  -- Meta
  source VARCHAR(50) DEFAULT 'adzuna',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_listings_country ON listings(location_country);
CREATE INDEX idx_listings_city ON listings(location_city);
CREATE INDEX idx_listings_created ON listings(created_at DESC);

-- Test verisi ekleyelim
INSERT INTO listings (
  adzuna_id, title, company, description, 
  location_city, location_country, location_lat, location_lng, location_address,
  salary_min, salary_max, employment_type, category, apply_url
) VALUES 
  ('test-1', 'Software Developer', 'Tech Corp', 'Great opportunity', 
   'London', 'gb', 51.5074, -0.1278, 'London, UK',
   50000, 70000, 'Full-time', 'IT Jobs', 'https://www.adzuna.co.uk/jobs/details/1'),
  ('test-2', 'Data Scientist', 'Data Inc', 'Work with big data', 
   'New York', 'us', 40.7128, -74.0060, 'New York, USA',
   80000, 120000, 'Full-time', 'IT Jobs', 'https://www.adzuna.com/jobs/details/2'),
  ('test-3', 'Product Manager', 'Startup GmbH', 'Lead our product', 
   'Berlin', 'de', 52.5200, 13.4050, 'Berlin, Germany',
   60000, 90000, 'Full-time', 'IT Jobs', 'https://www.adzuna.de/jobs/details/3');

-- Kontrol edelim
SELECT COUNT(*) as total_count FROM listings;
SELECT location_country, COUNT(*) as count 
FROM listings 
GROUP BY location_country;