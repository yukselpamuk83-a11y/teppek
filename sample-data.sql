-- TEST VERİLERİ - Production'da gerçek data için
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

INSERT INTO jobs (
    title, company, city, country, lat, lon, 
    source, salary_min, salary_max, currency, 
    remote, created_at
) VALUES
-- İstanbul Jobs
('Senior Frontend Developer', 'Tech Istanbul A.Ş.', 'Istanbul', 'Turkey', 41.0082, 28.9784, 'manual', 15000, 25000, 'TRY', false, NOW()),
('Backend Developer', 'Digital Solutions Ltd.', 'Istanbul', 'Turkey', 41.0351, 28.9833, 'manual', 12000, 20000, 'TRY', true, NOW()),
('Full Stack Developer', 'Startup Hub', 'Istanbul', 'Turkey', 41.0053, 28.9770, 'manual', 18000, 30000, 'TRY', false, NOW()),
('DevOps Engineer', 'Cloud Corp', 'Istanbul', 'Turkey', 41.0106, 28.9864, 'manual', 20000, 35000, 'TRY', true, NOW()),
('UI/UX Designer', 'Design Studio', 'Istanbul', 'Turkey', 41.0123, 28.9753, 'manual', 10000, 18000, 'TRY', false, NOW()),

-- Ankara Jobs  
('Software Engineer', 'Ankara Tech', 'Ankara', 'Turkey', 39.9334, 32.8597, 'manual', 12000, 22000, 'TRY', false, NOW()),
('React Developer', 'Capital Solutions', 'Ankara', 'Turkey', 39.9208, 32.8541, 'manual', 14000, 24000, 'TRY', true, NOW()),
('Product Manager', 'Innovation Labs', 'Ankara', 'Turkey', 39.9334, 32.8597, 'manual', 16000, 28000, 'TRY', false, NOW()),

-- İzmir Jobs
('Mobile Developer', 'Aegean Mobile', 'Izmir', 'Turkey', 38.4237, 27.1428, 'manual', 13000, 23000, 'TRY', false, NOW()),
('Data Scientist', 'Analytics Co', 'Izmir', 'Turkey', 38.4192, 27.1287, 'manual', 15000, 27000, 'TRY', true, NOW()),

-- International Jobs
('Senior Developer', 'Berlin Tech GmbH', 'Berlin', 'Germany', 52.5200, 13.4050, 'manual', 4500, 7500, 'EUR', true, NOW()),
('Frontend Engineer', 'Amsterdam Digital', 'Amsterdam', 'Netherlands', 52.3676, 4.9041, 'manual', 4000, 6500, 'EUR', false, NOW()),
('Full Stack Engineer', 'London Fintech', 'London', 'UK', 51.5074, -0.1278, 'manual', 4500, 8000, 'GBP', true, NOW()),
('Python Developer', 'NYC Startup', 'New York', 'USA', 40.7128, -74.0060, 'manual', 6000, 12000, 'USD', true, NOW()),
('Vue.js Developer', 'Paris Tech', 'Paris', 'France', 48.8566, 2.3522, 'manual', 3500, 6000, 'EUR', false, NOW());

-- Verify the insert
SELECT COUNT(*) as total_jobs, 
       COUNT(CASE WHEN remote = true THEN 1 END) as remote_jobs,
       COUNT(DISTINCT country) as countries
FROM jobs;