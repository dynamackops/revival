import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const invoke = vi.fn();

vi.mock("../../lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession },
    functions: { invoke },
  }),
}));

import { createInstallUrl, GitHubAppError, listAuthorizedRepositories } from "./githubAppClient";

describe("githubAppClient", () => {
  beforeEach(() => {
    getSession.mockReset();
    invoke.mockReset();
  });

  it("refuses to call the function without an active session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    await expect(createInstallUrl()).rejects.toMatchObject({
      code: "expired_session",
    });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("returns the parsed data on success", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    invoke.mockResolvedValue({ data: { installUrl: "https://github.com/apps/x", state: "abc" }, error: null });

    const result = await createInstallUrl();
    expect(result.installUrl).toBe("https://github.com/apps/x");
    expect(invoke).toHaveBeenCalledWith("github-app", { body: { action: "create-install-url" } });
  });

  it("surfaces the server's structured error code and message", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    invoke.mockResolvedValue({
      data: null,
      error: {
        message: "Edge Function returned a non-2xx status code",
        context: {
          status: 403,
          json: async () => ({ error: "installation_forbidden", message: "Not your installation" }),
        },
      },
    });

    const error = await listAuthorizedRepositories().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(GitHubAppError);
    expect((error as InstanceType<typeof GitHubAppError>).code).toBe("installation_forbidden");
    expect((error as InstanceType<typeof GitHubAppError>).message).toBe("Not your installation");
    expect((error as InstanceType<typeof GitHubAppError>).status).toBe(403);
  });

  it("falls back to a generic error when the response body is not JSON", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    invoke.mockResolvedValue({
      data: null,
      error: {
        message: "network error",
        context: {
          status: 502,
          json: async () => {
            throw new Error("not json");
          },
        },
      },
    });

    const error = await listAuthorizedRepositories().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(GitHubAppError);
    expect((error as InstanceType<typeof GitHubAppError>).code).toBe("github_app_unavailable");
  });
});
