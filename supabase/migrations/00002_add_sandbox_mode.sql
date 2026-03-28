-- Migration: 00002_add_sandbox_mode
-- Description: Add sandbox_mode flag and seeded_at timestamp to practices table

alter table practices add column sandbox_mode boolean default false;
alter table practices add column sandbox_seeded_at timestamptz;
