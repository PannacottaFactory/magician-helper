-- Phase 3: routines, routine tricks ordering, practice log, computed views
-- @ setup
insert into auth.users (id, email) values
 ('aaaaaaaa-0000-0000-0000-000000000003','a3@x.com'),
 ('bbbbbbbb-0000-0000-0000-000000000004','b3@x.com');
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
insert into public.tricks (id, name, difficulty, duration_min, status) values
  ('a3000000-0000-0000-0000-000000000001', 'Opener', 2, 5, 'performance_ready'),
  ('a3000000-0000-0000-0000-000000000002', 'Middle', 4, 8, 'learning'),
  ('a3000000-0000-0000-0000-000000000003', 'Closer', 3, 7, 'performance_ready');
insert into public.inventory_items (id, item_name, quantity, catalog_key) values
  ('a3100000-0000-0000-0000-000000000001', 'Deck', 1, 'bicycle-red'),
  ('a3100000-0000-0000-0000-000000000002', 'Sponge balls', 0, null);
insert into public.trick_props (trick_id, item_id, quantity_needed) values
  ('a3000000-0000-0000-0000-000000000001', 'a3100000-0000-0000-0000-000000000001', 1),
  ('a3000000-0000-0000-0000-000000000003', 'a3100000-0000-0000-0000-000000000001', 2),
  ('a3000000-0000-0000-0000-000000000002', 'a3100000-0000-0000-0000-000000000002', 4);
insert into public.routines (id, name, audience_types) values ('a3200000-0000-0000-0000-000000000001', 'Walkaround set', '{corporate,wedding}');
select count(*) from public.tricks;
-- @ catalog key visible in inventory_overview
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
select item_name, catalog_key, trick_count from public.inventory_overview order by item_name;
-- @ EXPECT_FAIL invalid catalog key refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
update public.inventory_items set catalog_key = 'Bad Key!' where id = 'a3100000-0000-0000-0000-000000000001';
-- @ add tricks to routine in order
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
select public.add_trick_to_routine('a3200000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001') is not null;
select public.add_trick_to_routine('a3200000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002') is not null;
select public.add_trick_to_routine('a3200000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003') is not null;
select t.name, rt.position from public.routine_tricks rt join public.tricks t on t.id = rt.trick_id order by rt.position;
-- @ routine stats
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
select trick_count, total_duration_min, avg_difficulty, not_ready_count from public.routines_overview;
-- @ consolidated props (deck counted once with max quantity)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
select item_name, quantity_needed, stock_status, used_by_tricks from public.routine_props order by item_name;
-- @ reorder (reverse) — swaps positions thanks to the deferred unique constraint
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
select public.reorder_routine_tricks('a3200000-0000-0000-0000-000000000001',
  (select array_agg(id order by position desc) from public.routine_tricks where routine_id = 'a3200000-0000-0000-0000-000000000001'));
select t.name from public.routine_tricks rt join public.tricks t on t.id = rt.trick_id order by rt.position;
-- @ EXPECT_FAIL B cannot add his trick to A's routine
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000004';
insert into public.tricks (id, name) values ('b3000000-0000-0000-0000-000000000001', 'B trick');
insert into public.routine_tricks (routine_id, trick_id, position) values ('a3200000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 9);
-- @ B cannot reorder A's routine (no rows touched)
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000004';
select public.reorder_routine_tricks('a3200000-0000-0000-0000-000000000001', array['a3000000-0000-0000-0000-000000000001']::uuid[]);
reset role;
select count(*) as unchanged from public.routine_tricks where position in (0,1,2);
-- @ practice log + last_practiced
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
insert into public.practice_logs (practiced_on, title, trick_id, time_spent_min, self_rating) values
  (current_date - 3, 'Double lift', 'a3000000-0000-0000-0000-000000000001', 20, 3),
  (current_date - 1, 'Double lift', 'a3000000-0000-0000-0000-000000000001', 15, 4),
  (current_date,     'Pass',        null, 10, null);
select name, last_practiced = current_date - 1 as ok, practice_sessions, practice_minutes, routine_count
  from public.tricks_overview where id = 'a3000000-0000-0000-0000-000000000001';
-- @ EXPECT_FAIL self rating out of range refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
insert into public.practice_logs (title, self_rating) values ('x', 6);
-- @ deleting a trick keeps practice logs (trick_id set null) and removes it from routines
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000003';
delete from public.tricks where id = 'a3000000-0000-0000-0000-000000000001';
select (select count(*) from public.practice_logs where title = 'Double lift' and trick_id is null) as logs_kept,
       (select trick_count from public.routines_overview) as tricks_left;
-- @ B sees nothing of A
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000004';
select (select count(*) from public.routines) + (select count(*) from public.practice_logs) + (select count(*) from public.routine_props) as visible;
