-- Supabase'de çalıştırmanız gereken SQL komutları
-- 100.000+ ilan için optimize edilmiş tablo

-- Ana listings tablosu
CREATE TABLE IF NOT EXISTS listings (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- İndeksler için
  is_remote BOOLEAN DEFAULT false,
  is_senior BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false
);

-- Performans için indeksler
CREATE INDEX idx_listings_country ON listings(location_country);
CREATE INDEX idx_listings_city ON listings(location_city);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listings_salary ON listings(salary_min, salary_max);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_location ON listings USING GIST (
  ST_MakePoint(location_lng, location_lat)
);

-- PostGIS extension (coğrafi sorgular için)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Yakındaki ilanları bulmak için fonksiyon
CREATE OR REPLACE FUNCTION nearby_listings(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INTEGER DEFAULT 50
)
RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM listings
  WHERE ST_DWithin(
    ST_MakePoint(location_lng, location_lat)::geography,
    ST_MakePoint(user_lng, user_lat)::geography,
    radius_km * 1000  -- metre cinsinden
  )
  ORDER BY 
    ST_Distance(
      ST_MakePoint(location_lng, location_lat)::geography,
      ST_MakePoint(user_lng, user_lat)::geography
    );
END;
$$ LANGUAGE plpgsql;

-- İstatistikler tablosu
CREATE TABLE IF NOT EXISTS fetch_stats (
  id SERIAL PRIMARY KEY,
  fetch_date DATE DEFAULT CURRENT_DATE,
  country VARCHAR(10),
  total_fetched INTEGER,
  api_calls_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Manuel ilanlar için tablo
CREATE TABLE IF NOT EXISTS manual_listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  company VARCHAR(500),
  description TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  contact TEXT,
  user_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- RLS (Row Level Security) - Güvenlik
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_listings ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Public listings are viewable by everyone" 
  ON listings FOR SELECT 
  USING (true);

-- Manuel ilanlar için kullanıcı bazlı yetki
CREATE POLICY "Users can insert their own manual listings" 
  ON manual_listings FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own manual listings" 
  ON manual_listings FOR UPDATE 
  USING (user_id = current_user);

-- View: Tüm ilanları birleştir
CREATE OR REPLACE VIEW all_listings AS
SELECT 
  'adzuna-' || adzuna_id as id,
  title,
  company,
  description,
  location_lat,
  location_lng,
  location_address,
  location_city,
  location_country,
  salary_min,
  salary_max,
  salary_currency,
  employment_type,
  category,
  apply_url,
  NULL as contact,
  source,
  created_at
FROM listings
UNION ALL
SELECT 
  'manual-' || id::text as id,
  title,
  company,
  description,
  location_lat,
  location_lng,
  location_address,
  NULL as location_city,
  'MANUAL' as location_country,
  salary_min,
  salary_max,
  'USD' as salary_currency,
  'Full-time' as employment_type,
  'General' as category,
  NULL as apply_url,
  contact,
  'manual' as source,
  created_at
FROM manual_listings
WHERE is_active = true;