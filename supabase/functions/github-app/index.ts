// Revival GitHub App installation and repository-selection Edge Function.
//
// This runs independently of the Nebius control API so repository
// connection works before that service is deployed. It never returns a
// GitHub installation access token, the GitHub App private key, or any
// Supabase service-role credential to the caller.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";
import {
  createAppJwt,
  fetchInstallation,
  fetchLatestDefaultBranchCommitDate,
  GitHubApiError,
  listInstallationRepositories,
  mintInstallationToken,
  toAuthorizedRepository,
} from "./github.ts";
import { signState, StateError, verifyState } from "./state.ts";

class HandledError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "HandledError";
    this.code = code;
    this.status = status;
  }
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_SLUG: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_APP_STATE_SECRET: string;
}

function readEnv(): Env {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GITHUB_APP_ID",
    "GITHUB_APP_SLUG",
    "GITHUB_APP_PRIVATE_KEY",
    "GITHUB_APP_STATE_SECRET",
  ] as const;

  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of required) {
    const value = Deno.env.get(name);
    if (!value) missing.push(name);
    else values[name] = value;
  }

  if (missing.length > 0) {
    throw new HandledError(
      "server_misconfigured",
      `Missing required configuration: ${missing.join(", ")}`,
      500,
    );
  }

  return values as unknown as Env;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticate(req: Request, admin: SupabaseClient): Promise<string> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new HandledError("unauthenticated", "A Supabase access token is required", 401);
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    throw new HandledError("unauthenticated", "The session is invalid or has expired", 401);
  }

  return data.user.id;
}

async function createInstallUrl(uid: string, env: Env) {
  const state = await signState(uid, env.GITHUB_APP_STATE_SECRET);
  const url = `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new?state=${encodeURIComponent(state)}`;
  return { installUrl: url, state };
}

async function completeInstallation(
  uid: string,
  body: Record<string, unknown>,
  env: Env,
  admin: SupabaseClient,
) {
  const installationId = Number(body.installationId ?? body.installation_id);
  const setupAction = String(body.setupAction ?? body.setup_action ?? "");
  const state = String(body.state ?? "");

  if (!Number.isInteger(installationId) || installationId <= 0) {
    throw new HandledError("invalid_installation_id", "A valid installation id is required", 400);
  }

  try {
    await verifyState(state, env.GITHUB_APP_STATE_SECRET, uid);
  } catch (error) {
    if (error instanceof StateError) {
      throw new HandledError("invalid_state", error.message, 400);
    }
    throw error;
  }

  if (setupAction === "request") {
    return {
      status: "pending_approval",
      message:
        "An organization owner must approve this installation before repositories can be listed.",
    };
  }

  const appJwt = createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);

  let installation: { account: { login: string } };
  try {
    installation = await fetchInstallation(appJwt, installationId);
  } catch (error) {
    if (error instanceof GitHubApiError && error.status !== 502) {
      throw new HandledError(
        "installation_not_found",
        "GitHub could not confirm this installation. It may have been revoked.",
        404,
      );
    }
    throw new HandledError("github_unavailable", "GitHub is temporarily unavailable", 502);
  }

  const { error: rpcError } = await admin.rpc("github_installation_upsert", {
    p_user_id: uid,
    p_installation_id: installationId,
    p_account_login: installation.account.login,
  });
  if (rpcError) {
    throw new HandledError("installation_save_failed", rpcError.message, 500);
  }

  return {
    status: "installed",
    installationId,
    accountLogin: installation.account.login,
  };
}

async function resolveInstallations(
  uid: string,
  admin: SupabaseClient,
): Promise<Array<{ installation_id: number; account_login: string }>> {
  const { data, error } = await admin.rpc("github_installation_get", { p_user_id: uid });
  if (error) {
    throw new HandledError("installation_lookup_failed", error.message, 500);
  }
  return data ?? [];
}

async function listAuthorizedRepositories(uid: string, env: Env, admin: SupabaseClient) {
  const installations = await resolveInstallations(uid, admin);
  if (installations.length === 0) {
    return { repositories: [], hasInstallation: false };
  }

  const appJwt = createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const repositories = [];

  for (const installation of installations) {
    let installationToken: string;
    try {
      installationToken = await mintInstallationToken(appJwt, installation.installation_id);
    } catch (error) {
      if (error instanceof GitHubApiError && error.status !== 502) {
        // This installation was revoked or suspended; skip it rather than
        // failing the whole listing so other installations still show up.
        continue;
      }
      throw new HandledError("github_unavailable", "GitHub is temporarily unavailable", 502);
    }

    const githubRepositories = await listInstallationRepositories(installationToken);
    for (const repository of githubRepositories) {
      const lastCommitAt = await fetchLatestDefaultBranchCommitDate(
        installationToken,
        repository.owner.login,
        repository.name,
        repository.default_branch,
      );
      repositories.push(
        toAuthorizedRepository(repository, installation.installation_id, lastCommitAt),
      );
    }
  }

  return { repositories, hasInstallation: true };
}

async function addRepository(
  uid: string,
  body: Record<string, unknown>,
  env: Env,
  admin: SupabaseClient,
) {
  const githubRepositoryId = Number(body.githubRepositoryId ?? body.github_repository_id);
  const installationId = Number(body.installationId ?? body.installation_id);

  if (!Number.isInteger(githubRepositoryId) || githubRepositoryId <= 0) {
    throw new HandledError("invalid_repository_id", "A valid repository id is required", 400);
  }
  if (!Number.isInteger(installationId) || installationId <= 0) {
    throw new HandledError("invalid_installation_id", "A valid installation id is required", 400);
  }

  const { data: owned, error: ownershipError } = await admin.rpc("github_installation_verify", {
    p_user_id: uid,
    p_installation_id: installationId,
  });
  if (ownershipError) {
    throw new HandledError("installation_lookup_failed", ownershipError.message, 500);
  }
  if (!owned) {
    throw new HandledError(
      "installation_forbidden",
      "This installation does not belong to the current user",
      403,
    );
  }

  const appJwt = createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);

  let installationToken: string;
  try {
    installationToken = await mintInstallationToken(appJwt, installationId);
  } catch (error) {
    if (error instanceof GitHubApiError && error.status !== 502) {
      throw new HandledError(
        "installation_revoked",
        "GitHub access for this installation has been revoked",
        409,
      );
    }
    throw new HandledError("github_unavailable", "GitHub is temporarily unavailable", 502);
  }

  const repositories = await listInstallationRepositories(installationToken);
  const repository = repositories.find((candidate) => candidate.id === githubRepositoryId);
  if (!repository) {
    throw new HandledError(
      "repository_not_authorized",
      "That repository is not currently accessible through this installation",
      403,
    );
  }

  const lastCommitAt = await fetchLatestDefaultBranchCommitDate(
    installationToken,
    repository.owner.login,
    repository.name,
    repository.default_branch,
  );

  const { data, error } = await admin.rpc("repository_add", {
    p_user_id: uid,
    p_installation_id: installationId,
    p_github_repository_id: repository.id,
    p_owner: repository.owner.login,
    p_name: repository.name,
    p_default_branch: repository.default_branch,
    p_visibility: repository.private ? "private" : "public",
    p_last_commit_at: lastCommitAt,
    p_dormant_since: lastCommitAt,
  });
  if (error) {
    throw new HandledError("repository_add_failed", error.message, 500);
  }

  const row = (data ?? [])[0];
  return {
    repository: row,
    alreadyCatalogued: Boolean(row?.already_catalogued),
  };
}

export async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let env: Env;
  try {
    env = readEnv();
  } catch (error) {
    if (error instanceof HandledError) {
      console.error("github-app misconfigured:", error.message);
      return jsonResponse({ error: error.code, message: "Repository connection is not configured yet." }, error.status);
    }
    throw error;
  }

  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  try {
    const uid = await authenticate(req, admin);
    const action = String(body.action ?? "");

    switch (action) {
      case "create-install-url":
        return jsonResponse(await createInstallUrl(uid, env));
      case "complete-installation":
        return jsonResponse(await completeInstallation(uid, body, env, admin));
      case "list-authorized-repositories":
        return jsonResponse(await listAuthorizedRepositories(uid, env, admin));
      case "add-repository":
        return jsonResponse(await addRepository(uid, body, env, admin));
      default:
        return jsonResponse({ error: "unknown_action" }, 400);
    }
  } catch (error) {
    if (error instanceof HandledError) {
      return jsonResponse({ error: error.code, message: error.message }, error.status);
    }
    // Never log request/response bodies here: they may carry installation
    // identifiers but must never carry a token or private key.
    console.error("github-app function error:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "internal_error" }, 500);
  }
}

Deno.serve(handleRequest);
