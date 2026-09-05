begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (id, email)
values
  ('44444444-4444-4444-8444-444444444444', 'excavator@example.test'),
  ('55555555-5555-4555-8555-555555555555', 'other@example.test');

insert into private.github_installations (id, user_id, github_installation_id, account_login)
values
  ('44444444-aaaa-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 4401, 'excavator'),
  ('55555555-aaaa-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 5501, 'other');

insert into public.repositories (
  id, user_id, github_repository_id, github_installation_reference,
  owner, name, default_branch, visibility
)
values
  ('44444444-bbbb-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 4402, '44444444-aaaa-4444-8444-444444444444', 'excavator', 'lost-project', 'main', 'private'),
  ('55555555-bbbb-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 5502, '55555555-aaaa-4555-8555-555555555555', 'other', 'other-project', 'main', 'public');

select ok(
  has_function_privilege('service_role', 'public.excavation_start(uuid,uuid,text)', 'execute'),
  'service_role can start excavations'
);
select ok(
  not has_function_privilege('authenticated', 'public.excavation_start(uuid,uuid,text)', 'execute'),
  'authenticated cannot manufacture excavation operations'
);
select ok(
  not has_function_privilege('anon', 'public.excavation_progress(uuid,uuid,text,text,smallint,text,text,boolean)', 'execute'),
  'anonymous users cannot advance excavation progress'
);
select results_eq(
  $$select installation_id from public.excavation_repository_get('44444444-4444-4444-8444-444444444444', '44444444-bbbb-4444-8444-444444444444')$$,
  array[4401::bigint],
  'repository lookup returns only an owned installation'
);
select is_empty(
  $$select * from public.excavation_repository_get('44444444-4444-4444-8444-444444444444', '55555555-bbbb-4555-8555-555555555555')$$,
  'repository lookup does not cross users'
);
select results_eq(
  $$select already_started from public.excavation_start('44444444-4444-4444-8444-444444444444', '44444444-bbbb-4444-8444-444444444444', repeat('a', 40))$$,
  array[false],
  'first click starts a new excavation'
);
select results_eq(
  $$select already_started from public.excavation_start('44444444-4444-4444-8444-444444444444', '44444444-bbbb-4444-8444-444444444444', repeat('a', 40))$$,
  array[true],
  'duplicate click returns the active excavation'
);
select results_eq(
  $$select count(*)::bigint from public.operations where repository_id = '44444444-bbbb-4444-8444-444444444444' and kind = 'excavation'$$,
  array[1::bigint],
  'duplicate click creates exactly one operation'
);
select results_eq(
  $$select public.excavation_progress('44444444-4444-4444-8444-444444444444', id, 'running', 'Examining project structure', 45, 'collecting_evidence') from public.operations where repository_id = '44444444-bbbb-4444-8444-444444444444'$$,
  array[true],
  'the worker can advance owned progress'
);
select results_eq(
  $$select public.excavation_progress('44444444-4444-4444-8444-444444444444', id, 'running', 'Recovering documentation', 20, 'collecting_evidence') from public.operations where repository_id = '44444444-bbbb-4444-8444-444444444444'$$,
  array[false],
  'stale workers cannot move progress backwards'
);
select results_eq(
  $$select public.excavation_progress('44444444-4444-4444-8444-444444444444', id, 'completed', 'Evidence recovered', 100, 'reconstructing') from public.operations where repository_id = '44444444-bbbb-4444-8444-444444444444'$$,
  array[true],
  'the evidence operation can complete while model reconstruction remains pending'
);
select results_eq(
  $$select public.excavation_progress('44444444-4444-4444-8444-444444444444', id, 'failed', 'Late worker failure', 100, 'failed', 'late_failure', true) from public.operations where repository_id = '44444444-bbbb-4444-8444-444444444444'$$,
  array[false],
  'a late worker cannot overwrite a terminal operation'
);
select results_eq(
  $$select count(*)::bigint from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'operations'$$,
  array[1::bigint],
  'operations is published for Realtime updates'
);

select * from finish();
rollback;
