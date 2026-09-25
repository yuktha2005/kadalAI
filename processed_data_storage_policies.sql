-- Supabase Storage Bucket Policies for processed-data
-- Run this in your Supabase SQL Editor to allow file reads
-- IMPORTANT: This fixes the "0 files found" issue

-- Step 1: Ensure the processed-data bucket exists
-- Go to Supabase Dashboard > Storage > New Bucket
-- Name: processed-data
-- Public: Yes (or No with proper policies)
-- Or run this SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('processed-data', 'processed-data', false) ON CONFLICT DO NOTHING;

-- Step 2: Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Allow public reads from processed-data" ON storage.objects;
DROP POLICY IF EXISTS "Allow public selects from processed-data" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from processed-data" ON storage.objects;

-- IMPORTANT: Since the app uses anon key (not authenticated users), we need public policies
-- If you want more security, use authenticated policies and implement user authentication

-- Policy to allow public/anonymous reads from processed-data bucket
CREATE POLICY "Allow public reads from processed-data"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'processed-data');

-- Alternative: If the above doesn't work, try this more permissive policy
-- CREATE POLICY "Allow public reads from processed-data"
-- ON storage.objects FOR SELECT
-- TO public
-- WITH CHECK (bucket_id = 'processed-data');

-- Note: If your bucket is PUBLIC, you might not need these policies
-- But if it's PRIVATE, these policies are required

-- To check if policies are working, run this query:
-- SELECT * FROM storage.objects WHERE bucket_id = 'processed-data' LIMIT 10;

