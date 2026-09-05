import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import type { ExcavationOperation } from "./types";

export class ExcavationError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = "ExcavationError";
  }
}

function mapOperation(row: Record<string, unknown>): ExcavationOperation {
  return {
    id: String(row.operation_id ?? row.id),
    excavationId: String(row.excavation_id),
    repositoryId: String(row.repository_id ?? ""),
    state: String(row.operation_state ?? row.state) as ExcavationOperation["state"],
    progressStage: String(row.progress_stage ?? "Queued for excavation"),
    progressPercent: Number(row.progress_percent ?? 0),
    errorCode: row.error_code ? String(row.error_code) : null,
    retryable: Boolean(row.retryable),
    presentationSeen: Boolean(row.presentation_seen),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function invoke<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const client = getSupabaseBrowserClient();
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    throw new ExcavationError("unauthenticated", "Sign in again to continue.", 401);
  }
  const { data, error } = await client.functions.invoke("excavation", {
    body: { action, ...payload },
  });
  if (error) {
    const context = (error as { context?: Response }).context;
    let code = "excavation_unavailable";
    let message = "Revival could not reach the excavation engine. Please try again.";
    if (context && typeof context.json === "function") {
      try {
        const parsed = await context.json() as { error?: string; message?: string };
        code = parsed.error ?? code;
        message = parsed.message ?? message;
      } catch {
        // Keep the safe generic message for non-JSON responses.
      }
    }
    throw new ExcavationError(code, message, context?.status ?? 502);
  }
  return data as T;
}

export async function startExcavation(repositoryId: string): Promise<ExcavationOperation> {
  const result = await invoke<{ operation: Record<string, unknown> }>("start", { repositoryId });
  return mapOperation({ ...result.operation, repository_id: repositoryId });
}

export async function markPresentationSeen(excavationId: string): Promise<void> {
  await invoke("mark-presentation-seen", { excavationId });
}

export { mapOperation };
