-- Cover composite parent-and-owner foreign keys so deletes and joins remain efficient.

create index findings_excavation_user_idx
  on public.excavation_findings (excavation_id, user_id);

create index paths_excavation_user_idx
  on public.excavation_paths (excavation_id, user_id);

create index excavations_repository_user_idx
  on public.excavations (repository_id, user_id);

create index operations_repository_user_idx
  on public.operations (repository_id, user_id);

create index operations_excavation_user_idx
  on public.operations (excavation_id, user_id);

create index time_capsules_repository_user_idx
  on public.time_capsules (repository_id, user_id);

create index time_capsules_excavation_user_idx
  on public.time_capsules (excavation_id, user_id);
