-- =============================================================================
-- Magician Helper — Phase 4: clients, gigs, routines played at gigs,
-- auto-generated preparation checklist, computed views.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CLIENTS
-- -----------------------------------------------------------------------------
create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 200),
  company      text check (char_length(company) <= 200),
  email        text check (char_length(email) <= 320),
  phone        text check (char_length(phone) <= 50),
  contact_link text check (char_length(contact_link) <= 2000),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id)
);
select public.apply_owner_policies('public.clients');

create index clients_user_idx  on public.clients (user_id, name);
create index clients_name_trgm on public.clients using gin (name extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- GIGS
-- -----------------------------------------------------------------------------
create table public.gigs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 200),
  client_id      uuid,
  starts_at      timestamptz not null,
  ends_at        timestamptz,
  location       text check (char_length(location) <= 500),
  event_type     text check (char_length(event_type) <= 100),
  fee            numeric(10, 2) check (fee >= 0),
  currency       char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  deposit_amount numeric(10, 2) check (deposit_amount >= 0),
  payment_status text not null default 'pending'
                 check (payment_status in ('pending', 'deposit_paid', 'invoiced', 'fully_paid')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at),
  unique (id, user_id),
  foreign key (client_id, user_id) references public.clients (id, user_id) on delete set null (client_id)
);
select public.apply_owner_policies('public.gigs');

create index gigs_user_start_idx on public.gigs (user_id, starts_at);
create index gigs_client_idx     on public.gigs (client_id);
create index gigs_title_trgm     on public.gigs using gin (title extensions.gin_trgm_ops);

-- Routines performed at a gig
create table public.gig_routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gig_id     uuid not null,
  routine_id uuid not null,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gig_id, routine_id),
  foreign key (gig_id, user_id)     references public.gigs (id, user_id)     on delete cascade,
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade
);
select public.apply_owner_policies('public.gig_routines');

create index gig_routines_routine_idx on public.gig_routines (routine_id);

-- -----------------------------------------------------------------------------
-- PREPARATION CHECKLIST
--   source = 'auto'   generated from the props of the gig's routines
--   source = 'manual' added by hand (kept by sync)
-- -----------------------------------------------------------------------------
create table public.gig_checklist_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gig_id          uuid not null,
  item_id         uuid,                 -- inventory item, null for free-text props / manual items
  label           text not null check (char_length(label) between 1 and 200),
  quantity_needed int not null default 1 check (quantity_needed > 0),
  source          text not null default 'manual' check (source in ('auto', 'manual')),
  is_checked      boolean not null default false,
  position        int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  foreign key (gig_id, user_id)  references public.gigs (id, user_id) on delete cascade,
  foreign key (item_id, user_id) references public.inventory_items (id, user_id) on delete set null (item_id)
);
select public.apply_owner_policies('public.gig_checklist_items');

create index gig_checklist_gig_idx on public.gig_checklist_items (gig_id, position);
create unique index gig_checklist_auto_item_uq
  on public.gig_checklist_items (gig_id, item_id) where source = 'auto' and item_id is not null;
create unique index gig_checklist_auto_label_uq
  on public.gig_checklist_items (gig_id, lower(label)) where source = 'auto' and item_id is null;

-- Rebuilds the auto part of a gig's checklist from its routines.
-- Keeps checked states and manual items. Quantity = max needed by any trick.
create or replace function public.sync_gig_checklist(p_gig_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid;
begin
  select user_id into v_user from public.gigs where id = p_gig_id;
  if v_user is null then
    return;  -- gig deleted or not visible
  end if;

  -- 1. remove auto items that are no longer needed
  delete from public.gig_checklist_items c
  where c.gig_id = p_gig_id
    and c.source = 'auto'
    and (
      (c.item_id is not null and c.item_id not in (
        select tp.item_id
        from public.gig_routines gr
        join public.routine_tricks rt on rt.routine_id = gr.routine_id
        join public.trick_props tp    on tp.trick_id = rt.trick_id
        where gr.gig_id = p_gig_id))
      or
      (c.item_id is null and lower(c.label) not in (
        select lower(btrim(line))
        from public.gig_routines gr
        join public.routine_tricks rt on rt.routine_id = gr.routine_id
        join public.tricks t          on t.id = rt.trick_id
        cross join lateral regexp_split_to_table(coalesce(t.other_props, ''), E'\n') as line
        where gr.gig_id = p_gig_id and btrim(line) <> ''))
    );

  -- 2. inventory props (insert or update quantity/label)
  insert into public.gig_checklist_items (user_id, gig_id, item_id, label, quantity_needed, source)
  select v_user, p_gig_id, i.id, i.item_name, max(tp.quantity_needed), 'auto'
  from public.gig_routines gr
  join public.routine_tricks rt on rt.routine_id = gr.routine_id
  join public.trick_props tp    on tp.trick_id = rt.trick_id
  join public.inventory_items i on i.id = tp.item_id
  where gr.gig_id = p_gig_id
  group by i.id, i.item_name
  on conflict (gig_id, item_id) where source = 'auto' and item_id is not null
  do update set quantity_needed = excluded.quantity_needed, label = excluded.label;

  -- 3. everyday props written as free text on tricks (one per line)
  insert into public.gig_checklist_items (user_id, gig_id, label, source)
  select distinct on (lower(btrim(line))) v_user, p_gig_id, left(btrim(line), 200), 'auto'
  from public.gig_routines gr
  join public.routine_tricks rt on rt.routine_id = gr.routine_id
  join public.tricks t          on t.id = rt.trick_id
  cross join lateral regexp_split_to_table(coalesce(t.other_props, ''), E'\n') as line
  where gr.gig_id = p_gig_id and btrim(line) <> ''
  on conflict (gig_id, lower(label)) where source = 'auto' and item_id is null
  do nothing;
end
$$;

create or replace function public.gig_routines_sync_checklist()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.sync_gig_checklist(coalesce(new.gig_id, old.gig_id));
  return null;
end
$$;

create trigger sync_checklist
  after insert or delete on public.gig_routines
  for each row execute function public.gig_routines_sync_checklist();

-- -----------------------------------------------------------------------------
-- COMPUTED VIEWS
-- -----------------------------------------------------------------------------
create view public.gigs_overview with (security_invoker = true) as
select
  g.*,
  c.name as client_name,
  (case g.payment_status
     when 'fully_paid'   then coalesce(g.fee, 0)
     when 'deposit_paid' then coalesce(g.deposit_amount, 0)
     else 0
   end)::numeric(10, 2) as amount_received,
  (select count(*) from public.gig_routines gr where gr.gig_id = g.id)::int as routine_count,
  (select count(*) from public.gig_checklist_items ci where ci.gig_id = g.id)::int as checklist_total,
  (select count(*) from public.gig_checklist_items ci where ci.gig_id = g.id and ci.is_checked)::int as checklist_done,
  exists (
    select 1
    from public.gig_checklist_items ci
    join public.inventory_items i on i.id = ci.item_id
    where ci.gig_id = g.id and i.quantity < ci.quantity_needed
  ) as has_stock_alert
from public.gigs g
left join public.clients c on c.id = g.client_id;

create view public.clients_overview with (security_invoker = true) as
select
  c.*,
  count(g.id)::int                                     as gig_count,
  coalesce(sum(g.fee), 0)::numeric(12, 2)              as total_fees,
  max(g.starts_at) filter (where g.starts_at < now())  as last_gig_at,
  min(g.starts_at) filter (where g.starts_at >= now()) as next_gig_at
from public.clients c
left join public.gigs g on g.client_id = c.id
group by c.id;
