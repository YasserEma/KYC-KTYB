-- Migration: Add display_name column to profiles table
-- Run this in your Supabase SQL Editor

-- Add the missing display_name column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing records to use full_name as display_name if it exists
UPDATE profiles 
SET display_name = COALESCE(full_name, email) 
WHERE display_name IS NULL;

-- Make display_name NOT NULL after populating existing records
ALTER TABLE profiles ALTER COLUMN display_name SET NOT NULL;

-- Optional: Remove full_name and avatar_url columns if they exist and are not needed
-- ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_url;