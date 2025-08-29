# 🔒 Row Level Security (RLS) Setup Guide

⚠️ **CRITICAL SECURITY REQUIREMENT**

This file contains the SQL commands that MUST be executed in your Supabase database to secure your application. Without these, your database is vulnerable to unauthorized access.

## 🚨 Immediate Action Required

Execute these SQL commands in your Supabase SQL Editor:

### 1. Enable RLS for Jobs Table

```sql
-- Enable Row Level Security for jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
```

### 2. Create RLS Policies for Jobs Table

```sql
-- Policy 1: Anyone can read job listings (jobs are public)
CREATE POLICY "Enable read access for all users"
ON public.jobs FOR SELECT
USING (true);

-- Policy 2: Only authenticated users can create jobs
CREATE POLICY "Enable insert for authenticated users only"
ON public.jobs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Users can only update their own jobs
CREATE POLICY "Enable update for own jobs only"
ON public.jobs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can only delete their own jobs
CREATE POLICY "Enable delete for own jobs only"
ON public.jobs FOR DELETE
USING (auth.uid() = user_id);
```

### 3. Add User ID Column (if not exists)

```sql
-- Add user_id column to track job ownership
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
```

### 4. Create User Profiles Table (Recommended)

```sql
-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('job_seeker', 'employer', 'company')),
  company_name TEXT,
  bio TEXT,
  location TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 5. Create Function to Auto-Create Profile

```sql
-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 6. Performance Optimization Indexes

```sql
-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON public.jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON public.jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON public.jobs(remote);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs(source);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_country_city ON public.jobs(country, city);
CREATE INDEX IF NOT EXISTS idx_jobs_search ON public.jobs USING GIN (to_tsvector('english', title || ' ' || company));
```

### 7. Additional Security Policies (Optional but Recommended)

```sql
-- Limit the number of jobs a user can create per day
CREATE OR REPLACE FUNCTION check_daily_job_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.jobs
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 day'
  ) >= 10 THEN
    RAISE EXCEPTION 'Daily job creation limit exceeded (10 jobs per day)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
CREATE TRIGGER enforce_daily_job_limit
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_job_limit();
```

## 🔧 How to Execute These Commands

1. **Open Supabase Dashboard**: Go to your project dashboard
2. **Navigate to SQL Editor**: Click on "SQL Editor" in the left sidebar
3. **Create New Query**: Click "New Query"
4. **Copy & Paste**: Copy each SQL block above and execute them one by one
5. **Verify**: Check that policies are created in the "Authentication" > "Policies" section

## ✅ Verification Steps

After executing the SQL commands, verify your setup:

1. **Check RLS Status**:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'jobs';
```

2. **List All Policies**:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'jobs';
```

3. **Test Policy (as authenticated user)**:
```sql
-- This should work for authenticated users
INSERT INTO jobs (title, company, lat, lon, user_id)
VALUES ('Test Job', 'Test Company', 40.7128, -74.0060, auth.uid());
```

## 🚨 Security Checklist

- [ ] RLS enabled on `jobs` table
- [ ] Read policy allows public access
- [ ] Insert policy requires authentication
- [ ] Update/Delete policies restrict to owner only
- [ ] `user_id` column exists and has foreign key constraint
- [ ] Profiles table created with proper RLS
- [ ] Auto-profile creation trigger set up
- [ ] Performance indexes created
- [ ] Rate limiting trigger configured (optional)

## 🔄 Migration for Existing Data

If you have existing jobs in your database without `user_id`:

```sql
-- Option 1: Set all existing jobs to a specific admin user
UPDATE public.jobs 
SET user_id = 'YOUR_ADMIN_USER_UUID_HERE'
WHERE user_id IS NULL;

-- Option 2: Delete all existing data (CAUTION!)
-- TRUNCATE public.jobs;
```

## 📞 Support

If you encounter any issues:
1. Check Supabase logs for error details
2. Verify user authentication status
3. Test with Supabase dashboard SQL editor
4. Check browser network tab for 403/401 errors

**Remember**: Without proper RLS policies, your application data is exposed to unauthorized access!