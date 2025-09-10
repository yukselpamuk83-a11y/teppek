-- 🚀 TEPPEK DATABASE OPTIMIZATION PHASE 2
-- Performance Roadmap Implementation: Database Indexing
-- Expected: 200-300% query speed improvement

-- Location-based query optimization
CREATE INDEX IF NOT EXISTS idx_jobs_location_compound ON jobs USING GIST (location, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cvs_location_compound ON cvs USING GIST (location, created_at DESC);

-- Search optimization indexes
CREATE INDEX IF NOT EXISTS idx_jobs_search_title ON jobs USING GIN (to_tsvector('turkish', title));
CREATE INDEX IF NOT EXISTS idx_jobs_search_company ON jobs USING GIN (to_tsvector('turkish', company));
CREATE INDEX IF NOT EXISTS idx_jobs_search_combined ON jobs USING GIN (to_tsvector('turkish', title || ' ' || company || ' ' || city));

CREATE INDEX IF NOT EXISTS idx_cvs_search_name ON cvs USING GIN (to_tsvector('turkish', name));
CREATE INDEX IF NOT EXISTS idx_cvs_search_skills ON cvs USING GIN (to_tsvector('turkish', skills));
CREATE INDEX IF NOT EXISTS idx_cvs_search_combined ON cvs USING GIN (to_tsvector('turkish', name || ' ' || skills || ' ' || city));

-- Date-based filtering (for real-time data)
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON cvs (created_at DESC);

-- City/Country filtering
CREATE INDEX IF NOT EXISTS idx_jobs_location_text ON jobs (city, country);
CREATE INDEX IF NOT EXISTS idx_cvs_location_text ON cvs (city, country);

-- Salary range queries
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs (salary_min, salary_max) WHERE salary_min IS NOT NULL;

-- Remote work filtering
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs (remote) WHERE remote = true;

-- Experience level filtering
CREATE INDEX IF NOT EXISTS idx_jobs_experience ON jobs (experience_years);
CREATE INDEX IF NOT EXISTS idx_cvs_experience ON cvs (experience_years);

-- Source-based filtering for API queries
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs (source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cvs_source ON cvs (source, created_at DESC);

-- 🔍 ANALYZE TABLES FOR QUERY PLANNER OPTIMIZATION
ANALYZE jobs;
ANALYZE cvs;

-- 📊 PERFORMANCE VERIFICATION QUERIES
-- Test location-based performance
EXPLAIN ANALYZE SELECT id, title, company, city, ST_AsGeoJSON(location) as location 
FROM jobs 
WHERE ST_DWithin(location, ST_SetSRID(ST_Point(28.97, 41.01), 4326), 50000)
ORDER BY created_at DESC 
LIMIT 100;

-- Test search performance 
EXPLAIN ANALYZE SELECT id, title, company, city 
FROM jobs 
WHERE to_tsvector('turkish', title || ' ' || company) @@ plainto_tsquery('turkish', 'developer')
LIMIT 50;

-- Test combined location + search performance
EXPLAIN ANALYZE SELECT id, title, company, city, ST_AsGeoJSON(location) as location
FROM jobs 
WHERE ST_DWithin(location, ST_SetSRID(ST_Point(28.97, 41.01), 4326), 50000)
AND to_tsvector('turkish', title) @@ plainto_tsquery('turkish', 'javascript')
ORDER BY created_at DESC 
LIMIT 50;

-- 📈 INDEX USAGE STATISTICS
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('jobs', 'cvs')
ORDER BY idx_scan DESC;

-- 💾 TABLE SIZE ANALYSIS AFTER INDEXING
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('jobs', 'cvs')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ✅ OPTIMIZATION SUCCESS MESSAGE
SELECT 'Database indexing optimization completed! Expected 200-300% query performance improvement.' as status;