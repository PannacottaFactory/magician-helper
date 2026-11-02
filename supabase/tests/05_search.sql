-- Phase 5: global search
-- @ setup
insert into auth.users (id, email) values
 ('aaaaaaaa-0000-0000-0000-000000000007','a5@x.com'),
 ('bbbbbbbb-0000-0000-0000-000000000008','b5@x.com');
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000007';
insert into public.tricks (name, effect, tags) values ('Ambitious Card', 'Card rises', '{Opener}'), ('Coin vanish', null, '{}');
insert into public.clients (name, company) values ('Card Lovers Club', 'CLC');
insert into public.ideas (title, content) values ('New card idea', '<p>secret 100% method</p>');
insert into public.inventory_items (item_name) values ('Bicycle card deck');
select count(*) from public.tricks;
-- @ search finds every kind
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000007';
select kind, title from public.search_all('card') order by kind, title;
-- @ case-insensitive, matches tags
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000007';
select kind, title from public.search_all('OPENER');
-- @ LIKE wildcards are escaped ("100%" matches literally, "_" does not match any char)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000007';
select (select count(*) from public.search_all('100%')) as percent, (select count(*) from public.search_all('c_rd')) as underscore;
-- @ another user finds nothing
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000008';
select count(*) from public.search_all('card');
-- @ EXPECT_FAIL anon cannot search
set role anon;
select * from public.search_all('card');
