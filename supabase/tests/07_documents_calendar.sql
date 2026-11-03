-- Phase 8: business profile, quotes & invoices, calendar feed
-- @ setup: user with a client and a gig
insert into auth.users (id, email) values
 ('aaaaaaaa-0000-0000-0000-000000000011','a8@x.com'),
 ('bbbbbbbb-0000-0000-0000-000000000012','b8@x.com');
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.clients (id, name, company, billing_address) values
  ('a8300000-0000-0000-0000-000000000001', 'Claire Martin', 'Lumen Events', E'12 rue de la Paix\n75002 Paris');
insert into public.gigs (id, title, client_id, starts_at, fee, deposit_amount, payment_status) values
  ('a8400000-0000-0000-0000-000000000001', 'Gala', 'a8300000-0000-0000-0000-000000000001', now() + interval '10 days', 900, 300, 'deposit_paid');
select billing_address is not null as has_address, gig_count from public.clients_overview;
-- @ draft invoice: totals computed by the database
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.documents (id, kind, gig_id, client_id, buyer_name, lines, tax_rate, deposit_paid, issue_date) values
  ('a8500000-0000-0000-0000-000000000001', 'invoice', 'a8400000-0000-0000-0000-000000000001', 'a8300000-0000-0000-0000-000000000001',
   'Claire Martin', '[{"description":"Magic performance","quantity":1,"unit_price":900},{"description":"Travel","quantity":2,"unit_price":0.555}]', 20, 300, '2026-11-04');
select status, number, subtotal, tax_amount, total, amount_due from public.documents;
-- @ EXPECT_FAIL invalid line refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.documents (kind, lines) values ('invoice', '[{"description":"","quantity":1,"unit_price":10}]');
-- @ EXPECT_FAIL negative price refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.documents (kind, lines) values ('quote', '[{"description":"x","quantity":1,"unit_price":-5}]');
-- @ EXPECT_FAIL cannot insert directly as issued
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.documents (kind, status, number, buyer_name) values ('invoice', 'issued', 'INV-1', 'x');
-- @ EXPECT_FAIL cannot finalize by a plain update (number chosen by the user)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
update public.documents set status = 'issued', number = 'INV-2026-9999' where id = 'a8500000-0000-0000-0000-000000000001';
-- @ EXPECT_FAIL finalize refused without business name
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
select public.finalize_document('a8500000-0000-0000-0000-000000000001');
-- @ finalize: numbered, seller frozen, due date from payment terms
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.business_profiles (business_name, address, payment_terms_days) values ('Alex Magic', 'Lyon', 15);
select number, status, due_date, seller ->> 'business_name' as seller from public.finalize_document('a8500000-0000-0000-0000-000000000001');
-- @ numbering continues per kind and per year
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.documents (id, kind, buyer_name, lines, issue_date) values
  ('a8500000-0000-0000-0000-000000000002', 'invoice', 'X', '[{"description":"a","quantity":1,"unit_price":1}]', '2026-12-01'),
  ('a8500000-0000-0000-0000-000000000003', 'quote',   'X', '[{"description":"a","quantity":1,"unit_price":1}]', '2026-12-01'),
  ('a8500000-0000-0000-0000-000000000004', 'invoice', 'X', '[{"description":"a","quantity":1,"unit_price":1}]', '2027-01-02');
select (public.finalize_document('a8500000-0000-0000-0000-000000000002')).number as inv2,
       (public.finalize_document('a8500000-0000-0000-0000-000000000003')).number as q1,
       (public.finalize_document('a8500000-0000-0000-0000-000000000004')).number as inv2027;
-- @ quote valid-until uses the quote validity
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
select status, due_date from public.documents where id = 'a8500000-0000-0000-0000-000000000003';
-- @ EXPECT_FAIL finalizing twice refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
select public.finalize_document('a8500000-0000-0000-0000-000000000002');
-- @ EXPECT_FAIL finalized invoice content is frozen
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
update public.documents set tax_rate = 0 where id = 'a8500000-0000-0000-0000-000000000001';
-- @ EXPECT_FAIL finalized invoice cannot go back to draft
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
update public.documents set status = 'draft' where id = 'a8500000-0000-0000-0000-000000000001';
-- @ status of a finalized invoice can change (paid)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
update public.documents set status = 'paid' where id = 'a8500000-0000-0000-0000-000000000001' returning number, status;
-- @ EXPECT_FAIL invoice status not valid for a quote
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
update public.documents set status = 'paid' where id = 'a8500000-0000-0000-0000-000000000003';
-- @ EXPECT_FAIL finalized invoice cannot be deleted
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
delete from public.documents where id = 'a8500000-0000-0000-0000-000000000001';
-- @ finalized quote and draft invoice can be deleted
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.documents (id, kind) values ('a8500000-0000-0000-0000-000000000005', 'invoice');
delete from public.documents where id in ('a8500000-0000-0000-0000-000000000003', 'a8500000-0000-0000-0000-000000000005') returning kind;
-- @ deleting the gig keeps the invoice (link cleared)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
delete from public.gigs where id = 'a8400000-0000-0000-0000-000000000001';
select number, gig_id is null as unlinked, total from public.documents where id = 'a8500000-0000-0000-0000-000000000001';
-- @ B sees none of A's documents, business profile or counters
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000012';
select (select count(*) from public.documents) + (select count(*) from public.business_profiles) + (select count(*) from public.document_counters) as visible;
-- @ EXPECT_FAIL B cannot finalize A's draft
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.documents (id, kind, buyer_name, lines) values ('a8500000-0000-0000-0000-000000000006', 'quote', 'X', '[{"description":"a","quantity":1,"unit_price":1}]');
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000012';
select public.finalize_document('a8500000-0000-0000-0000-000000000006');
-- @ EXPECT_FAIL B cannot link A's client to his document
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000012';
insert into public.documents (kind, client_id) values ('quote', 'a8300000-0000-0000-0000-000000000001');
-- @ EXPECT_FAIL B cannot tamper with A's counter
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000012';
insert into public.document_counters (user_id, kind, year, last_value) values ('aaaaaaaa-0000-0000-0000-000000000011', 'invoice', 2026, 0);
-- @ calendar feed: token generated by the database (64 hex chars)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
insert into public.calendar_feeds default values;
select token ~ '^[0-9a-f]{64}$' as valid from public.calendar_feeds;
-- @ EXPECT_FAIL calendar token cannot be chosen by the user
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000011';
update public.calendar_feeds set token = repeat('a', 64);
-- @ EXPECT_FAIL B cannot read A's calendar token
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000012';
select 1 / (select count(*) from public.calendar_feeds)::int;
-- @ EXPECT_FAIL read-only user cannot create a document
update public.profiles set trial_ends_at = now() - interval '1 minute' where id = 'bbbbbbbb-0000-0000-0000-000000000012';
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000012';
insert into public.documents (kind) values ('quote');
-- @ deleting the account removes finalized invoices too
delete from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000011';
select (select count(*) from public.documents) + (select count(*) from public.business_profiles)
     + (select count(*) from public.document_counters) + (select count(*) from public.calendar_feeds) as left_over;
