-- ============================================================================
-- Schema evolution: create tables the app uses that weren't in 00001
-- The original 00001 created: practices, practice_members, patients,
-- treatment_plans, sequences, touchpoints (old schema).
-- The app evolved to use different table structures. Create them here.
-- ============================================================================

-- Update practices to match current app schema
ALTER TABLE practices ADD COLUMN IF NOT EXISTS pms_connected boolean DEFAULT false;
ALTER TABLE practices ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE practices DROP CONSTRAINT IF EXISTS practices_subscription_status_check;
UPDATE practices SET subscription_status = 'trialing' WHERE subscription_status = 'trial';
ALTER TABLE practices ALTER COLUMN subscription_status SET DEFAULT 'free';
ALTER TABLE practices ADD CONSTRAINT practices_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'free'));

-- Update patients to match current app schema
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_visit text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_appointment text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE patients DROP COLUMN IF EXISTS preferred_contact;
ALTER TABLE patients DROP COLUMN IF EXISTS do_not_contact;

-- Treatments (replaces the old treatment_plans table)
CREATE TABLE IF NOT EXISTS treatments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  code text not null,
  description text not null,
  amount numeric(10,2) not null default 0,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed')),
  presented_at timestamptz default now(),
  decided_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS treatments_practice_id_idx ON treatments(practice_id);
CREATE INDEX IF NOT EXISTS treatments_patient_id_idx ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS treatments_status_idx ON treatments(status);

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_treatments" ON treatments
  FOR ALL USING (practice_id IN (SELECT get_user_practice_ids()));

CREATE TRIGGER treatments_updated_at
  BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update sequences to match current schema
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS treatment_type text;
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS trigger_type text DEFAULT 'manual';
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS patient_count int DEFAULT 0;
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS conversion_rate numeric(5,2) DEFAULT 0;
ALTER TABLE sequences DROP COLUMN IF EXISTS procedure_filter;
ALTER TABLE sequences DROP COLUMN IF EXISTS is_active;
ALTER TABLE sequences DROP COLUMN IF EXISTS steps;

-- Rebuild touchpoints as sequence steps (drop old message-log version)
DROP TABLE IF EXISTS touchpoints CASCADE;
CREATE TABLE touchpoints (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid references sequences(id) on delete cascade not null,
  position int not null,
  channel text check (channel in ('sms', 'email', 'voicemail')),
  delay_days int default 0,
  delay_hours int default 0,
  subject text,
  body_template text default '',
  ai_personalize boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS touchpoints_sequence_id_idx ON touchpoints(sequence_id);

ALTER TABLE touchpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_touchpoints" ON touchpoints
  FOR ALL USING (sequence_id IN (
    SELECT id FROM sequences WHERE practice_id IN (SELECT get_user_practice_ids())
  ));

-- Sequence enrollments
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid references sequences(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  practice_id uuid references practices(id) on delete cascade not null,
  status text default 'active' check (status in ('active', 'completed', 'converted', 'opted_out', 'paused')),
  current_touchpoint int default 0,
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  converted_at timestamptz
);

CREATE INDEX IF NOT EXISTS sequence_enrollments_patient_id_idx ON sequence_enrollments(patient_id);
CREATE INDEX IF NOT EXISTS sequence_enrollments_sequence_id_idx ON sequence_enrollments(sequence_id);

ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_enrollments" ON sequence_enrollments
  FOR ALL USING (practice_id IN (SELECT get_user_practice_ids()));

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  enrollment_id uuid references sequence_enrollments(id) on delete set null,
  touchpoint_id uuid references touchpoints(id) on delete set null,
  channel text check (channel in ('sms', 'email', 'voicemail')),
  direction text check (direction in ('outbound', 'inbound')),
  status text default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed', 'received')),
  subject text,
  body text not null,
  external_id text,
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS messages_practice_id_idx ON messages(practice_id);
CREATE INDEX IF NOT EXISTS messages_patient_id_idx ON messages(patient_id);
CREATE INDEX IF NOT EXISTS messages_external_id_idx ON messages(external_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_messages" ON messages
  FOR ALL USING (practice_id IN (SELECT get_user_practice_ids()));

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  last_message_at timestamptz default now(),
  last_message_preview text,
  unread_count int default 0,
  status text default 'open' check (status in ('open', 'closed', 'archived')),
  assigned_to uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS conversations_practice_id_idx ON conversations(practice_id);
CREATE INDEX IF NOT EXISTS conversations_patient_id_idx ON conversations(patient_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_conversations" ON conversations
  FOR ALL USING (practice_id IN (SELECT get_user_practice_ids()));

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Portal tokens (original content of this migration)
-- ============================================================================

CREATE TABLE portal_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,
  patient_id uuid references patients(id) on delete cascade not null,
  treatment_id uuid references treatments(id) on delete cascade,
  practice_id uuid references practices(id) on delete cascade not null,
  purpose text default 'view_plan'
    check (purpose in ('view_plan', 'book')),
  expires_at timestamptz not null,
  used_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

CREATE INDEX portal_tokens_hash_idx ON portal_tokens(token_hash);
CREATE INDEX portal_tokens_patient_idx ON portal_tokens(patient_id);
CREATE INDEX portal_tokens_expires_idx ON portal_tokens(expires_at);

ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;

-- Service role only — portal tokens are never read by the browser client
CREATE POLICY "service_role_only" ON portal_tokens
  USING (false);
