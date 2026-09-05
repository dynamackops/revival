-- Durable, idempotent excavation operations.
--
-- The browser may read its own excavation and operation rows through RLS,
-- but only the service-role Edge Function can create or advance them.

create unique index operations_one_active_excavation_per_repository_idx
  on public.operations (repository_id)
  where kind = 'excavation' and state in ('queued', 'running');

create index operations_user_excavation_updated_idx
  on public.operations (user_id, updated_at desc)
  where kind = 'excavation';

create or replace function public.excavation_repository_get(
  p_user_id uuid,
  p_repository_id uuid
)
returns table (
  repository_id uuid,
  owner text,
  name text,
  default_branch text,
  status text,
  installation_id bigint
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    r.id,
    r.owner,
    r.name,
    r.default_branch,
    r.status,
    gi.github_installation_id
  from public.repositories r
  join private.github_installations gi
    on gi.id = r.github_installation_reference
   and gi.user_id = r.user_id
  where r.id = p_repository_id
    and r.user_id = p_user_id;
$$;

revoke all on function public.excavation_repository_get(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.excavation_repository_get(uuid, uuid) to service_role;

create or replace function public.excavation_start(
  p_user_id uuid,
  p_repository_id uuid,
  p_commit_sha text
)
returns table (
  operation_id uuid,
  excavation_id uuid,
  operation_state text,
  progress_stage text,
  progress_percent smallint,
  presentation_seen boolean,
  commit_sha text,
  already_started boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_repository public.repositories%rowtype;
  v_operation public.operations%rowtype;
  v_excavation public.excavations%rowtype;
begin
  if p_user_id is null or p_repository_id is null then
    raise exception 'p_user_id and p_repository_id are required' using errcode = '22023';
  end if;
  if p_commit_sha is null or p_commit_sha !~ '^[0-9a-f]{40}$' then
    raise exception 'p_commit_sha must be a lowercase 40-character Git SHA'
      using errcode = '22023';
  end if;

  select * into v_repository
  from public.repositories r
  where r.id = p_repository_id and r.user_id = p_user_id
  for update;

  if not found then
    raise exception 'repository not found for this user' using errcode = '42501';
  end if;

  select * into v_operation
  from public.operations o
  where o.user_id = p_user_id
    and o.repository_id = p_repository_id
    and o.kind = 'excavation'
    and o.state in ('queued', 'running')
  order by o.created_at desc
  limit 1;

  if found then
    select * into v_excavation
    from public.excavations e
    where e.id = v_operation.excavation_id and e.user_id = p_user_id;

    return query select
      v_operation.id,
      v_excavation.id,
      v_operation.state,
      v_operation.progress_stage,
      v_operation.progress_percent,
      v_excavation.presentation_seen,
      v_excavation.commit_sha,
      true;
    return;
  end if;

  if v_repository.status = 'revival_in_progress' then
    select * into v_operation
    from public.operations o
    where o.user_id = p_user_id
      and o.repository_id = p_repository_id
      and o.kind = 'excavation'
      and o.state = 'failed'
      and o.retryable = true
    order by o.created_at desc
    limit 1
    for update;

    if found then
      update public.operations
      set state = 'queued',
          progress_stage = 'Queued for excavation',
          progress_percent = 0,
          error_code = null,
          retryable = false
      where id = v_operation.id
      returning * into v_operation;

      update public.excavations
      set state = 'queued', completed_at = null
      where id = v_operation.excavation_id and user_id = p_user_id
      returning * into v_excavation;

      return query select
        v_operation.id,
        v_excavation.id,
        v_operation.state,
        v_operation.progress_stage,
        v_operation.progress_percent,
        v_excavation.presentation_seen,
        v_excavation.commit_sha,
        true;
      return;
    end if;
  end if;

  if v_repository.status <> 'unexamined_artifact' then
    raise exception 'repository is not available for a new excavation' using errcode = '55000';
  end if;

  insert into public.excavations (user_id, repository_id, commit_sha, state)
  values (p_user_id, p_repository_id, p_commit_sha, 'queued')
  returning * into v_excavation;

  insert into public.operations (
    user_id, repository_id, excavation_id, kind, state, progress_stage, progress_percent
  )
  values (
    p_user_id, p_repository_id, v_excavation.id, 'excavation', 'queued', 'Queued for excavation', 0
  )
  returning * into v_operation;

  update public.repositories
  set status = 'revival_in_progress'
  where id = p_repository_id and user_id = p_user_id;

  return query select
    v_operation.id,
    v_excavation.id,
    v_operation.state,
    v_operation.progress_stage,
    v_operation.progress_percent,
    v_excavation.presentation_seen,
    v_excavation.commit_sha,
    false;
end;
$$;

revoke all on function public.excavation_start(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.excavation_start(uuid, uuid, text) to service_role;

create or replace function public.excavation_progress(
  p_user_id uuid,
  p_operation_id uuid,
  p_operation_state text,
  p_progress_stage text,
  p_progress_percent smallint,
  p_excavation_state text,
  p_error_code text default null,
  p_retryable boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_excavation_id uuid;
  v_current_percent smallint;
  v_current_state text;
begin
  if p_operation_state not in ('queued', 'running', 'waiting_for_review', 'completed', 'failed', 'cancelled') then
    raise exception 'invalid operation state' using errcode = '22023';
  end if;
  if p_excavation_state not in ('queued', 'collecting_evidence', 'reconstructing', 'needs_clarification', 'completed', 'failed') then
    raise exception 'invalid excavation state' using errcode = '22023';
  end if;
  if p_progress_percent is null or p_progress_percent < 0 or p_progress_percent > 100 then
    raise exception 'progress must be between 0 and 100' using errcode = '22023';
  end if;
  if p_progress_stage is null or length(trim(p_progress_stage)) = 0 then
    raise exception 'progress stage is required' using errcode = '22023';
  end if;

  select o.excavation_id, coalesce(o.progress_percent, 0), o.state
  into v_excavation_id, v_current_percent, v_current_state
  from public.operations o
  where o.id = p_operation_id
    and o.user_id = p_user_id
    and o.kind = 'excavation'
  for update;

  if not found then
    raise exception 'excavation operation not found for this user' using errcode = '42501';
  end if;

  if v_current_state in ('completed', 'failed', 'cancelled') then
    return false;
  end if;

  if p_operation_state <> 'failed' and p_progress_percent < v_current_percent then
    return false;
  end if;

  update public.operations
  set state = p_operation_state,
      progress_stage = trim(p_progress_stage),
      progress_percent = p_progress_percent,
      error_code = p_error_code,
      retryable = p_retryable
  where id = p_operation_id and user_id = p_user_id;

  update public.excavations
  set state = p_excavation_state,
      completed_at = case when p_excavation_state = 'completed' then now() else completed_at end
  where id = v_excavation_id and user_id = p_user_id;

  return true;
end;
$$;

revoke all on function public.excavation_progress(
  uuid, uuid, text, text, smallint, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.excavation_progress(
  uuid, uuid, text, text, smallint, text, text, boolean
) to service_role;

create or replace function public.excavation_presentation_seen(
  p_user_id uuid,
  p_excavation_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  update public.excavations
  set presentation_seen = true
  where id = p_excavation_id and user_id = p_user_id
  returning true;
$$;

revoke all on function public.excavation_presentation_seen(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.excavation_presentation_seen(uuid, uuid) to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'operations'
  ) then
    alter publication supabase_realtime add table public.operations;
  end if;
end;
$$;
