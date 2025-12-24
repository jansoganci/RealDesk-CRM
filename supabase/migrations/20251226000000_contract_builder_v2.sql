-- Contract Builder V2 Tables
-- New flexible schema for multiple contract types (sale, rent, commission, showing)

-- Contract Templates V2
-- Stores reusable contract templates with placeholder variables
CREATE TABLE IF NOT EXISTS contract_templates_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'rent', 'commission', 'showing')),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  placeholders TEXT[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Instances V2
-- Stores actual contract documents with JSONB for flexible form data
CREATE TABLE IF NOT EXISTS contract_instances_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates_v2(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'rent', 'commission', 'showing')),
  title TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  rendered_content TEXT NOT NULL,
  parties JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'signed', 'archived', 'cancelled')),
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_v2_user_type ON contract_templates_v2(user_id, type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_v2_is_default ON contract_templates_v2(user_id, type, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_contract_instances_v2_user_type ON contract_instances_v2(user_id, type);
CREATE INDEX IF NOT EXISTS idx_contract_instances_v2_status ON contract_instances_v2(user_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_instances_v2_created_at ON contract_instances_v2(created_at DESC);

-- GIN index for JSONB form_data search
CREATE INDEX IF NOT EXISTS idx_contract_instances_v2_form_data ON contract_instances_v2 USING GIN (form_data);
CREATE INDEX IF NOT EXISTS idx_contract_instances_v2_parties ON contract_instances_v2 USING GIN (parties);

-- Enable RLS
ALTER TABLE contract_templates_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_instances_v2 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_templates_v2
CREATE POLICY "Users can view their own templates"
  ON contract_templates_v2 FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON contract_templates_v2 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON contract_templates_v2 FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON contract_templates_v2 FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for contract_instances_v2
CREATE POLICY "Users can view their own instances"
  ON contract_instances_v2 FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own instances"
  ON contract_instances_v2 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instances"
  ON contract_instances_v2 FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instances"
  ON contract_instances_v2 FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contract_templates_v2_updated_at ON contract_templates_v2;
CREATE TRIGGER update_contract_templates_v2_updated_at
  BEFORE UPDATE ON contract_templates_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_instances_v2_updated_at ON contract_instances_v2;
CREATE TRIGGER update_contract_instances_v2_updated_at
  BEFORE UPDATE ON contract_instances_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE contract_templates_v2 IS 'Reusable contract templates with placeholder variables';
COMMENT ON TABLE contract_instances_v2 IS 'Actual contract instances with flexible JSONB form data';
COMMENT ON COLUMN contract_instances_v2.form_data IS 'JSONB field for flexible form data (seller, buyer, property, terms)';
COMMENT ON COLUMN contract_instances_v2.parties IS 'JSONB field for party information (seller, buyer, landlord, tenant, agent)';
