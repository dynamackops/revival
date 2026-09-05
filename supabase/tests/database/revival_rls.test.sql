begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'revival-user-one@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'revival-user-two@example.test');

insert into public.profiles (id, display_name, onboarding_complete)
values
  ('11111111-1111-4111-8111-111111111111', 'User One', true),
  ('22222222-2222-4222-8222-222222222222', 'User Two', true);

insert into public.creator_memories (id, user_id, category, content, provenance)
values
  ('11111111-aaaa-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'workflow', 'Ships small slices.', 'user_provided'),
  ('22222222-aaaa-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'workflow', 'Sketches first.', 'user_provided');

insert into private.github_installations (id, user_id, github_installation_id, account_login)
values
  ('11111111-bbbb-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 1001, 'user-one'),
  ('22222222-bbbb-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 1002, 'user-two');

insert into public.repositories (
  id, user_id, github_repository_id, github_installation_reference,
  owner, name, default_branch, visibility, status
)
values
  ('11111111-cccc-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 2001, '11111111-bbbb-4111-8111-111111111111', 'user-one', 'first-repo', 'main', 'private', 'unexamined_artifact'),
  ('22222222-cccc-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 2002, '22222222-bbbb-4222-8222-222222222222', 'user-two', 'second-repo', 'main', 'public', 'unexamined_artifact');

insert into public.excavations (id, user_id, repository_id, commit_sha, state)
values
  ('11111111-dddd-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-cccc-4111-8111-111111111111', repeat('a', 40), 'completed'),
  ('22222222-dddd-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '22222222-cccc-4222-8222-222222222222', repeat('b', 40), 'completed');

insert into public.excavation_findings (
  id, user_id, excavation_id, kind, statement, confidence_label
)
values
  ('11111111-eeee-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111', 'purpose', 'First purpose', 'recovered_fact'),
  ('22222222-eeee-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '22222222-dddd-4222-8222-222222222222', 'purpose', 'Second purpose', 'strong_inference');

insert into public.excavation_paths (
  id, user_id, excavation_id, slot, title, summary, rationale
)
values
  ('11111111-ffff-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111', 1, 'First path', 'First summary', 'First rationale'),
  ('22222222-ffff-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '22222222-dddd-4222-8222-222222222222', 1, 'Second path', 'Second summary', 'Second rationale');

insert into public.operations (id, user_id, repository_id, excavation_id, kind, state)
values
  ('11111111-1234-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-cccc-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111', 'excavation', 'completed'),
  ('22222222-1234-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '22222222-cccc-4222-8222-222222222222', '22222222-dddd-4222-8222-222222222222', 'excavation', 'completed');

insert into public.time_capsules (id, user_id, repository_id, excavation_id, title, markdown)
values
  ('11111111-5678-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-cccc-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111', 'First capsule', '# First'),
  ('22222222-5678-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '22222222-cccc-4222-8222-222222222222', '22222222-dddd-4222-8222-222222222222', 'Second capsule', '# Second');

insert into public.user_badges (user_id, badge_id, source_repository_id)
select '11111111-1111-4111-8111-111111111111', id, '11111111-cccc-4111-8111-111111111111'
from public.badge_definitions where slug = 'first-revival';

select results_eq(
  $$select count(*)::bigint from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = any (array['profiles','creator_memories','repositories','excavations','excavation_findings','excavation_paths','operations','time_capsules','badge_definitions','user_badges']) and c.relrowsecurity$$,
  array[10::bigint],
  'every exposed Revival table has RLS enabled'
);

select results_eq(
  $$select count(*)::bigint from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'private' and c.relname = any (array['github_installations','work_orders','sandbox_runs','patches','pull_requests','model_calls','audit_events']) and c.relrowsecurity$$,
  array[7::bigint],
  'private tables also use defense-in-depth RLS'
);

select results_eq(
  $$select count(*)::bigint from information_schema.role_table_grants where table_schema = 'private' and grantee = 'authenticated'$$,
  array[0::bigint],
  'authenticated has no private-schema table grants'
);

select results_eq(
  $$select count(*)::bigint from information_schema.role_table_grants where table_schema = 'public' and grantee = 'anon' and table_name = any (array['profiles','creator_memories','repositories','excavations','excavation_findings','excavation_paths','operations','time_capsules','badge_definitions','user_badges'])$$,
  array[0::bigint],
  'anonymous users have no Revival table grants'
);

select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'revival_artifacts_%_own'$$,
  array[4::bigint],
  'the private artifact bucket has four ownership policies'
);

select results_eq(
  $$select public from storage.buckets where id = 'revival-artifacts'$$,
  array[false],
  'the artifact bucket is private'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select name from public.repositories order by name$$,
  array['first-repo'::text],
  'user one sees only their repository'
);

select results_eq(
  $$select content from public.creator_memories order by content$$,
  array['Ships small slices.'::text],
  'user one sees only their Creator Memory'
);

select results_eq(
  $$select statement from public.excavation_findings order by statement$$,
  array['First purpose'::text],
  'user one sees only their excavation findings'
);

select is_empty(
  $$update public.creator_memories set content = 'Cross-user edit' where id = '22222222-aaaa-4222-8222-222222222222' returning id$$,
  'user one cannot update user two memory'
);

select throws_ok(
  $$update public.creator_memories set user_id = '22222222-2222-4222-8222-222222222222' where id = '11111111-aaaa-4111-8111-111111111111'$$,
  '42501',
  null,
  'WITH CHECK prevents moving an owned row to another user'
);

select throws_ok(
  $$select count(*) from private.github_installations$$,
  '42501',
  null,
  'authenticated cannot read server-only installation records'
);

select * from finish();
rollback;
