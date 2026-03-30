create table portal_tokens (
  id uuid primary key default uuid_generate_v4(),
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

create index portal_tokens_hash_idx on portal_tokens(token_hash);
create index portal_tokens_patient_idx on portal_tokens(patient_id);
create index portal_tokens_expires_idx on portal_tokens(expires_at);

alter table portal_tokens enable row level security;

-- Service role only — portal tokens are never read by the browser client
create policy "service_role_only" on portal_tokens
  using (false);
