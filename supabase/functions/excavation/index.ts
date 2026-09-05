import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";
import { createAppJwt, mintInstallationToken } from "../github-app/github.ts";
import {
  examineStructure,
  fetchHeadSha,
  recoverDocumentation,
  RepositoryEvidenceError,
  traceHistory,
} from "./github.ts";
import { runEvidencePipeline } from "./pipeline.ts";

class HandledError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = "HandledError";
  }
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  EXCAVATION_STAGE_DELAY_MS: number;
}

interface RepositoryContext {
  repository_id: string;
  owner: string;
  name: string;
  default_branch: string;
  installation_id: number;
}

interface ExcavationSnapshot {
  operation_id: string;
  excavation_id: string;
  operation_state: string;
  progress_stage: string;
  progress_percent: number | null;
  presentation_seen: boolean;
  commit_sha: string;
  already_started: boolean;
}

function readEnv(): Env {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GITHUB_APP_ID",
    "GITHUB_APP_PRIVATE_KEY",
  ] as const;
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of required) {
    const value = Deno.env.get(name);
    if (value) values[name] = value;
    else missing.push(name);
  }
  if (missing.length > 0) {
    throw new HandledError("server_misconfigured", "Excavation is not configured", 500);
  }
  const rawDelay = Number(Deno.env.get("EXCAVATION_STAGE_DELAY_MS") ?? "650");
  return {
    ...(values as unknown as Omit<Env, "EXCAVATION_STAGE_DELAY_MS">),
    EXCAVATION_STAGE_DELAY_MS: Number.isFinite(rawDelay)
      ? Math.min(2_000, Math.max(0, rawDelay))
      : 650,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticate(req: Request, admin: SupabaseClient): Promise<string> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new HandledError("unauthenticated", "Sign in to excavate a repository", 401);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HandledError("unauthenticated", "Your session expired", 401);
  return data.user.id;
}

async function repositoryContext(
  admin: SupabaseClient,
  userId: string,
  repositoryId: string,
): Promise<RepositoryContext> {
  const { data, error } = await admin.rpc("excavation_repository_get", {
    p_user_id: userId,
    p_repository_id: repositoryId,
  });
  if (error) throw new HandledError("repository_lookup_failed", error.message, 500);
  const row = (data ?? [])[0] as RepositoryContext | undefined;
  if (!row) throw new HandledError("repository_forbidden", "Repository not found", 403);
  return row;
}

async function reportProgress(
  admin: SupabaseClient,
  userId: string,
  operationId: string,
  params: {
    operationState: string;
    stage: string;
    percent: number;
    excavationState: string;
    errorCode?: string;
    retryable?: boolean;
  },
): Promise<void> {
  const { error } = await admin.rpc("excavation_progress", {
    p_user_id: userId,
    p_operation_id: operationId,
    p_operation_state: params.operationState,
    p_progress_stage: params.stage,
    p_progress_percent: params.percent,
    p_excavation_state: params.excavationState,
    p_error_code: params.errorCode ?? null,
    p_retryable: params.retryable ?? false,
  });
  if (error) throw error;
}

async function runExcavation(
  admin: SupabaseClient,
  env: Env,
  userId: string,
  repository: RepositoryContext,
  operationId: string,
  commitSha: string,
  installationToken: string,
): Promise<void> {
  try {
    await runEvidencePipeline(
      {
        documentation: () => recoverDocumentation(
          installationToken, repository.owner, repository.name, commitSha,
        ),
        structure: () => examineStructure(
          installationToken, repository.owner, repository.name, commitSha,
        ),
        history: () => traceHistory(
          installationToken, repository.owner, repository.name, commitSha,
        ),
        // Item 6 prepares the evidence boundary. Nemotron performs the
        // actual reconstruction in item 7 after Nebius is configured.
        prepareReconstruction: async () => {},
      },
      ({ label, percent }) => reportProgress(admin, userId, operationId, {
        operationState: "running",
        stage: label,
        percent,
        excavationState: label === "Reconstructing intent"
          ? "reconstructing"
          : "collecting_evidence",
      }),
      (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
      env.EXCAVATION_STAGE_DELAY_MS,
    );

    await reportProgress(admin, userId, operationId, {
      operationState: "completed",
      stage: "Evidence recovered · Nemotron reconstruction is next",
      percent: 100,
      excavationState: "reconstructing",
    });
  } catch (error) {
    const retryable = error instanceof RepositoryEvidenceError && error.status >= 500;
    console.error("excavation worker failed", {
      operationId,
      kind: error instanceof RepositoryEvidenceError ? error.name : "unknown",
    });
    await reportProgress(admin, userId, operationId, {
      operationState: "failed",
      stage: retryable ? "GitHub paused the scan" : "Excavation needs attention",
      percent: 100,
      excavationState: "failed",
      errorCode: retryable ? "github_unavailable" : "evidence_recovery_failed",
      retryable,
    });
  }
}

function scheduleBackground(task: Promise<void>): void {
  const runtime = globalThis as typeof globalThis & {
    EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
  };
  runtime.EdgeRuntime.waitUntil(task);
}

async function startExcavation(
  admin: SupabaseClient,
  env: Env,
  userId: string,
  repositoryId: string,
): Promise<ExcavationSnapshot> {
  const repository = await repositoryContext(admin, userId, repositoryId);
  const appJwt = createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const installationToken = await mintInstallationToken(appJwt, repository.installation_id);
  const commitSha = await fetchHeadSha(
    installationToken,
    repository.owner,
    repository.name,
    repository.default_branch,
  );

  const { data, error } = await admin.rpc("excavation_start", {
    p_user_id: userId,
    p_repository_id: repositoryId,
    p_commit_sha: commitSha,
  });
  if (error) throw new HandledError("excavation_start_failed", error.message, 500);
  const snapshot = (data ?? [])[0] as ExcavationSnapshot | undefined;
  if (!snapshot) throw new HandledError("excavation_start_failed", "No operation was created", 500);

  if (snapshot.operation_state === "queued" || snapshot.operation_state === "running") {
    scheduleBackground(runExcavation(
      admin,
      env,
      userId,
      repository,
      snapshot.operation_id,
      snapshot.commit_sha,
      installationToken,
    ));
  }
  return snapshot;
}

export async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  try {
    const env = readEnv();
    const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const userId = await authenticate(req, admin);
    const action = String(body.action ?? "");

    if (action === "start") {
      const repositoryId = String(body.repositoryId ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(repositoryId)) {
        throw new HandledError("invalid_repository_id", "Choose a repository to excavate", 400);
      }
      return jsonResponse({ operation: await startExcavation(admin, env, userId, repositoryId) });
    }

    if (action === "mark-presentation-seen") {
      const excavationId = String(body.excavationId ?? "");
      const { data, error } = await admin.rpc("excavation_presentation_seen", {
        p_user_id: userId,
        p_excavation_id: excavationId,
      });
      if (error || data !== true) {
        throw new HandledError("excavation_not_found", "Excavation not found", 404);
      }
      return jsonResponse({ presentationSeen: true });
    }

    throw new HandledError("unknown_action", "Unknown excavation action", 400);
  } catch (error) {
    if (error instanceof HandledError) {
      console.error("excavation request failed", { code: error.code });
      const safeMessage = error.status >= 500
        ? "Revival could not start the excavation. Please try again."
        : error.message;
      return jsonResponse({ error: error.code, message: safeMessage }, error.status);
    }
    if (error instanceof RepositoryEvidenceError) {
      return jsonResponse({
        error: error.status === 403 ? "repository_access_revoked" : "github_unavailable",
        message: error.status === 403
          ? "GitHub access to this repository must be reconnected."
          : "GitHub is temporarily unavailable. Please try again.",
      }, error.status === 403 ? 403 : 502);
    }
    console.error("unexpected excavation error", error);
    return jsonResponse({
      error: "excavation_unavailable",
      message: "Revival could not start the excavation. Please try again.",
    }, 500);
  }
}

if (import.meta.main) Deno.serve(handleRequest);
