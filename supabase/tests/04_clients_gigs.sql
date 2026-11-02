-- Phase 4: clients, gigs, gig routines, checklist sync, views
-- @ setup: user with tricks, props, routines
insert into auth.users (id, email) values
 ('aaaaaaaa-0000-0000-0000-000000000005','a4@x.com'),
 ('bbbbbbbb-0000-0000-0000-000000000006','b4@x.com');
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
insert into public.inventory_items (id, item_name, quantity) values
  ('a4100000-0000-0000-0000-000000000001', 'Deck', 1),
  ('a4100000-0000-0000-0000-000000000002', 'Sponge balls', 2);
insert into public.tricks (id, name, other_props) values
  ('a4000000-0000-0000-0000-000000000001', 'Card trick', E'Sharpie\n  rubber band  '),
  ('a4000000-0000-0000-0000-000000000002', 'Sponge trick', 'sharpie');
insert into public.trick_props (trick_id, item_id, quantity_needed) values
  ('a4000000-0000-0000-0000-000000000001', 'a4100000-0000-0000-0000-000000000001', 2),
  ('a4000000-0000-0000-0000-000000000002', 'a4100000-0000-0000-0000-000000000002', 4),
  ('a4000000-0000-0000-0000-000000000002', 'a4100000-0000-0000-0000-000000000001', 1);
insert into public.routines (id, name) values
  ('a4200000-0000-0000-0000-000000000001', 'Cards'),
  ('a4200000-0000-0000-0000-000000000002', 'Sponges');
select public.add_trick_to_routine('a4200000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000001');
select public.add_trick_to_routine('a4200000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000002');
insert into public.clients (id, name, company) values ('a4300000-0000-0000-0000-000000000001', 'Jane Doe', 'Acme');
insert into public.gigs (id, title, client_id, starts_at, fee, deposit_amount, payment_status) values
  ('a4400000-0000-0000-0000-000000000001', 'Acme party', 'a4300000-0000-0000-0000-000000000001', now() + interval '10 days', 800, 200, 'deposit_paid');
select count(*) from public.gigs;
-- @ linking a routine generates the checklist
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
insert into public.gig_routines (gig_id, routine_id) values ('a4400000-0000-0000-0000-000000000001', 'a4200000-0000-0000-0000-000000000001');
select label, quantity_needed, item_id is not null as inventory from public.gig_checklist_items order by label;
-- @ second routine merges props (deck max quantity = 2, sharpie once)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
update public.gig_checklist_items set is_checked = true where label = 'Deck';
insert into public.gig_checklist_items (gig_id, label) values ('a4400000-0000-0000-0000-000000000001', 'Business cards');
insert into public.gig_routines (gig_id, routine_id) values ('a4400000-0000-0000-0000-000000000001', 'a4200000-0000-0000-0000-000000000002');
select label, quantity_needed, source, is_checked from public.gig_checklist_items order by label;
-- @ overview: received amount, checklist counts, stock alert (deck 1 < 2 needed)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
select client_name, amount_received, routine_count, checklist_total, checklist_done, has_stock_alert from public.gigs_overview;
-- @ unlinking a routine removes its props but keeps checked state and manual items
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
delete from public.gig_routines where routine_id = 'a4200000-0000-0000-0000-000000000002';
select label, quantity_needed, source, is_checked from public.gig_checklist_items order by label;
-- @ manual refresh is idempotent
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
select public.sync_gig_checklist('a4400000-0000-0000-0000-000000000001');
select public.sync_gig_checklist('a4400000-0000-0000-0000-000000000001');
select count(*) from public.gig_checklist_items;
-- @ client overview
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
select name, gig_count, total_fees, next_gig_at is not null as has_next from public.clients_overview;
-- @ EXPECT_FAIL end before start refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
insert into public.gigs (title, starts_at, ends_at) values ('x', now(), now() - interval '1 hour');
-- @ EXPECT_FAIL B cannot attach A's client to his gig
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000006';
insert into public.gigs (title, client_id, starts_at) values ('steal', 'a4300000-0000-0000-0000-000000000001', now());
-- @ EXPECT_FAIL B cannot link A's routine to his gig
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000006';
insert into public.gigs (id, title, starts_at) values ('b4400000-0000-0000-0000-000000000001', 'B gig', now());
insert into public.gig_routines (gig_id, routine_id) values ('b4400000-0000-0000-0000-000000000001', 'a4200000-0000-0000-0000-000000000001');
-- @ B's sync of A's gig does nothing
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000006';
select public.sync_gig_checklist('a4400000-0000-0000-0000-000000000001');
reset role;
select count(*) as still from public.gig_checklist_items where gig_id = 'a4400000-0000-0000-0000-000000000001';
-- @ deleting the client keeps the gig
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
delete from public.clients where id = 'a4300000-0000-0000-0000-000000000001';
select client_id, user_id is not null as owner_kept from public.gigs;
-- @ deleting a routine updates checklists of its gigs
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
delete from public.routines where id = 'a4200000-0000-0000-0000-000000000001';
select label, source from public.gig_checklist_items order by label;
-- @ deleting the gig cascades
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000005';
delete from public.gigs;
select count(*) from public.gig_checklist_items;
