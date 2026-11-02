-- =============================================================================
-- Magician Helper — Phase 1: core
-- Helpers, profiles (one row per user), trial / write-access rule, and the
-- generic owner-only RLS policy generator used by every later migration.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- updated_at maintained automatically
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- -----------------------------------------------------------------------------
-- PROFILES — id = auth.users.id
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  user_id                uuid generated always as (id) stored,   -- same convention as other tables
  display_name           text check (char_length(display_name) <= 100),
  currency               char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  theme                  text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  stale_trick_days       int not null default 14 check (stale_trick_days between 1 and 365),
  trial_ends_at          timestamptz not null default (now() + interval '14 days'),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.profiles is 'One row per user. Billing columns are written only by the Stripe webhook (service role).';

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may only change these columns. trial_ends_at and the Stripe columns
-- are therefore impossible to tamper with through the public API.
revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
revoke select on public.profiles from anon;
grant update (display_name, currency, theme, stale_trick_days) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Create the profile (and start the 14-day trial) when a user signs up
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));
  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Write access = trial still running OR a valid subscription.
-- past_due keeps access while Stripe retries the payment.
-- -----------------------------------------------------------------------------
create or replace function public.has_write_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.trial_ends_at > now()
        or p.subscription_status in ('trialing', 'active', 'past_due')
      )
  );
$$;

revoke execute on function public.has_write_access() from public, anon;
grant execute on function public.has_write_access() to authenticated;

-- -----------------------------------------------------------------------------
-- Generic owner-only policies + updated_at trigger for a user-owned table.
-- SELECT is always allowed on own rows (read-only mode keeps reading/exporting);
-- INSERT / UPDATE / DELETE also require has_write_access().
-- Usage (in later migrations):  select public.apply_owner_policies('public.tricks');
-- -----------------------------------------------------------------------------
create or replace function public.apply_owner_policies(tbl regclass)
returns void
language plpgsql
set search_path = ''
as $$
declare
  t text := tbl::text;
begin
  execute format('alter table %s enable row level security', t);

  execute format(
    'create policy owner_select on %s for select to authenticated
       using (user_id = (select auth.uid()))', t);

  execute format(
    'create policy owner_insert on %s for insert to authenticated
       with check (user_id = (select auth.uid()) and public.has_write_access())', t);

  execute format(
    'create policy owner_update on %s for update to authenticated
       using (user_id = (select auth.uid()))
       with check (user_id = (select auth.uid()) and public.has_write_access())', t);

  execute format(
    'create policy owner_delete on %s for delete to authenticated
       using (user_id = (select auth.uid()) and public.has_write_access())', t);

  execute format(
    'create trigger set_updated_at before update on %s
       for each row execute function public.set_updated_at()', t);

  -- anon never needs access to user data
  execute format('revoke all on %s from anon', t);
end
$$;

revoke execute on function public.apply_owner_policies(regclass) from public, anon, authenticated;
