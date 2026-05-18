-- =============================================================================
-- BuyTheTop Database Schema
-- =============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`) to create
-- all the tables, indexes, triggers and RLS policies the app expects.
--
-- Auth (auth.users) is managed by Supabase itself; we only define the
-- application tables in the `public` schema and link them to auth.users
-- via foreign keys.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- user_profiles
-- -----------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  description text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  position_notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_display_name_idx
  on public.user_profiles (lower(display_name));

create index if not exists user_profiles_role_idx
  on public.user_profiles (role);

-- -----------------------------------------------------------------------------
-- rankings
-- -----------------------------------------------------------------------------
create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  total_contribution numeric(12, 2) not null default 0,
  current_position integer,
  position_acquired_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rankings_current_position_idx
  on public.rankings (current_position asc nulls last);

create index if not exists rankings_total_contribution_idx
  on public.rankings (total_contribution desc);

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_intent_id text unique,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

-- -----------------------------------------------------------------------------
-- position_history
-- -----------------------------------------------------------------------------
create table if not exists public.position_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  old_position integer,
  new_position integer not null,
  position integer generated always as (new_position) stored,
  contribution_amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists position_history_user_id_idx
  on public.position_history (user_id);

create index if not exists position_history_created_at_idx
  on public.position_history (created_at desc);

-- -----------------------------------------------------------------------------
-- audit_logs
-- -----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists rankings_set_updated_at on public.rankings;
create trigger rankings_set_updated_at
  before update on public.rankings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.user_profiles enable row level security;
alter table public.rankings enable row level security;
alter table public.payments enable row level security;
alter table public.position_history enable row level security;
alter table public.audit_logs enable row level security;

-- user_profiles: anyone authenticated can read; users update their own.
drop policy if exists "user_profiles read all" on public.user_profiles;
create policy "user_profiles read all"
  on public.user_profiles for select
  using (true);

drop policy if exists "user_profiles update self" on public.user_profiles;
create policy "user_profiles update self"
  on public.user_profiles for update
  using (auth.uid() = id);

drop policy if exists "user_profiles insert self" on public.user_profiles;
create policy "user_profiles insert self"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- rankings: world-readable; writes happen via service_role from API/webhook.
drop policy if exists "rankings read all" on public.rankings;
create policy "rankings read all"
  on public.rankings for select
  using (true);

-- payments: each user reads their own.
drop policy if exists "payments read own" on public.payments;
create policy "payments read own"
  on public.payments for select
  using (auth.uid() = user_id);

-- position_history: world-readable (used by leaderboard activity feed).
drop policy if exists "position_history read all" on public.position_history;
create policy "position_history read all"
  on public.position_history for select
  using (true);

-- audit_logs: admin only.
drop policy if exists "audit_logs admin read" on public.audit_logs;
create policy "audit_logs admin read"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
