-- Add full_name and phone_number columns to user_preferences table
-- Phase 2: Profile Fields Extension

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN public.user_preferences.full_name IS 'User''s full name for display in profile';
COMMENT ON COLUMN public.user_preferences.phone_number IS 'User''s contact phone number';
