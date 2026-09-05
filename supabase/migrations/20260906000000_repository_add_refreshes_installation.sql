-- When a GitHub App installation is uninstalled and reinstalled, GitHub
-- assigns a brand new installation ID. A repository catalogued under the
-- old installation kept a stale github_installation_reference forever,
-- because repository_add's "already catalogued" branch returned the
-- existing row without updating it. Any Edge Function that later minted an
-- installation token for that repository (excavation, and eventually the
-- sandbox worker) would then fail against GitHub with 401/403/404 for an
-- installation that no longer exists.
--
-- Re-adding a repository through the picker is exactly the moment a user
-- has just confirmed, live, that a specific installation currently
-- authorizes it (list-authorized-repositories only lists repositories
-- GitHub reports for the caller's real installations). So on conflict,
-- refresh the installation reference and other live metadata instead of
-- leaving them stale, while still reporting already_catalogued so the
-- client does not treat it as a new artifact.
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
    update public.repositories as repo
    set github_installation_reference = v_installation_reference,
        owner = trim(p_owner),
        name = trim(p_name),
        default_branch = p_default_branch,
        visibility = p_visibility,
        last_commit_at = coalesce(p_last_commit_at, v_existing.last_commit_at),
        dormant_since = coalesce(p_dormant_since, v_existing.dormant_since)
    where repo.id = v_existing.id
    returning repo.* into v_existing;

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
