-- Core: profiles, trial, write access, owner policies
-- @ create users (trigger creates profiles)
insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','a@x.com','{"display_name":"Alice"}'),
 ('22222222-2222-2222-2222-222222222222','b@x.com','{}');
select id, display_name, trial_ends_at > now() as on_trial from public.profiles order by id;
-- @ user A sees only own profile
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select count(*) from public.profiles;
-- @ user A can update allowed columns
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update public.profiles set display_name = 'Alicia', theme = 'light' where id = auth.uid() returning display_name, theme;
-- @ EXPECT_FAIL user A cannot extend trial
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update public.profiles set trial_ends_at = now() + interval '1 year';
-- @ EXPECT_FAIL user A cannot fake subscription
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update public.profiles set subscription_status = 'active';
-- @ user A cannot touch user B (0 rows updated)
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update public.profiles set display_name = 'hacked' where id = '22222222-2222-2222-2222-222222222222' returning id;
select display_name from public.profiles;
-- @ write access during trial
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select public.has_write_access();
-- @ expired trial without subscription => no write access
update public.profiles set trial_ends_at = now() - interval '1 day' where id = '22222222-2222-2222-2222-222222222222';
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select public.has_write_access();
-- @ past_due keeps access
update public.profiles set subscription_status = 'past_due' where id = '22222222-2222-2222-2222-222222222222';
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select public.has_write_access();
-- @ apply_owner_policies works on a sample table
create table public._demo (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), v text, created_at timestamptz default now(), updated_at timestamptz default now());
select public.apply_owner_policies('public._demo');
update public.profiles set subscription_status = 'canceled' where id = '22222222-2222-2222-2222-222222222222';
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public._demo (v) values ('a1') returning v;
-- @ EXPECT_FAIL read-only user B cannot insert
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public._demo (v) values ('b1');
-- @ user B cannot see A's rows
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) from public._demo;
-- @ EXPECT_FAIL anon cannot read profiles
set role anon;
select * from public.profiles;
