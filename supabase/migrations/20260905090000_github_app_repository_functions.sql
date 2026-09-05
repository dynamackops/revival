-- GitHub App installation mapping and repository cataloguing.
--
-- private.github_installations is intentionally outside the Data API's
-- exposed schemas, and authenticated users have no INSERT/UPDATE grant on
-- public.repositories. The github-app Edge Function (running with the
-- service-role key) is the only caller of these narrowly scoped
-- SECURITY DEFINER functions. Each function validates its own arguments,
-- pins an empty search_path, and never returns or stores an installation
-- access token or the GitHub App private key.

-- Note: the output columns are named installation_id (not
-- github_installation_id) even though that is the underlying column name.
-- PL/pgSQL turns RETURNS TABLE columns into OUT variables, and an OUT
-- variable named identically to a column referenced bare in an ON CONFLICT
-- target list (which cannot be schema-qualified) is ambiguous. Renaming the
-- OUT column sidesteps that without weakening the upsert's conflict target.
create or replace function public.github_installation_upsert(
  p_user_id uuid,
  p_installation_id bigint,
  p_account_login text
)
returns table (id uuid, installation_id bigint, account_login text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id is required' using errcode = '22023';
  end if;
  if p_installation_id is null or p_installation_id <= 0 then
    raise exception 'p_installation_id must be a positive integer' using errcode = '22023';
  end if;
  if p_account_login is null or length(trim(p_account_login)) = 0 then
    raise exception 'p_account_login is required' using errcode = '22023';
  end if;

  return query
  insert into private.github_installations as gi (user_id, github_installation_id, account_login)
  values (p_user_id, p_installation_id, trim(p_account_login))
  on conflict (user_id, github_installation_id)
  do update set account_login = excluded.account_login, updated_at = now()
  returning gi.id, gi.github_installation_id, gi.account_login;
end;
$$;

revoke all on function public.github_installation_upsert(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.github_installation_upsert(uuid, bigint, text) to service_role;

create or replace function public.github_installation_get(p_user_id uuid)
returns table (id uuid, installation_id bigint, account_login text)
language sql
security definer
stable
set search_path = ''
as $$
  select id, github_installation_id, account_login
  from private.github_installations
  where user_id = p_user_id
  order by updated_at desc;
$$;

revoke all on function public.github_installation_get(uuid) from public, anon, authenticated;
grant execute on function public.github_installation_get(uuid) to service_role;

create or replace function public.github_installation_verify(
  p_user_id uuid,
  p_installation_id bigint
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from private.github_installations
    where user_id = p_user_id
      and github_installation_id = p_installation_id
  );
$$;

revoke all on function public.github_installation_verify(uuid, bigint) from public, anon, authenticated;
grant execute on function public.github_installation_verify(uuid, bigint) to service_role;

create or replace function public.repository_add(
  p_user_id uuid,
  p_installation_id bigint,
  p_github_repository_id bigint,
  p_owner text,
  p_name text,
  p_default_branch text,
  p_visibility text,
  p_last_commit_at timestamptz,
  p_dormant_since timestamptz
)
returns table (
  id uuid,
  owner text,
  name text,
  default_branch text,
  visibility text,
  status text,
  last_commit_at timestamptz,
  dormant_since timestamptz,
  already_catalogued boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_installation_reference uuid;
  v_existing public.repositories%rowtype;
begin
  if p_user_id is null or p_installation_id is null or p_github_repository_id is null then
    raise exception 'p_user_id, p_installation_id, and p_github_repository_id are required'
      using errcode = '22023';
  end if;
  if p_owner is null or length(trim(p_owner)) = 0 or p_name is null or length(trim(p_name)) = 0 then
    raise exception 'p_owner and p_name are required' using errcode = '22023';
  end if;
  if p_default_branch is null or length(trim(p_default_branch)) = 0 then
    raise exception 'p_default_branch is required' using errcode = '22023';
  end if;
  if p_visibility not in ('public', 'private', 'internal') then
    raise exception 'p_visibility must be public, private, or internal' using errcode = '22023';
  end if;

  select gi.id into v_installation_reference
  from private.github_installations gi
  where gi.user_id = p_user_id
    and gi.github_installation_id = p_installation_id;

  if v_installation_reference is null then
    raise exception 'installation % is not registered for this user', p_installation_id
      using errcode = '42501';
  end if;

  select * into v_existing
  from public.repositories r
  where r.user_id = p_user_id
    and r.github_repository_id = p_github_repository_id;

  if found then
    return query
    select
      v_existing.id, v_existing.owner, v_existing.name, v_existing.default_branch,
      v_existing.visibility, v_existing.status, v_existing.last_commit_at,
      v_existing.dormant_since, true;
    return;
  end if;

  return query
  insert into public.repositories (
    user_id, github_repository_id, github_installation_reference,
    owner, name, default_branch, visibility, last_commit_at, dormant_since
  )
  values (
    p_user_id, p_github_repository_id, v_installation_reference,
    trim(p_owner), trim(p_name), p_default_branch, p_visibility,
    p_last_commit_at, p_dormant_since
  )
  returning
    public.repositories.id, public.repositories.owner, public.repositories.name,
    public.repositories.default_branch, public.repositories.visibility,
    public.repositories.status, public.repositories.last_commit_at,
    public.repositories.dormant_since, false;
end;
$$;

revoke all on function public.repository_add(
  uuid, bigint, bigint, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.repository_add(
  uuid, bigint, bigint, text, text, text, text, timestamptz, timestamptz
) to service_role;
