
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS meeting_reminder_minutes INTEGER DEFAULT 30;

-- Also, add a check constraint to ensure only allowed values are entered
ALTER TABLE public.user_preferences
ADD CONSTRAINT allowed_reminder_minutes CHECK (meeting_reminder_minutes IN (30, 40, 60));
