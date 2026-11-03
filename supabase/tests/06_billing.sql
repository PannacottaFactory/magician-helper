-- Phase 6: billing — trial expiry, subscription states, protected columns
-- @ setup
insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000009','a6@x.com');
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
select can_write, on_trial from public.my_access();
-- @ EXPECT_FAIL user cannot read webhook events
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
select * from public.stripe_events;
-- @ EXPECT_FAIL user cannot set his own Stripe customer id
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
update public.profiles set stripe_customer_id = 'cus_fake';
-- @ trial expired, no subscription → read-only (reads OK, writes refused)
update public.profiles set trial_ends_at = now() - interval '1 minute' where id = 'aaaaaaaa-0000-0000-0000-000000000009';
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
select can_write, on_trial from public.my_access();
-- @ EXPECT_FAIL read-only user cannot create a gig
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
insert into public.gigs (title, starts_at) values ('nope', now());
-- @ read-only user can still change preferences (profile is not data)
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
update public.profiles set theme = 'light' returning theme;
-- @ webhook (service role) activates the subscription → writes allowed again
update public.profiles set subscription_status = 'active', stripe_customer_id = 'cus_123', current_period_end = now() + interval '30 days'
 where id = 'aaaaaaaa-0000-0000-0000-000000000009';
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
insert into public.gigs (title, starts_at) values ('back in business', now()) returning title;
-- @ subscribed during trial (Stripe "trialing") → write access, not "on trial" in-app
update public.profiles set subscription_status = 'trialing', trial_ends_at = now() + interval '3 days' where id = 'aaaaaaaa-0000-0000-0000-000000000009';
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
select can_write, on_trial from public.my_access();
-- @ canceled after trial → read-only again
update public.profiles set subscription_status = 'canceled', trial_ends_at = now() - interval '1 day' where id = 'aaaaaaaa-0000-0000-0000-000000000009';
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000009';
select can_write from public.my_access();
-- @ deleting the auth user removes every row (account deletion)
delete from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000009';
select (select count(*) from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000009') + (select count(*) from public.gigs where user_id = 'aaaaaaaa-0000-0000-0000-000000000009') as left_over;
