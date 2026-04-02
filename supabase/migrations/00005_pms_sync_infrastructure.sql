-- Add external_id to treatments for PMS upsert matching
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_treatments_external_id
  ON treatments (practice_id, external_id)
  WHERE external_id IS NOT NULL;

-- Add metadata JSONB to practices (for PMS credentials + sync state)
-- Check if column already exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practices' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE practices ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Sync log table for tracking every sync run
CREATE TABLE IF NOT EXISTS sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  pms_type text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  patients_synced integer NOT NULL DEFAULT 0,
  treatments_synced integer NOT NULL DEFAULT 0,
  appointments_synced integer NOT NULL DEFAULT 0,
  auto_conversions integer NOT NULL DEFAULT 0,
  warnings jsonb DEFAULT '[]',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying sync history per practice
CREATE INDEX IF NOT EXISTS idx_sync_log_practice
  ON sync_log (practice_id, created_at DESC);

-- RLS: sync_log scoped to practice members
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view sync logs"
  ON sync_log FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members
      WHERE user_id = auth.uid()
    )
  );

-- Service role can insert (cron jobs run as service role)
CREATE POLICY "Service role can insert sync logs"
  ON sync_log FOR INSERT
  WITH CHECK (true);
