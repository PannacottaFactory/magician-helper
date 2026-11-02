-- =============================================================================
-- Magician Helper — Phase 3: routines (ordered setlists), practice log,
-- computed views (last practiced, routine stats, consolidated props),
-- and the link between inventory items and the built-in prop catalog.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Inventory items created from the built-in catalog keep its key
-- (used to show the catalog illustration when the item has no photo).
-- -----------------------------------------------------------------------------
alter table public.inventory_items
  add column catalog_key text check (catalog_key ~ '^[a-z0-9-]{1,60}$');

-- i.* is expanded when a view is created: recreate it to include the new column
drop view public.inventory_overview;
create view public.inventory_overview with (security_invoker = true) as
select
  i.*,
  (select count(*) from public.trick_props tp where tp.item_id = i.id)::int as trick_count
from public.inventory_items i;

-- -----------------------------------------------------------------------------
-- ROUTINES
-- -----------------------------------------------------------------------------
create table public.routines (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 200),
  audience_types text[] not null default '{}'
                 check (audience_types <@ array['kids', 'corporate', 'street', 'private_party', 'wedding', 'stage_show']),
  status         text not null default 'drafting' check (status in ('drafting', 'ready')),
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, user_id)
);
select public.apply_owner_policies('public.routines');

create index routines_user_idx  on public.routines (user_id, status);
create index routines_name_trgm on public.routines using gin (name extensions.gin_trgm_ops);

-- Ordered tricks of a routine. The same trick may appear twice (e.g. a callback).
create table public.routine_tricks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id       uuid not null,
  trick_id         uuid not null,
  position         int not null check (position >= 0),
  transition_notes text,                       -- transition / patter notes
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- deferred: reordering swaps positions inside one transaction
  unique (routine_id, position) deferrable initially deferred,
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade,
  foreign key (trick_id, user_id)   references public.tricks (id, user_id) on delete cascade
);
select public.apply_owner_policies('public.routine_tricks');

create index routine_tricks_trick_idx on public.routine_tricks (trick_id);

-- Append a trick at the end of a routine. Returns the new routine_tricks id.
create or replace function public.add_trick_to_routine(p_routine_id uuid, p_trick_id uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  insert into public.routine_tricks (routine_id, trick_id, position)
  select p_routine_id, p_trick_id, coalesce(max(rt.position) + 1, 0)
  from public.routine_tricks rt
  where rt.routine_id = p_routine_id
  returning id;
$$;

-- Save a new order after drag & drop: p_ids = routine_tricks ids in the new order.
create or replace function public.reorder_routine_tricks(p_routine_id uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.routine_tricks rt
     set position = o.ord - 1
    from unnest(p_ids) with ordinality as o (id, ord)
   where rt.id = o.id
     and rt.routine_id = p_routine_id;
$$;

-- -----------------------------------------------------------------------------
-- PRACTICE LOG
-- -----------------------------------------------------------------------------
create table public.practice_logs (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users (id) on delete cascade,
  practiced_on           date not null default current_date,
  title                  text not null check (char_length(title) between 1 and 200),  -- technique or sleight
  trick_id               uuid,
  routine_id             uuid,
  time_spent_min         int check (time_spent_min between 0 and 1440),
  status                 text not null default 'done' check (status in ('not_started', 'in_progress', 'done')),
  notes_and_flaws_to_fix text,
  self_rating            smallint check (self_rating between 1 and 5),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  foreign key (trick_id, user_id)   references public.tricks (id, user_id)   on delete set null (trick_id),
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete set null (routine_id)
);
select public.apply_owner_policies('public.practice_logs');

create index practice_user_date_idx on public.practice_logs (user_id, practiced_on desc);
create index practice_trick_idx     on public.practice_logs (trick_id);
create index practice_routine_idx   on public.practice_logs (routine_id);
create index practice_title_trgm    on public.practice_logs using gin (title extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- COMPUTED VIEWS (security_invoker = the caller's RLS applies)
-- -----------------------------------------------------------------------------

-- Tricks + practice stats + number of routines using them
create view public.tricks_overview with (security_invoker = true) as
select
  t.*,
  pl.last_practiced,
  coalesce(pl.sessions, 0)::int as practice_sessions,
  coalesce(pl.minutes, 0)::int  as practice_minutes,
  (select count(distinct rt.routine_id) from public.routine_tricks rt where rt.trick_id = t.id)::int as routine_count
from public.tricks t
left join lateral (
  select max(p.practiced_on) as last_practiced, count(*) as sessions, sum(p.time_spent_min) as minutes
  from public.practice_logs p
  where p.trick_id = t.id
) pl on true;

-- Routines + total duration, average difficulty, tricks not ready yet
create view public.routines_overview with (security_invoker = true) as
select
  r.*,
  count(rt.id)::int                                                     as trick_count,
  coalesce(sum(t.duration_min), 0)::int                                 as total_duration_min,
  round(avg(t.difficulty)::numeric, 1)                                  as avg_difficulty,
  (count(rt.id) filter (where t.status <> 'performance_ready'))::int    as not_ready_count
from public.routines r
left join public.routine_tricks rt on rt.routine_id = r.id
left join public.tricks t          on t.id = rt.trick_id
group by r.id;

-- Inventory props needed by a routine, consolidated (max quantity across its tricks:
-- one deck used by three tricks is still one deck)
create view public.routine_props with (security_invoker = true) as
select
  rt.routine_id,
  i.id                                 as item_id,
  i.item_name,
  i.catalog_key,
  i.quantity,
  i.stock_status,
  max(tp.quantity_needed)::int         as quantity_needed,
  array_agg(distinct t.name order by t.name) as used_by_tricks
from public.routine_tricks rt
join public.trick_props tp    on tp.trick_id = rt.trick_id
join public.inventory_items i on i.id = tp.item_id
join public.tricks t          on t.id = rt.trick_id
group by rt.routine_id, i.id;
