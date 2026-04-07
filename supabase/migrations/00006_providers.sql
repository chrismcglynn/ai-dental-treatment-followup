-- Providers table (synced from PMS)
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  suffix text DEFAULT '',
  display_name text GENERATED ALWAYS AS (
    CASE
      WHEN suffix != '' THEN 'Dr. ' || last_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, external_id)
);

-- RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view providers"
  ON providers FOR SELECT
  USING (practice_id IN (
    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
  ));

-- Add provider reference to treatments
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);
CREATE INDEX IF NOT EXISTS idx_treatments_provider ON treatments (provider_id);

-- Add primary provider reference to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS primary_provider_id uuid REFERENCES providers(id);

-- Add providers_synced to sync_log
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS providers_synced integer NOT NULL DEFAULT 0;
