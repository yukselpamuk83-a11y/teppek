-- Fix RLS warning for spatial_ref_sys table
-- This table is created by PostGIS extension and contains read-only reference data

-- Enable RLS on spatial_ref_sys table
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow read access to everyone
-- This is safe since spatial_ref_sys only contains reference data
CREATE POLICY "Allow read access to spatial reference systems" ON public.spatial_ref_sys
    FOR SELECT
    TO public
    USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'spatial_ref_sys';