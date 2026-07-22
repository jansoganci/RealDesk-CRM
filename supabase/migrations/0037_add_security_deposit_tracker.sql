-- Security Deposit Tracker tables (Sprint 7)

CREATE TABLE security_deposit_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  deposit_amount NUMERIC(12,2) NOT NULL CHECK (deposit_amount >= 0),
  held_by TEXT NOT NULL DEFAULT 'landlord'
    CHECK (held_by IN ('landlord', 'escrow', 'government_agency', 'other')),
  held_by_other_description TEXT,
  return_deadline DATE NOT NULL,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'partially_returned', 'fully_returned', 'disputed')),
  interest_required BOOLEAN DEFAULT FALSE,
  interest_amount NUMERIC(12,2),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE deposit_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID NOT NULL REFERENCES security_deposit_tracker(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category TEXT
    CHECK (category IN ('damage', 'cleaning', 'unpaid_rent', 'late_fees', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_security_deposit_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_deposit_tracker_updated_at
  BEFORE UPDATE ON security_deposit_tracker
  FOR EACH ROW EXECUTE FUNCTION update_security_deposit_tracker_updated_at();

-- Indexes
CREATE INDEX idx_security_deposit_tracker_org_id ON security_deposit_tracker(org_id);
CREATE INDEX idx_security_deposit_tracker_status ON security_deposit_tracker(status);
CREATE INDEX idx_security_deposit_tracker_return_deadline ON security_deposit_tracker(return_deadline);
CREATE INDEX idx_deposit_deductions_deposit_id ON deposit_deductions(deposit_id);

-- RLS: security_deposit_tracker
ALTER TABLE security_deposit_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select" ON security_deposit_tracker
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "insert" ON security_deposit_tracker
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "update" ON security_deposit_tracker
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "delete" ON security_deposit_tracker
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS: deposit_deductions (scoped via deposit's org_id)
ALTER TABLE deposit_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select" ON deposit_deductions
  FOR SELECT USING (
    deposit_id IN (
      SELECT id FROM security_deposit_tracker
      WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "insert" ON deposit_deductions
  FOR INSERT WITH CHECK (
    deposit_id IN (
      SELECT id FROM security_deposit_tracker
      WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "update" ON deposit_deductions
  FOR UPDATE USING (
    deposit_id IN (
      SELECT id FROM security_deposit_tracker
      WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "delete" ON deposit_deductions
  FOR DELETE USING (
    deposit_id IN (
      SELECT id FROM security_deposit_tracker
      WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );
