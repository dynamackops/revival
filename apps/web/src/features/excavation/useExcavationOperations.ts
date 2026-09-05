import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import {
  ExcavationError,
  mapOperation,
  markPresentationSeen as apiMarkPresentationSeen,
  startExcavation as apiStartExcavation,
} from "./excavationClient";
import type { ExcavationOperation } from "./types";

export function excavationMessage(error: unknown): string {
  if (error instanceof ExcavationError) {
    if (error.code === "repository_access_revoked") {
      return "GitHub access changed. Reconnect this repository, then try again.";
    }
    if (error.code === "unauthenticated") return "Your session expired. Sign in again to excavate.";
    return error.message;
  }
  return "Revival could not start the excavation. Please try again.";
}

export function useExcavationOperations(userId: string | undefined, repositoryIds: string[]) {
  const [operations, setOperations] = useState<Record<string, ExcavationOperation>>({});
  const [startingRepositoryId, setStartingRepositoryId] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const repositoryKey = [...repositoryIds].sort().join("|");
  const stableRepositoryIds = useMemo(
    () => repositoryKey ? repositoryKey.split("|") : [],
    [repositoryKey],
  );

  const mergeOperation = useCallback((operation: ExcavationOperation) => {
    setOperations((current) => ({ ...current, [operation.repositoryId]: operation }));
  }, []);

  const refresh = useCallback(async () => {
    if (!userId || stableRepositoryIds.length === 0) {
      setOperations({});
      return;
    }
    const client = getSupabaseBrowserClient();
    const { data, error: queryError } = await client
      .from("operations")
      .select("id, excavation_id, repository_id, state, progress_stage, progress_percent, error_code, retryable, updated_at")
      .eq("kind", "excavation")
      .in("repository_id", stableRepositoryIds)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError("Active excavations could not be restored. Refresh to try again.");
      return;
    }

    const latestByRepository = new Map<string, Record<string, unknown>>();
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const repositoryId = String(row.repository_id);
      if (!latestByRepository.has(repositoryId)) latestByRepository.set(repositoryId, row);
    }
    const excavationIds = [...latestByRepository.values()].map((row) => String(row.excavation_id));
    let seen = new Map<string, boolean>();
    if (excavationIds.length > 0) {
      const { data: excavationRows } = await client
        .from("excavations")
        .select("id, presentation_seen")
        .in("id", excavationIds);
      seen = new Map(
        ((excavationRows ?? []) as Array<{ id: string; presentation_seen: boolean }>)
          .map((row) => [row.id, row.presentation_seen]),
      );
    }
    const next: Record<string, ExcavationOperation> = {};
    for (const [repositoryId, row] of latestByRepository) {
      next[repositoryId] = mapOperation({
        ...row,
        presentation_seen: seen.get(String(row.excavation_id)) ?? false,
      });
    }
    setOperations(next);
    setError(undefined);
  }, [stableRepositoryIds, userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!userId || stableRepositoryIds.length === 0) return;
    const client = getSupabaseBrowserClient();
    const channel = client
      .channel(`excavations:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operations", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.kind !== "excavation") return;
          const repositoryId = String(row.repository_id ?? "");
          if (!stableRepositoryIds.includes(repositoryId)) return;
          setOperations((current) => ({
            ...current,
            [repositoryId]: mapOperation({
              ...row,
              presentation_seen: current[repositoryId]?.presentationSeen ?? false,
            }),
          }));
        },
      )
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [stableRepositoryIds, userId]);

  const start = useCallback(async (repositoryId: string) => {
    setStartingRepositoryId(repositoryId);
    setError(undefined);
    try {
      const operation = await apiStartExcavation(repositoryId);
      mergeOperation(operation);
      return operation;
    } catch (startError) {
      setError(excavationMessage(startError));
      return undefined;
    } finally {
      setStartingRepositoryId(null);
    }
  }, [mergeOperation]);

  const markPresentationSeen = useCallback(async (repositoryId: string, excavationId: string) => {
    try {
      await apiMarkPresentationSeen(excavationId);
      setOperations((current) => current[repositoryId]
        ? { ...current, [repositoryId]: { ...current[repositoryId], presentationSeen: true } }
        : current);
    } catch (presentationError) {
      setError(excavationMessage(presentationError));
    }
  }, []);

  return { operations, startingRepositoryId, error, start, markPresentationSeen, refresh };
}
