
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, -- Auto-generated: "Meeting with [Name]" or "Property: [Address]"
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES property_owners(id) ON DELETE SET NULL,
  notes TEXT,
  reminder_minutes INTEGER DEFAULT 30, -- 30, 40, or 60
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users to manage their own meetings
CREATE POLICY "Users can view their own meetings." ON meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings." ON meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings." ON meetings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings." ON meetings
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_meetings_user_id ON meetings (user_id);
CREATE INDEX idx_meetings_start_time ON meetings (start_time);
CREATE INDEX idx_meetings_tenant_id ON meetings (tenant_id);
CREATE INDEX idx_meetings_property_id ON meetings (property_id);
CREATE INDEX idx_meetings_owner_id ON meetings (owner_id);
