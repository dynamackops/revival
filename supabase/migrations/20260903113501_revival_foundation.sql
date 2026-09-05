-- Revival's browser-visible data is user-owned and protected by RLS.
-- Integration secrets and execution bookkeeping live outside the Data API.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('workflow', 'taste', 'technology', 'scope', 'motivation')),
  content text not null check (char_length(content) between 1 and 1000),
  provenance text not null check (provenance in ('user_provided', 'learned', 'corrected')),
  active boolean not null default true,
  source_reference jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.github_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  github_installation_id bigint not null,
  account_login text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, github_installation_id)
);

create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  github_repository_id bigint not null,
  github_installation_reference uuid not null references private.github_installations (id) on delete restrict,
  owner text not null,
  name text not null,
  default_branch text not null,
  visibility text not null check (visibility in ('public', 'private', 'internal')),
  last_commit_at timestamptz,
  dormant_since timestamptz,
  status text not null default 'unexamined_artifact' check (
    status in ('unexamined_artifact', 'revival_in_progress', 'rescoped', 'preserved', 'revived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, github_repository_id),
  unique (id, user_id)
);

create table public.excavations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  repository_id uuid not null,
  commit_sha text not null check (commit_sha ~ '^[0-9a-f]{40}$'),
  state text not null default 'queued' check (
    state in ('queued', 'collecting_evidence', 'reconstructing', 'needs_clarification', 'completed', 'failed')
  ),
  confidence numeric(4, 3) check (confidence between 0 and 1),
  preliminary boolean not null default false,
  presentation_seen boolean not null default false,
  model_alias text,
  prompt_version text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, user_id),
  foreign key (repository_id, user_id)
    references public.repositories (id, user_id) on delete cascade
);

create table public.excavation_findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  excavation_id uuid not null,
  kind text not null check (kind in ('purpose', 'condition', 'stopping_point', 'unknown', 'question')),
  statement text not null check (char_length(statement) between 1 and 5000),
  confidence_label text not null check (
    confidence_label in ('recovered_fact', 'strong_inference', 'unknown')
  ),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  user_edited boolean not null default false,
  original_statement text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (excavation_id, user_id)
    references public.excavations (id, user_id) on delete cascade
);

create table public.excavation_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  excavation_id uuid not null,
  slot smallint not null check (slot between 1 and 3),
  version integer not null default 1 check (version > 0),
  title text not null check (char_length(title) between 1 and 160),
  summary text not null check (char_length(summary) between 1 and 3000),
  rationale text not null check (char_length(rationale) between 1 and 5000),
  recommended boolean not null default false,
  creator_fit text,
  plan_json jsonb not null default '{}'::jsonb check (jsonb_typeof(plan_json) = 'object'),
  status text not null default 'active' check (status in ('active', 'replaced', 'selected')),
  created_at timestamptz not null default now(),
  foreign key (excavation_id, user_id)
    references public.excavations (id, user_id) on delete cascade,
  unique (excavation_id, slot, version)
);

create unique index excavation_paths_one_active_slot_idx
  on public.excavation_paths (excavation_id, slot)
  where status = 'active';

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  repository_id uuid,
  excavation_id uuid,
  kind text not null check (
    kind in ('excavation', 'path_regeneration', 'rescope', 'preserve', 'sandbox_run', 'pull_request')
  ),
  state text not null default 'queued' check (
    state in ('queued', 'running', 'waiting_for_review', 'completed', 'failed', 'cancelled')
  ),
  progress_stage text not null default 'queued',
  progress_percent smallint check (progress_percent between 0 and 100),
  error_code text,
  retryable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (repository_id, user_id)
    references public.repositories (id, user_id) on delete cascade,
  foreign key (excavation_id, user_id)
    references public.excavations (id, user_id) on delete cascade
);

create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  repository_id uuid not null,
  excavation_id uuid not null,
  title text not null check (char_length(title) between 1 and 160),
  markdown text not null,
  created_at timestamptz not null default now(),
  foreign key (repository_id, user_id)
    references public.repositories (id, user_id) on delete cascade,
  foreign key (excavation_id, user_id)
    references public.excavations (id, user_id) on delete cascade
);

create table public.badge_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  artwork_key text not null
);

create table public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id uuid not null references public.badge_definitions (id) on delete restrict,
  source_repository_id uuid,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id),
  foreign key (source_repository_id)
    references public.repositories (id) on delete set null
);

create table private.work_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.excavation_paths (id) on delete cascade,
  change_boundary jsonb not null check (jsonb_typeof(change_boundary) = 'object'),
  planned_files jsonb not null default '[]'::jsonb check (jsonb_typeof(planned_files) = 'array'),
  success_definition text not null,
  planned_checks jsonb not null default '[]'::jsonb check (jsonb_typeof(planned_checks) = 'array'),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.sandbox_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  work_order_id uuid not null references private.work_orders (id) on delete cascade,
  operation_id uuid not null references public.operations (id) on delete cascade,
  provider_run_id text,
  source_sha text not null check (source_sha ~ '^[0-9a-f]{40}$'),
  state text not null check (state in ('queued', 'running', 'reviewable', 'succeeded', 'failed', 'expired')),
  command_results jsonb not null default '[]'::jsonb check (jsonb_typeof(command_results) = 'array'),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operation_id)
);

create table private.patches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sandbox_run_id uuid not null references private.sandbox_runs (id) on delete cascade,
  storage_object_path text not null unique,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  summary text not null,
  file_count integer not null check (file_count >= 0),
  base_sha text not null check (base_sha ~ '^[0-9a-f]{40}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table private.pull_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patch_id uuid not null references private.patches (id) on delete cascade,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  branch_name text not null,
  head_sha text,
  pull_request_number integer,
  pull_request_url text,
  state text not null check (state in ('proposed', 'approved', 'publishing', 'opened', 'failed')),
  idempotency_key text not null unique,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.model_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  operation_id uuid references public.operations (id) on delete set null,
  model_alias text not null,
  prompt_version text not null,
  latency_ms integer check (latency_ms >= 0),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  schema_valid boolean not null default false,
  error_metadata jsonb,
  created_at timestamptz not null default now()
);

create table private.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  subject_type text not null,
  subject_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index creator_memories_user_active_idx on public.creator_memories (user_id, active);
create index repositories_user_status_idx on public.repositories (user_id, status);
create index repositories_installation_idx on public.repositories (github_installation_reference);
create index excavations_user_idx on public.excavations (user_id);
create index excavations_repository_idx on public.excavations (repository_id);
create index findings_user_idx on public.excavation_findings (user_id);
create index findings_excavation_sort_idx on public.excavation_findings (excavation_id, sort_order);
create index paths_user_idx on public.excavation_paths (user_id);
create index paths_excavation_slot_idx on public.excavation_paths (excavation_id, slot);
create index operations_user_updated_idx on public.operations (user_id, updated_at desc);
create index operations_repository_idx on public.operations (repository_id);
create index operations_excavation_idx on public.operations (excavation_id);
create index time_capsules_user_idx on public.time_capsules (user_id);
create index time_capsules_repository_idx on public.time_capsules (repository_id);
create index time_capsules_excavation_idx on public.time_capsules (excavation_id);
create index user_badges_badge_idx on public.user_badges (badge_id);
create index user_badges_repository_idx on public.user_badges (source_repository_id);

create index github_installations_user_idx on private.github_installations (user_id);
create index work_orders_user_idx on private.work_orders (user_id);
create index work_orders_path_idx on private.work_orders (path_id);
create index sandbox_runs_user_idx on private.sandbox_runs (user_id);
create index sandbox_runs_work_order_idx on private.sandbox_runs (work_order_id);
create index patches_user_idx on private.patches (user_id);
create index patches_sandbox_run_idx on private.patches (sandbox_run_id);
create index pull_requests_user_idx on private.pull_requests (user_id);
create index pull_requests_patch_idx on private.pull_requests (patch_id);
create index pull_requests_repository_idx on private.pull_requests (repository_id);
create index model_calls_user_idx on private.model_calls (user_id);
create index model_calls_operation_idx on private.model_calls (operation_id);
create index audit_events_user_created_idx on private.audit_events (user_id, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger creator_memories_set_updated_at
before update on public.creator_memories
for each row execute function private.set_updated_at();

create trigger repositories_set_updated_at
before update on public.repositories
for each row execute function private.set_updated_at();

create trigger findings_set_updated_at
before update on public.excavation_findings
for each row execute function private.set_updated_at();

create trigger operations_set_updated_at
before update on public.operations
for each row execute function private.set_updated_at();

create trigger github_installations_set_updated_at
before update on private.github_installations
for each row execute function private.set_updated_at();

create trigger work_orders_set_updated_at
before update on private.work_orders
for each row execute function private.set_updated_at();

create trigger sandbox_runs_set_updated_at
before update on private.sandbox_runs
for each row execute function private.set_updated_at();

create trigger pull_requests_set_updated_at
before update on private.pull_requests
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.creator_memories enable row level security;
alter table public.repositories enable row level security;
alter table public.excavations enable row level security;
alter table public.excavation_findings enable row level security;
alter table public.excavation_paths enable row level security;
alter table public.operations enable row level security;
alter table public.time_capsules enable row level security;
alter table public.badge_definitions enable row level security;
alter table public.user_badges enable row level security;

alter table private.github_installations enable row level security;
alter table private.work_orders enable row level security;
alter table private.sandbox_runs enable row level security;
alter table private.patches enable row level security;
alter table private.pull_requests enable row level security;
alter table private.model_calls enable row level security;
alter table private.audit_events enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy creator_memories_select_own on public.creator_memories
for select to authenticated using ((select auth.uid()) = user_id);
create policy creator_memories_insert_own on public.creator_memories
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy creator_memories_update_own on public.creator_memories
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy creator_memories_delete_own on public.creator_memories
for delete to authenticated using ((select auth.uid()) = user_id);

create policy repositories_select_own on public.repositories
for select to authenticated using ((select auth.uid()) = user_id);
create policy repositories_delete_own on public.repositories
for delete to authenticated using ((select auth.uid()) = user_id);

create policy excavations_select_own on public.excavations
for select to authenticated using ((select auth.uid()) = user_id);

create policy excavation_findings_select_own on public.excavation_findings
for select to authenticated using ((select auth.uid()) = user_id);
create policy excavation_findings_update_own on public.excavation_findings
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy excavation_paths_select_own on public.excavation_paths
for select to authenticated using ((select auth.uid()) = user_id);

create policy operations_select_own on public.operations
for select to authenticated using ((select auth.uid()) = user_id);

create policy time_capsules_select_own on public.time_capsules
for select to authenticated using ((select auth.uid()) = user_id);

create policy badge_definitions_select_authenticated on public.badge_definitions
for select to authenticated using (true);

create policy user_badges_select_own on public.user_badges
for select to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.creator_memories to authenticated;
grant select, delete on public.repositories to authenticated;
grant select on public.excavations to authenticated;
grant select, update on public.excavation_findings to authenticated;
grant select on public.excavation_paths to authenticated;
grant select on public.operations to authenticated;
grant select on public.time_capsules to authenticated;
grant select on public.badge_definitions to authenticated;
grant select on public.user_badges to authenticated;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema private from anon, authenticated;
grant all on all tables in schema private to service_role;
grant all on all sequences in schema private to service_role;

insert into public.badge_definitions (slug, name, description, artwork_key)
values (
  'first-revival',
  'First Revival',
  'You brought a project back to life.',
  'first-revival'
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    artwork_key = excluded.artwork_key;

insert into storage.buckets (id, name, public)
values ('revival-artifacts', 'revival-artifacts', false)
on conflict (id) do update set public = false;

create policy revival_artifacts_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'revival-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy revival_artifacts_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'revival-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy revival_artifacts_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'revival-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'revival-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy revival_artifacts_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'revival-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
