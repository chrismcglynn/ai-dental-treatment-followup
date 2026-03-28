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
  phone text,
  email text,
  timezone text default 'America/Denver',
  subscription_status text default 'trial' check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
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
  preferred_contact text default 'sms' check (preferred_contact in ('sms', 'email', 'voicemail')),
  do_not_contact boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(practice_id, external_id)
);

-- Treatment plans
create table treatment_plans (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  external_plan_id text,
  procedure_codes text[],
  procedure_description text not null,
  estimated_value numeric(10,2),
  status text default 'pending' check (status in ('pending', 'in_sequence', 'booked', 'declined', 'archived')),
  plan_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sequences (follow-up templates per practice)
create table sequences (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  name text not null,
  description text,
  procedure_filter text[],               -- if empty, applies to all
  is_active boolean default true,
  steps jsonb not null default '[]',     -- array of step config objects
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sequence step config (stored in sequences.steps as JSONB array):
-- {
--   step_number: number,
--   day_offset: number,          // days after plan detected
--   channel: 'sms' | 'email' | 'voicemail',
--   tone: 'friendly' | 'clinical' | 'urgent',
--   template_override: string | null   // null = use AI generation
-- }

-- Touchpoints (individual message log)
create table touchpoints (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade not null,
  treatment_plan_id uuid references treatment_plans(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  sequence_id uuid references sequences(id),
  step_number int,
  channel text check (channel in ('sms', 'email', 'voicemail')),
  direction text default 'outbound' check (direction in ('outbound', 'inbound')),
  status text default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed', 'replied', 'bounced')),
  message_body text,
  external_message_id text,             -- Twilio SID or Resend ID
  sent_at timestamptz,
  delivered_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index patients_practice_id_idx on patients(practice_id);
create index treatment_plans_practice_id_idx on treatment_plans(practice_id);
create index treatment_plans_status_idx on treatment_plans(status);
create index touchpoints_practice_id_idx on touchpoints(practice_id);
create index touchpoints_treatment_plan_id_idx on touchpoints(treatment_plan_id);
create index touchpoints_direction_idx on touchpoints(direction);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table practices enable row level security;
alter table practice_members enable row level security;
alter table patients enable row level security;
alter table treatment_plans enable row level security;
alter table sequences enable row level security;
alter table touchpoints enable row level security;

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

create policy "members_own_plans" on treatment_plans
  for all using (practice_id in (select get_user_practice_ids()));

create policy "members_own_sequences" on sequences
  for all using (practice_id in (select get_user_practice_ids()));

create policy "members_own_touchpoints" on touchpoints
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

create trigger treatment_plans_updated_at
  before update on treatment_plans
  for each row execute function update_updated_at();

create trigger sequences_updated_at
  before update on sequences
  for each row execute function update_updated_at();
