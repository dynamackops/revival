begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email)
values ('33333333-3333-4333-8333-333333333333', 'revival-github-app@example.test');

-- Only service_role may execute the GitHub App integration functions.
select ok(
  has_function_privilege('service_role', 'public.github_installation_upsert(uuid,bigint,text)', 'execute'),
  'service_role can execute github_installation_upsert'
);
select ok(
  not has_function_privilege('authenticated', 'public.github_installation_upsert(uuid,bigint,text)', 'execute'),
  'authenticated cannot execute github_installation_upsert'
);
select ok(
  not has_function_privilege('anon', 'public.repository_add(uuid,bigint,bigint,text,text,text,text,timestamptz,timestamptz)', 'execute'),
  'anon cannot execute repository_add'
);
select ok(
  not has_function_privilege('authenticated', 'public.github_installation_get(uuid)', 'execute'),
  'authenticated cannot execute github_installation_get'
);

-- Upsert is idempotent and reflects the latest account login.
select results_eq(
  $$select account_login from public.github_installation_upsert('33333333-3333-4333-8333-333333333333'::uuid, 9001::bigint, 'octocat')$$,
  array['octocat'::text],
  'first upsert stores the installation'
);
select results_eq(
  $$select account_login from public.github_installation_upsert('33333333-3333-4333-8333-333333333333'::uuid, 9001::bigint, 'octocat-renamed')$$,
  array['octocat-renamed'::text],
  'second upsert with the same installation id updates in place'
);
select results_eq(
  $$select count(*)::bigint from private.github_installations where user_id = '33333333-3333-4333-8333-333333333333'::uuid$$,
  array[1::bigint],
  'the upsert never creates a duplicate installation row'
);

select ok(
  public.github_installation_verify('33333333-3333-4333-8333-333333333333'::uuid, 9001::bigint),
  'github_installation_verify confirms an owned installation'
);
select ok(
  not public.github_installation_verify('33333333-3333-4333-8333-333333333333'::uuid, 4242::bigint),
  'github_installation_verify rejects an unregistered installation id'
);

select throws_ok(
  $$select * from public.repository_add('33333333-3333-4333-8333-333333333333'::uuid, 4242::bigint, 5001::bigint, 'octocat', 'demo', 'main', 'public', now(), now())$$,
  '42501',
  null,
  'repository_add refuses an installation id the user does not own'
);

select results_eq(
  $$select already_catalogued from public.repository_add('33333333-3333-4333-8333-333333333333'::uuid, 9001::bigint, 5001::bigint, 'octocat', 'demo', 'main', 'public', now(), now())$$,
  array[false],
  'the first repository_add call catalogues a new repository'
);
select results_eq(
  $$select already_catalogued from public.repository_add('33333333-3333-4333-8333-333333333333'::uuid, 9001::bigint, 5001::bigint, 'octocat', 'demo', 'main', 'public', now(), now())$$,
  array[true],
  'repeating repository_add reports already_catalogued instead of duplicating'
);

select * from finish();
rollback;
