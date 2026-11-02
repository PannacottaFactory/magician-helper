-- =============================================================================
-- Magician Helper — Phase 2: tricks, inventory (+ files), trick props, ideas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TRICKS
-- -----------------------------------------------------------------------------
create table public.tricks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 200),
  effect           text,
  secret_and_setup text,
  categories       text[] not null default '{}'
                   check (categories <@ array['card', 'coin', 'mentalism', 'stage', 'close_up', 'other']),
  difficulty       smallint check (difficulty between 1 and 4),
  duration_min     int check (duration_min between 0 and 600),
  status           text not null default 'to_learn'
                   check (status in ('to_learn', 'learning', 'needs_polish', 'performance_ready')),
  tags             text[] not null default '{}',
  video_url        text,
  references_text  text,            -- books, DVDs, credits…
  other_props      text,            -- everyday props not tracked in inventory (one per line)
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, user_id)              -- target of composite foreign keys
);
select public.apply_owner_policies('public.tricks');

create index tricks_user_status_idx on public.tricks (user_id, status);
create index tricks_tags_idx        on public.tricks using gin (tags);
create index tricks_name_trgm       on public.tricks using gin (name extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- INVENTORY
-- -----------------------------------------------------------------------------
create table public.inventory_items (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_name           text not null check (char_length(item_name) between 1 and 200),
  quantity            int not null default 1 check (quantity >= 0),
  low_stock_threshold int not null default 0 check (low_stock_threshold >= 0),
  stock_status        text generated always as (
                        case
                          when quantity = 0 then 'out_of_stock'
                          when quantity <= low_stock_threshold then 'running_low'
                          else 'in_stock'
                        end
                      ) stored,
  buy_link            text,
  cost                numeric(10, 2) check (cost >= 0),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, user_id)
);
select public.apply_owner_policies('public.inventory_items');

create index inventory_user_status_idx on public.inventory_items (user_id, stock_status);
create index inventory_name_trgm       on public.inventory_items using gin (item_name extensions.gin_trgm_ops);

-- Photos & files (metadata; the binary lives in Storage bucket "inventory")
create table public.inventory_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id      uuid not null,
  storage_path text not null unique,   -- "{user_id}/{item_id}/{uuid}-{filename}"
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  kind         text not null check (kind in ('photo', 'file')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  foreign key (item_id, user_id) references public.inventory_items (id, user_id) on delete cascade,
  check (storage_path like user_id::text || '/' || item_id::text || '/%')
);
select public.apply_owner_policies('public.inventory_files');

create index inventory_files_item_idx on public.inventory_files (item_id);

-- -----------------------------------------------------------------------------
-- TRICK ⇄ INVENTORY (props used by a trick)
-- -----------------------------------------------------------------------------
create table public.trick_props (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trick_id        uuid not null,
  item_id         uuid not null,
  quantity_needed int not null default 1 check (quantity_needed > 0),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (trick_id, item_id),
  foreign key (trick_id, user_id) references public.tricks (id, user_id) on delete cascade,
  foreign key (item_id, user_id)  references public.inventory_items (id, user_id) on delete cascade
);
select public.apply_owner_policies('public.trick_props');

create index trick_props_item_idx on public.trick_props (item_id);

-- -----------------------------------------------------------------------------
-- IDEAS
-- -----------------------------------------------------------------------------
create table public.ideas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  content    text,                     -- HTML from the rich-text editor (sanitized on display)
  tags       text[] not null default '{}',
  trick_id   uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (trick_id, user_id) references public.tricks (id, user_id) on delete set null (trick_id)
);
select public.apply_owner_policies('public.ideas');

create index ideas_user_created_idx on public.ideas (user_id, created_at desc);
create index ideas_trick_idx        on public.ideas (trick_id);
create index ideas_tags_idx         on public.ideas using gin (tags);
create index ideas_title_trgm       on public.ideas using gin (title extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Inventory with the number of tricks using each item
-- -----------------------------------------------------------------------------
create view public.inventory_overview with (security_invoker = true) as
select
  i.*,
  (select count(*) from public.trick_props tp where tp.item_id = i.id)::int as trick_count
from public.inventory_items i;

-- -----------------------------------------------------------------------------
-- Convert an idea into a new trick (atomic). Returns the new trick id.
-- -----------------------------------------------------------------------------
create or replace function public.convert_idea_to_trick(p_idea_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_idea  public.ideas;
  v_trick uuid;
begin
  select * into v_idea from public.ideas where id = p_idea_id;
  if not found then
    raise exception 'Idea not found' using errcode = 'P0002';
  end if;
  if v_idea.trick_id is not null then
    raise exception 'This idea is already linked to a trick' using errcode = 'P0001';
  end if;

  insert into public.tricks (user_id, name, notes, tags)
  values (
    v_idea.user_id,
    v_idea.title,
    -- HTML → plain text: line breaks for block ends, strip tags, decode common entities
    nullif(btrim(
      replace(replace(replace(replace(replace(
        regexp_replace(
          regexp_replace(coalesce(v_idea.content, ''), '</(p|h[1-6]|li|blockquote)>|<br\s*/?>', E'\n', 'gi'),
          '<[^>]+>', '', 'g'),
        '&nbsp;', ' '), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&amp;', '&'),
      E' 
	'
    ), ''),
    v_idea.tags
  )
  returning id into v_trick;

  update public.ideas set trick_id = v_trick where id = p_idea_id;
  return v_trick;
end
$$;

-- -----------------------------------------------------------------------------
-- STORAGE — private bucket, one folder per user: "{user_id}/{item_id}/{file}"
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('inventory', 'inventory', false, 10485760)   -- 10 MB per file
on conflict (id) do nothing;

create policy inventory_files_read_own on storage.objects
  for select to authenticated
  using (bucket_id = 'inventory' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy inventory_files_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inventory'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_write_access()
  );

create policy inventory_files_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'inventory'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_write_access()
  );
