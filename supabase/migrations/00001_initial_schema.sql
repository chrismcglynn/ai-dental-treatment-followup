-- Migration: 00001_initial_schema
-- Description: Core tables, indexes, RLS policies for multi-tenant dental practice SaaS
-- Run with: supabase db push (or paste into Supabase SQL Editor)

-- pgcrypto provides gen_random_uuid(), built into Supabase
create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Practices (tenants)
create table practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  pms_type text check (pms_type in ('open_dental', 'dentrix', 'eaglesoft', 'manual')),
  pms_credentials jsonb,                  -- encrypted at app layer before storing
  pms_connected boolean default false,
  phone text,
  email text,
  address text,
  timezone text default 'America/Denver',
  subscription_status text default 'free' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'free')),
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Practice members (users belong to practices)
create table practice_members (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique(practice_id, user_id)
);

-- Patients
create table patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  external_id text,                       -- PMS patient ID
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  date_of_birth text,
  last_visit text,
  next_appointment text,
  status text default 'active' check (status in ('active', 'inactive', 'archived')),
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(practice_id, external_id)
);

-- Treatments (individual procedures per patient)
create table treatments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  code text not null,                      -- ADA procedure code (e.g. D2740)
  description text not null,
  amount numeric(10,2) not null default 0,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed')),
  presented_at timestamptz default now(),
  decided_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sequences (follow-up campaign templates per practice)
create table sequences (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  name text not null,
  description text,
  treatment_type text,                    -- comma-separated ADA codes
  status text default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  trigger_type text default 'manual' check (trigger_type in ('manual', 'treatment_declined', 'no_show', 'schedule')),
  patient_count int default 0,
  conversion_rate numeric(5,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Touchpoints (steps within a sequence)
create table touchpoints (
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

-- Sequence enrollments (patient in a sequence)
create table sequence_enrollments (
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

-- Messages (sent/received communications)
create table messages (
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
  external_id text,                       -- Twilio SID or Resend ID
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Conversations (inbox threads)
create table conversations (
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

-- ============================================================================
-- INDEXES
-- ============================================================================

create index patients_practice_id_idx on patients(practice_id);
create index treatments_practice_id_idx on treatments(practice_id);
create index treatments_patient_id_idx on treatments(patient_id);
create index treatments_status_idx on treatments(status);
create index touchpoints_sequence_id_idx on touchpoints(sequence_id);
create index messages_practice_id_idx on messages(practice_id);
create index messages_patient_id_idx on messages(patient_id);
create index messages_external_id_idx on messages(external_id);
create index conversations_practice_id_idx on conversations(practice_id);
create index conversations_patient_id_idx on conversations(patient_id);
create index sequence_enrollments_patient_id_idx on sequence_enrollments(patient_id);
create index sequence_enrollments_sequence_id_idx on sequence_enrollments(sequence_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table practices enable row level security;
alter table practice_members enable row level security;
alter table patients enable row level security;
alter table treatments enable row level security;
alter table sequences enable row level security;
alter table touchpoints enable row level security;
alter table sequence_enrollments enable row level security;
alter table messages enable row level security;
alter table conversations enable row level security;

-- Helper function: get practice IDs for current user
create or replace function get_user_practice_ids()
returns setof uuid language sql security definer as $$
  select practice_id from practice_members where user_id = auth.uid();
$$;

-- RLS policies: users only see their practices' data
create policy "members_own_practice" on practices
  for all using (id in (select get_user_practice_ids()));

create policy "members_see_own_membership" on practice_members
  for all using (practice_id in (select get_user_practice_ids()));

create policy "members_own_patients" on patients
  for all using (practice_id in (select get_user_practice_ids()));

create policy "members_own_treatments" on treatments
  for all using (practice_id in (select get_user_practice_ids()));

create policy "members_own_sequences" on sequences
  for all using (practice_id in (select get_user_practice_ids()));

create policy "members_own_touchpoints" on touchpoints
  for all using (sequence_id in (
    select id from sequences where practice_id in (select get_user_practice_ids())
  ));

create policy "members_own_enrollments" on sequence_enrollments
  for all using (practice_id in (select get_user_practice_ids()));

create policy "members_own_messages" on messages
  for all using (practice_id in (select get_user_practice_ids()));

create policy "members_own_conversations" on conversations
  for all using (practice_id in (select get_user_practice_ids()));

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger practices_updated_at
  before update on practices
  for each row execute function update_updated_at();

create trigger patients_updated_at
  before update on patients
  for each row execute function update_updated_at();

create trigger treatments_updated_at
  before update on treatments
  for each row execute function update_updated_at();

create trigger sequences_updated_at
  before update on sequences
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();
