-- RLS Performance Optimization
-- Problem: auth.uid() her satır için tekrar tekrar çalışıyor
-- Çözüm: (SELECT auth.uid()) ile tek seferde hesapla

-- =================
-- JOBS TABLE POLICIES
-- =================

-- 1. jobs_insert_policy optimize et
DROP POLICY IF EXISTS jobs_insert_policy ON jobs;
CREATE POLICY "jobs_insert_policy" ON "public"."jobs"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (
    (user_id = (SELECT auth.uid())) OR 
    (user_id IS NULL) OR
    (source = 'adzuna') OR 
    (source = 'manual')
);

-- 2. jobs_update_policy optimize et  
DROP POLICY IF EXISTS jobs_update_policy ON jobs;
CREATE POLICY "jobs_update_policy" ON "public"."jobs"
AS PERMISSIVE FOR UPDATE  
TO public
USING (
    (user_id = (SELECT auth.uid())) OR
    (user_id IS NULL)
)
WITH CHECK (
    (user_id = (SELECT auth.uid())) OR
    (user_id IS NULL)
);

-- 3. jobs_delete_policy optimize et
DROP POLICY IF EXISTS jobs_delete_policy ON jobs;
CREATE POLICY "jobs_delete_policy" ON "public"."jobs"
AS PERMISSIVE FOR DELETE
TO public
USING (
    (user_id = (SELECT auth.uid())) OR
    (user_id IS NULL)
);

-- =================
-- CVS TABLE POLICIES  
-- =================

-- 4. cvs_insert_policy optimize et
DROP POLICY IF EXISTS cvs_insert_policy ON cvs;
CREATE POLICY "cvs_insert_policy" ON "public"."cvs"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (
    (user_id = (SELECT auth.uid())) OR 
    (user_id IS NULL) OR
    (user_id = 'anonymous')
);

-- 5. cvs_update_policy optimize et
DROP POLICY IF EXISTS cvs_update_policy ON cvs;  
CREATE POLICY "cvs_update_policy" ON "public"."cvs"
AS PERMISSIVE FOR UPDATE
TO public
USING (
    (user_id = (SELECT auth.uid())) OR
    (user_id IS NULL)
)
WITH CHECK (
    (user_id = (SELECT auth.uid())) OR
    (user_id IS NULL)
);

-- 6. cvs_delete_policy optimize et
DROP POLICY IF EXISTS cvs_delete_policy ON cvs;
CREATE POLICY "cvs_delete_policy" ON "public"."cvs"
AS PERMISSIVE FOR DELETE
TO public
USING (
    (user_id = (SELECT auth.uid())) OR
    (user_id IS NULL)
);

-- =================
-- VERIFICATION
-- =================

-- RLS policy'lerini kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('jobs', 'cvs')
ORDER BY tablename, policyname;

-- Performance test için explain plan
EXPLAIN ANALYZE SELECT COUNT(*) FROM jobs WHERE user_id IS NULL;
EXPLAIN ANALYZE SELECT COUNT(*) FROM cvs WHERE user_id IS NULL;