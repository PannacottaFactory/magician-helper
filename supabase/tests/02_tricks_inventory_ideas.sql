-- Phase 2: tricks, inventory, trick props, ideas, storage
-- @ setup users A (trial) and B
insert into auth.users (id, email) values
 ('aaaaaaaa-0000-0000-0000-000000000001','a2@x.com'),
 ('bbbbbbbb-0000-0000-0000-000000000002','b2@x.com');
-- @ A creates a trick, an item and links them
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.tricks (id, name, categories, difficulty, status, tags)
  values ('10000000-0000-0000-0000-000000000001', 'Ambitious Card', '{card,close_up}', 3, 'learning', '{Opener}');
insert into public.inventory_items (id, item_name, quantity, low_stock_threshold)
  values ('20000000-0000-0000-0000-000000000001', 'Bicycle deck', 2, 3);
insert into public.trick_props (trick_id, item_id, quantity_needed)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1);
select stock_status, trick_count from public.inventory_overview;
-- @ stock status recomputed on update
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.inventory_items set quantity = 0 returning stock_status;
-- @ EXPECT_FAIL invalid category refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.tricks (name, categories) values ('x', '{juggling}');
-- @ B cannot see A's tricks
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select count(*) from public.tricks;
-- @ B creates his own trick
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
insert into public.tricks (id, name) values ('10000000-0000-0000-0000-0000000000b1', 'B trick') returning name;
-- @ EXPECT_FAIL B cannot link his trick to A's item (composite FK)
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
insert into public.trick_props (trick_id, item_id) values ('10000000-0000-0000-0000-0000000000b1', '20000000-0000-0000-0000-000000000001');
-- @ EXPECT_FAIL B cannot attach an idea to A's trick
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
insert into public.ideas (title, trick_id) values ('steal', '10000000-0000-0000-0000-000000000001');
-- @ convert idea to trick
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.ideas (id, title, content, tags) values
  ('30000000-0000-0000-0000-000000000001', 'Coin to bite', '<p>Bite a coin &amp; restore it</p><ul><li>use a <strong>gimmick</strong></li></ul>', '{Gimmick}');
select public.convert_idea_to_trick('30000000-0000-0000-0000-000000000001') is not null as created;
-- @ idea is now linked and the trick has the idea content
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
select t.name, t.notes, t.tags from public.ideas i join public.tricks t on t.id = i.trick_id where i.id = '30000000-0000-0000-0000-000000000001';
-- @ EXPECT_FAIL converting twice is refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
select public.convert_idea_to_trick('30000000-0000-0000-0000-000000000001');
-- @ deleting the trick keeps the idea (trick_id set to null, user_id kept)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
delete from public.tricks where id = (select trick_id from public.ideas where id = '30000000-0000-0000-0000-000000000001');
select trick_id, user_id from public.ideas where id = '30000000-0000-0000-0000-000000000001';
-- @ inventory file row must live in the user's folder
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.inventory_files (item_id, storage_path, file_name, kind)
  values ('20000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000001/x-photo.jpg', 'photo.jpg', 'photo') returning kind;
-- @ EXPECT_FAIL file row with a path in another folder is refused
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.inventory_files (item_id, storage_path, file_name, kind)
  values ('20000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002/x/y.jpg', 'y.jpg', 'photo');
-- @ storage: A can upload in own folder
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id, name) values ('inventory', 'aaaaaaaa-0000-0000-0000-000000000001/item/a.jpg') returning name;
-- @ EXPECT_FAIL storage: A cannot upload in B's folder
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id, name) values ('inventory', 'bbbbbbbb-0000-0000-0000-000000000002/item/a.jpg');
-- @ storage: B cannot see A's files
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select count(*) from storage.objects;
-- @ deleting the item cascades props and files
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
delete from public.inventory_items where id = '20000000-0000-0000-0000-000000000001';
select (select count(*) from public.trick_props) as props, (select count(*) from public.inventory_files) as files;
-- @ EXPECT_FAIL read-only user cannot create a trick
update public.profiles set trial_ends_at = now() - interval '1 day' where id = 'bbbbbbbb-0000-0000-0000-000000000002';
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
insert into public.tricks (name) values ('nope');
-- @ read-only user can still read his tricks
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select name from public.tricks;
