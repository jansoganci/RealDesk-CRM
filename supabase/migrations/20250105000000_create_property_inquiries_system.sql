-- Property Inquiries & Matching System Migration
-- Phase 1: Database Schema

-- Table 1: property_inquiries
CREATE TABLE property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  preferred_city text,
  preferred_district text,
  min_budget numeric,
  max_budget numeric,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_inquiry_status CHECK (status IN ('active','matched','contacted','closed'))
);

CREATE INDEX idx_inquiries_status ON property_inquiries(status);
CREATE INDEX idx_inquiries_city ON property_inquiries(preferred_city);
CREATE INDEX idx_inquiries_district ON property_inquiries(preferred_district);
CREATE INDEX idx_inquiries_active ON property_inquiries(status) WHERE status='active';

ALTER TABLE property_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inquiries"
  ON property_inquiries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create inquiries"
  ON property_inquiries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update inquiries"
  ON property_inquiries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inquiries"
  ON property_inquiries FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON property_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table 2: inquiry_matches
CREATE TABLE inquiry_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES property_inquiries(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  matched_at timestamptz DEFAULT now(),
  notification_sent boolean DEFAULT false,
  contacted boolean DEFAULT false,
  UNIQUE(inquiry_id, property_id)
);

CREATE INDEX idx_matches_inquiry ON inquiry_matches(inquiry_id);
CREATE INDEX idx_matches_property ON inquiry_matches(property_id);
CREATE INDEX idx_matches_notification ON inquiry_matches(notification_sent) WHERE notification_sent=false;

ALTER TABLE inquiry_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view matches"
  ON inquiry_matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create matches"
  ON inquiry_matches FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update matches"
  ON inquiry_matches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete matches"
  ON inquiry_matches FOR DELETE TO authenticated USING (true);

-- Table 3: properties update
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS rent_amount numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD' CHECK (currency IN ('USD','TRY'));

CREATE INDEX IF NOT EXISTS idx_properties_status_city_district
  ON properties(status, city, district) WHERE status='Empty';
