-- CCPA Data Subject Requests table
-- Stores know / delete / opt-out requests from California consumers.
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by            UUID REFERENCES auth.users(id),

  -- Requester identity
  requester_name          TEXT NOT NULL,
  requester_email         TEXT NOT NULL,
  requester_phone         TEXT,
  relationship_to_org     TEXT NOT NULL
    CHECK (relationship_to_org IN ('tenant', 'buyer', 'seller', 'lead', 'other')),
  relationship_description TEXT,

  -- Request details
  request_type            TEXT NOT NULL
    CHECK (request_type IN ('know', 'delete', 'opt_out_sale', 'opt_out_share', 'correct')),
  details                 TEXT,

  -- Status tracking
  status                  TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'verification_sent', 'completed', 'denied')),
  status_notes            TEXT,
  verified_at             TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,

  -- For deletion requests: audit trail of what was done
  deletion_summary        TEXT,
  data_disclosed_at       TIMESTAMPTZ,

  -- Metadata
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_data_subject_requests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_data_subject_requests_updated_at
  BEFORE UPDATE ON data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION update_data_subject_requests_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dsr_org_id      ON data_subject_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status      ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsr_request_type ON data_subject_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_dsr_created_at  ON data_subject_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_dsr_email       ON data_subject_requests(requester_email);

-- Row Level Security
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Org members can view requests for their org
CREATE POLICY "dsr_select" ON data_subject_requests
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Authenticated users can insert (public request submission handled at app layer)
CREATE POLICY "dsr_insert" ON data_subject_requests
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Only org members can update
CREATE POLICY "dsr_update" ON data_subject_requests
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Soft delete only — no hard DELETE policy granted
