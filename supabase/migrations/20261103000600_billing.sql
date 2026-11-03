-- =============================================================================
-- Magician Helper — Phase 6: billing
-- Subscription columns already live in public.profiles (phase 1) and are only
-- writable by the service role (Edge Functions). This migration adds webhook
-- idempotency and a small helper used by the Billing page.
-- =============================================================================

-- Stripe events already processed by the webhook (Stripe may deliver an event twice)
create table public.stripe_events (
  id          text primary key,         -- evt_…
  type        text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;  -- no policy: service role only
revoke all on public.stripe_events from anon, authenticated;

-- Profiles can be found from Stripe objects
create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

-- Access summary for the current user (mirrors has_write_access, read by the UI)
create or replace function public.my_access()
returns table (
  can_write           boolean,
  on_trial            boolean,
  trial_ends_at       timestamptz,
  subscription_status text,
  current_period_end  timestamptz,
  cancel_at_period_end boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(p.trial_ends_at > now() or p.subscription_status in ('trialing', 'active', 'past_due'), false),
    (p.trial_ends_at > now() and p.subscription_status is null),
    p.trial_ends_at,
    p.subscription_status,
    p.current_period_end,
    p.cancel_at_period_end
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke execute on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;
