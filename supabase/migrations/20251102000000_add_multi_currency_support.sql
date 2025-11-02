ALTER TABLE contracts
ADD COLUMN currency TEXT;

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT,
  currency TEXT
);
