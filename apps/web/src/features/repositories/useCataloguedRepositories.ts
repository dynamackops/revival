import { useCallback, useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import type { CataloguedRepository } from "./types";

export function useCataloguedRepositories(userId: string | undefined) {
  const [repositories, setRepositories] = useState<CataloguedRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!userId) {
      setRepositories([]);
      return;
    }

    setLoading(true);
    setError(undefined);

    const client = getSupabaseBrowserClient();
    const { data, error: queryError } = await client
      .from("repositories")
      .select(
        "id, github_repository_id, owner, name, default_branch, visibility, last_commit_at, dormant_since, status",
      )
      .order("created_at", { ascending: false });

    if (queryError) {
      setError("Your catalogued repositories could not be loaded. Please refresh.");
      setLoading(false);
      return;
    }

    setRepositories(
      (data ?? []).map((row) => ({
        id: row.id as string,
        githubRepositoryId: Number(row.github_repository_id),
        owner: row.owner as string,
        name: row.name as string,
        defaultBranch: row.default_branch as string,
        visibility: row.visibility as CataloguedRepository["visibility"],
        lastCommitAt: row.last_commit_at as string | null,
        dormantSince: row.dormant_since as string | null,
        status: row.status as CataloguedRepository["status"],
      })),
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { repositories, loading, error, refresh };
}
