-- CV Timeline Data Schema Enhancement
-- Mevcut CVs tablosuna timeline desteği ekliyoruz

-- 1. Timeline JSON field ekle
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS timeline_data JSONB DEFAULT '[]';

-- 2. Timeline için index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_cvs_timeline_data ON cvs USING GIN (timeline_data);

-- 3. CV görünürlük ve meta data fieldları
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS is_timeline_public BOOLEAN DEFAULT TRUE;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS github_url TEXT;

-- 4. Timeline data örnek format (JSON Schema)
COMMENT ON COLUMN cvs.timeline_data IS '
Timeline data format:
[
  {
    "id": "uuid-string",
    "type": "education|internship|military|work|gap|current_work", 
    "title": "İş/Eğitim Başlığı",
    "organization": "Kurum Adı",
    "location": "İstanbul, Turkey",
    "start_date": "2020-09-01",
    "end_date": "2024-06-15", // null if current
    "is_current": false,
    "description": "Detaylı açıklama",
    "skills": ["React", "Node.js", "PostgreSQL"],
    "achievements": ["Proje lideri", "Performans ödülü"],
    "color": "#6366f1", // hex color for timeline block
    "display_order": 1
  }
]
';

-- 5. Timeline type enum için check constraint
ALTER TABLE cvs ADD CONSTRAINT check_timeline_types 
CHECK (
  timeline_data IS NULL OR
  (
    SELECT bool_and(
      item->>'type' IN ('education', 'internship', 'military', 'work', 'gap', 'current_work')
    )
    FROM jsonb_array_elements(timeline_data) AS item
  )
);

-- 6. Full-text search için tsvector column (timeline içeriği için)
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS timeline_search_vector TSVECTOR;

-- Timeline search index
CREATE INDEX IF NOT EXISTS idx_cvs_timeline_search 
ON cvs USING GIN (timeline_search_vector);

-- Timeline search vector güncelleme trigger
CREATE OR REPLACE FUNCTION update_cv_timeline_search_vector() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.timeline_search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(item->>'title', ' ') FROM jsonb_array_elements(NEW.timeline_data) AS item), 
      ''
    )), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cv_timeline_search_update
  BEFORE INSERT OR UPDATE ON cvs
  FOR EACH ROW EXECUTE FUNCTION update_cv_timeline_search_vector();

-- 7. Timeline data validation function
CREATE OR REPLACE FUNCTION validate_timeline_data(timeline_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if all required fields exist for each timeline item
  RETURN (
    SELECT bool_and(
      item ? 'id' AND 
      item ? 'type' AND 
      item ? 'title' AND 
      item ? 'start_date' AND
      (item->>'start_date')::date IS NOT NULL
    )
    FROM jsonb_array_elements(timeline_json) AS item
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Timeline data validation constraint
ALTER TABLE cvs ADD CONSTRAINT check_timeline_data_valid
CHECK (timeline_data IS NULL OR validate_timeline_data(timeline_data));

-- 8. Sample timeline data insertion (test için)
-- INSERT INTO cvs (
--   user_id, full_name, title, description, lat, lon, country, city, contact,
--   timeline_data, is_timeline_public
-- ) VALUES (
--   'sample_user_1',
--   'Ahmet Yılmaz', 
--   'Senior Software Developer',
--   'Full-stack developer with 8 years experience',
--   41.0082, 28.9784, 'Turkey', 'Istanbul',
--   'ahmet@example.com',
--   '[
--     {
--       "id": "timeline_1",
--       "type": "education",
--       "title": "Computer Engineering",
--       "organization": "Istanbul Technical University",
--       "location": "Istanbul, Turkey", 
--       "start_date": "2012-09-01",
--       "end_date": "2016-06-30",
--       "is_current": false,
--       "description": "Bachelor of Science in Computer Engineering. GPA: 3.4/4.0",
--       "skills": ["C++", "Data Structures", "Algorithms", "Database Systems"],
--       "achievements": ["Dean''s List", "Software Competition Winner"],
--       "color": "#8B5CF6",
--       "display_order": 1
--     },
--     {
--       "id": "timeline_2", 
--       "type": "internship",
--       "title": "Software Development Intern",
--       "organization": "TechCorp Istanbul",
--       "location": "Istanbul, Turkey",
--       "start_date": "2015-07-01", 
--       "end_date": "2015-09-30",
--       "is_current": false,
--       "description": "Summer internship focusing on web development and database design",
--       "skills": ["PHP", "MySQL", "JavaScript", "HTML/CSS"],
--       "achievements": ["Completed 3 production features"],
--       "color": "#06B6D4",
--       "display_order": 2
--     },
--     {
--       "id": "timeline_3",
--       "type": "military", 
--       "title": "Military Service",
--       "organization": "Turkish Armed Forces",
--       "location": "Ankara, Turkey",
--       "start_date": "2016-07-01",
--       "end_date": "2017-01-15", 
--       "is_current": false,
--       "description": "Mandatory military service, IT support role",
--       "skills": ["Network Administration", "System Maintenance"],
--       "achievements": ["Outstanding Service Award"],
--       "color": "#F59E0B",
--       "display_order": 3
--     },
--     {
--       "id": "timeline_4",
--       "type": "work",
--       "title": "Junior Software Developer", 
--       "organization": "StartupXYZ",
--       "location": "Istanbul, Turkey",
--       "start_date": "2017-02-01",
--       "end_date": "2019-08-30",
--       "is_current": false,
--       "description": "Full-stack development in a fast-paced startup environment",
--       "skills": ["React", "Node.js", "MongoDB", "Express"],
--       "achievements": ["Led mobile app project", "Reduced load times by 40%"],
--       "color": "#3B82F6", 
--       "display_order": 4
--     },
--     {
--       "id": "timeline_5",
--       "type": "gap",
--       "title": "Career Break & Freelancing",
--       "organization": "Self-employed", 
--       "location": "Istanbul, Turkey",
--       "start_date": "2019-09-01",
--       "end_date": "2020-02-28",
--       "is_current": false,
--       "description": "Took time for skill development and freelance projects", 
--       "skills": ["Python", "Machine Learning", "AWS"],
--       "achievements": ["Completed 5 freelance projects", "AWS Certification"],
--       "color": "#6B7280",
--       "display_order": 5
--     },
--     {
--       "id": "timeline_6",
--       "type": "current_work",
--       "title": "Senior Software Developer",
--       "organization": "TechGiant Corp",
--       "location": "Istanbul, Turkey", 
--       "start_date": "2020-03-01",
--       "end_date": null,
--       "is_current": true,
--       "description": "Leading development of enterprise-scale applications",
--       "skills": ["React", "TypeScript", "PostgreSQL", "Docker", "Kubernetes"],
--       "achievements": ["Promoted to Senior", "Team Lead for 3 projects"],
--       "color": "#10B981",
--       "display_order": 6
--     }
--   ]'::jsonb,
--   true
-- );

-- 9. Query optimization için composite indexes
CREATE INDEX IF NOT EXISTS idx_cvs_location_timeline 
ON cvs (lat, lon, is_timeline_public) 
WHERE available_for_work = true;

CREATE INDEX IF NOT EXISTS idx_cvs_skills_search
ON cvs USING GIN ((timeline_data -> 'skills'));

-- 10. Timeline analytics view (isteğe bağlı)
CREATE OR REPLACE VIEW cv_timeline_analytics AS
SELECT 
  c.id,
  c.full_name,
  c.city,
  c.country,
  jsonb_array_length(c.timeline_data) as timeline_items_count,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(c.timeline_data) AS item
    WHERE item->>'type' = 'work' OR item->>'type' = 'current_work'
  ) AS work_experiences_count,
  (
    SELECT MAX((item->>'start_date')::date)
    FROM jsonb_array_elements(c.timeline_data) AS item
    WHERE item->>'type' = 'education'
  ) AS latest_education_date,
  (
    SELECT COUNT(DISTINCT skill.value)
    FROM jsonb_array_elements(c.timeline_data) AS item,
         jsonb_array_elements_text(item->'skills') AS skill
  ) AS unique_skills_count
FROM cvs c
WHERE c.timeline_data IS NOT NULL 
  AND jsonb_array_length(c.timeline_data) > 0
  AND c.is_timeline_public = true;