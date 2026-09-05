import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export type AuthorizedRepository = {
  githubRepositoryId: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  lastCommitAt: string | null;
  installationId: number;
};

export class GitHubAppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "GitHubAppError";
    this.code = code;
    this.status = status;
  }
}

async function invoke<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const client = getSupabaseBrowserClient();
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    throw new GitHubAppError(
      "expired_session",
      "Your session has expired. Sign in again to continue.",
      401,
    );
  }

  const { data, error } = await client.functions.invoke("github-app", {
    body: { action, ...payload },
  });

  if (error) {
    let code = "github_app_unavailable";
    let message = "Revival could not reach GitHub App services. Please try again.";
    const context = (error as { context?: Response }).context;

    if (context && typeof context.json === "function") {
      try {
        const parsed = (await context.json()) as { error?: string; message?: string };
        if (parsed.error) code = parsed.error;
        if (parsed.message) message = parsed.message;
      } catch {
        // The error response was not JSON; keep the generic message above.
      }
    }

    throw new GitHubAppError(code, message, context?.status ?? 502);
  }

  return data as T;
}

export function createInstallUrl() {
  return invoke<{ installUrl: string; state: string }>("create-install-url");
}

export function completeInstallation(params: {
  installationId: number;
  setupAction: string;
  state: string;
}) {
  return invoke<{
    status: "installed" | "pending_approval";
    installationId?: number;
    accountLogin?: string;
    message?: string;
  }>("complete-installation", params);
}

export function listAuthorizedRepositories() {
  return invoke<{ repositories: AuthorizedRepository[]; hasInstallation: boolean }>(
    "list-authorized-repositories",
  );
}

export function addRepository(params: { githubRepositoryId: number; installationId: number }) {
  return invoke<{
    repository: {
      id: string;
      owner: string;
      name: string;
      default_branch: string;
      visibility: string;
      status: string;
      last_commit_at: string | null;
      dormant_since: string | null;
      already_catalogued: boolean;
    };
    alreadyCatalogued: boolean;
  }>("add-repository", params);
}
