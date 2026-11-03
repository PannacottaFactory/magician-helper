-- =============================================================================
-- Phase 8 — Business details, quotes & invoices, calendar feed
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Clients get a billing address (printed on quotes and invoices)
-- -----------------------------------------------------------------------------
alter table public.clients
  add column billing_address text check (char_length(billing_address) <= 1000);

-- clients_overview selects c.* — recreate it so it includes the new column
drop view public.clients_overview;
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

-- -----------------------------------------------------------------------------
-- BUSINESS PROFILE — the seller block of quotes and invoices (one row per user)
-- -----------------------------------------------------------------------------
create table public.business_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() unique references auth.users (id) on delete cascade,
  business_name        text check (char_length(business_name) <= 200),
  address              text check (char_length(address) <= 1000),
  email                text check (char_length(email) <= 320),
  phone                text check (char_length(phone) <= 50),
  website              text check (char_length(website) <= 500),
  tax_id               text check (char_length(tax_id) <= 200),           -- SIRET, VAT number…
  default_tax_rate     numeric(5, 2) not null default 0 check (default_tax_rate between 0 and 100),
  legal_note           text check (char_length(legal_note) <= 1000),      -- e.g. "VAT not applicable, art. 293 B of the CGI"
  payment_instructions text check (char_length(payment_instructions) <= 1000), -- bank details…
  payment_terms_days   int not null default 30 check (payment_terms_days between 0 and 365),
  quote_validity_days  int not null default 30 check (quote_validity_days between 1 and 365),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
select public.apply_owner_policies('public.business_profiles');

-- -----------------------------------------------------------------------------
-- DOCUMENTS — quotes and invoices
--   draft    → editable, deletable, no number
--   finalized (quote: sent/accepted/declined, invoice: issued/paid/canceled)
--            → numbered, content frozen; only the status can change.
--   Finalized invoices can never be deleted (legal numbering without gaps).
-- -----------------------------------------------------------------------------
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind            text not null check (kind in ('quote', 'invoice')),
  status          text not null default 'draft',
  number          text check (char_length(number) <= 50),
  gig_id          uuid,
  client_id       uuid,
  issue_date      date not null default current_date,
  due_date        date,                       -- invoice: payment due · quote: valid until
  currency        char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  title           text check (char_length(title) <= 200),
  buyer_name      text check (char_length(buyer_name) <= 200),
  buyer_company   text check (char_length(buyer_company) <= 200),
  buyer_address   text check (char_length(buyer_address) <= 1000),
  buyer_email     text check (char_length(buyer_email) <= 320),
  lines           jsonb not null default '[]'::jsonb,  -- [{description, quantity, unit_price}]
  tax_rate        numeric(5, 2) not null default 0 check (tax_rate between 0 and 100),
  deposit_paid    numeric(10, 2) not null default 0 check (deposit_paid >= 0),  -- deducted from the total due
  notes           text check (char_length(notes) <= 5000),
  seller          jsonb,                      -- business profile frozen when finalized
  -- totals, computed by the trigger below
  subtotal        numeric(12, 2) not null default 0,
  tax_amount      numeric(12, 2) not null default 0,
  total           numeric(12, 2) not null default 0,
  amount_due      numeric(12, 2) not null default 0,
  finalized_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, number),
  check (
    (kind = 'quote' and status in ('draft', 'sent', 'accepted', 'declined'))
    or (kind = 'invoice' and status in ('draft', 'issued', 'paid', 'canceled'))
  ),
  check ((status = 'draft') = (number is null)),
  check (due_date is null or due_date >= issue_date),
  check (jsonb_typeof(lines) = 'array' and jsonb_array_length(lines) <= 50),
  foreign key (gig_id, user_id)    references public.gigs (id, user_id)    on delete set null (gig_id),
  foreign key (client_id, user_id) references public.clients (id, user_id) on delete set null (client_id)
);
select public.apply_owner_policies('public.documents');

create index documents_user_kind_idx on public.documents (user_id, kind, issue_date desc);
create index documents_gig_idx on public.documents (gig_id);
create index documents_client_idx on public.documents (client_id);

-- Validates the lines and computes the totals (drafts only: finalized rows are frozen).
create or replace function public.documents_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  line jsonb;
  sub numeric := 0;
  qty numeric;
  price numeric;
begin
  if tg_op = 'UPDATE' and old.status <> 'draft' then
    -- Frozen: everything except the status (and links cleared by ON DELETE SET NULL)
    if (to_jsonb(new) - array['status', 'updated_at', 'gig_id', 'client_id'])
       is distinct from (to_jsonb(old) - array['status', 'updated_at', 'gig_id', 'client_id']) then
      raise exception 'A finalized % cannot be edited. Duplicate it to make changes.', old.kind
        using errcode = 'check_violation';
    end if;
    if new.status = 'draft' then
      raise exception 'A finalized % cannot go back to draft.', old.kind using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' and new.status <> 'draft' then
    raise exception 'Documents are created as drafts, then finalized.' using errcode = 'check_violation';
  end if;
  -- draft → finalized only through finalize_document(), which sets this transaction-local flag
  if tg_op = 'UPDATE' and new.status <> 'draft'
     and coalesce(current_setting('app.finalizing_document', true), '') <> new.id::text then
    raise exception 'Use finalize_document() to finalize a draft.' using errcode = 'check_violation';
  end if;

  for line in select * from jsonb_array_elements(new.lines) loop
    if jsonb_typeof(line) <> 'object'
       or jsonb_typeof(line -> 'description') <> 'string'
       or char_length(btrim(line ->> 'description')) not between 1 and 500
       or jsonb_typeof(line -> 'quantity') <> 'number'
       or jsonb_typeof(line -> 'unit_price') <> 'number' then
      raise exception 'Each line needs a description (up to 500 characters), a quantity and a unit price.'
        using errcode = 'check_violation';
    end if;
    qty := (line ->> 'quantity')::numeric;
    price := (line ->> 'unit_price')::numeric;
    if qty <= 0 or qty > 10000 or price < 0 or price > 10000000 then
      raise exception 'Quantities must be positive and prices cannot be negative.' using errcode = 'check_violation';
    end if;
    sub := sub + round(qty * price, 2);
  end loop;

  new.subtotal := sub;
  new.tax_amount := round(sub * new.tax_rate / 100, 2);
  new.total := new.subtotal + new.tax_amount;
  new.amount_due := greatest(new.total - new.deposit_paid, 0);
  return new;
end
$$;

create trigger documents_before_write
  before insert or update on public.documents
  for each row execute function public.documents_before_write();

-- Finalized invoices are part of the legal numbering sequence: never deleted.
-- (When the whole account is deleted the user row is already gone, so the cascade passes.)
-- security definer: it must see auth.users, which authenticated users cannot read.
create or replace function public.documents_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.kind = 'invoice' and old.status <> 'draft'
     and exists (select 1 from auth.users u where u.id = old.user_id) then
    raise exception 'A finalized invoice cannot be deleted. Mark it as canceled instead.'
      using errcode = 'check_violation';
  end if;
  return old;
end
$$;

create trigger documents_before_delete
  before delete on public.documents
  for each row execute function public.documents_before_delete();
revoke execute on function public.documents_before_delete() from public, anon, authenticated;

-- Per-user, per-kind, per-year counters → Q-2026-0001, INV-2026-0001
create table public.document_counters (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('quote', 'invoice')),
  year       int not null,
  last_value int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, year)
);
select public.apply_owner_policies('public.document_counters');

-- Finalizes a draft: assigns the next number, freezes the seller block.
create or replace function public.finalize_document(p_id uuid)
returns public.documents
language plpgsql
security invoker
set search_path = ''
as $$
declare
  doc public.documents;
  biz public.business_profiles;
  seq int;
  prefix text;
begin
  select * into doc from public.documents where id = p_id for update;
  if not found then
    raise exception 'Document not found.' using errcode = 'no_data_found';
  end if;
  if doc.status <> 'draft' then
    raise exception 'This document is already finalized.' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(doc.lines) = 0 then
    raise exception 'Add at least one line before finalizing.' using errcode = 'check_violation';
  end if;
  if coalesce(btrim(doc.buyer_name), '') = '' then
    raise exception 'Add the client''s name before finalizing.' using errcode = 'check_violation';
  end if;

  select * into biz from public.business_profiles where user_id = doc.user_id;
  if coalesce(btrim(biz.business_name), '') = '' then
    raise exception 'Add your business name in Settings → Business details before finalizing.'
      using errcode = 'check_violation';
  end if;

  insert into public.document_counters as c (user_id, kind, year, last_value)
  values (doc.user_id, doc.kind, extract(year from doc.issue_date)::int, 1)
  on conflict (user_id, kind, year) do update set last_value = c.last_value + 1
  returning last_value into seq;

  prefix := case doc.kind when 'quote' then 'Q' else 'INV' end;

  perform set_config('app.finalizing_document', p_id::text, true);
  update public.documents
     set status = case doc.kind when 'quote' then 'sent' else 'issued' end,
         number = format('%s-%s-%s', prefix, extract(year from doc.issue_date)::int, lpad(seq::text, 4, '0')),
         finalized_at = now(),
         due_date = coalesce(
           doc.due_date,
           doc.issue_date + case doc.kind when 'quote' then biz.quote_validity_days else biz.payment_terms_days end
         ),
         seller = jsonb_build_object(
           'business_name', biz.business_name,
           'address', biz.address,
           'email', biz.email,
           'phone', biz.phone,
           'website', biz.website,
           'tax_id', biz.tax_id,
           'legal_note', biz.legal_note,
           'payment_instructions', biz.payment_instructions
         )
   where id = p_id
   returning * into doc;
  perform set_config('app.finalizing_document', '', true);
  return doc;
end
$$;

revoke execute on function public.finalize_document(uuid) from public, anon;
grant execute on function public.finalize_document(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- CALENDAR FEED — secret token for the iCalendar subscription (Edge Function)
-- -----------------------------------------------------------------------------
create table public.calendar_feeds (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() unique references auth.users (id) on delete cascade,
  -- 2 × 122 random bits; read by the calendar-feed Edge Function with the service role
  token      text not null unique
             default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
             check (token ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public.apply_owner_policies('public.calendar_feeds');
-- The token is generated by the database only
revoke update on public.calendar_feeds from authenticated;
