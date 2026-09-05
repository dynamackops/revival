import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyProfile } from "../onboarding/howIBuild";
import { LabDashboard } from "./LabDashboard";

const from = vi.fn();

vi.mock("../../lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from }),
}));

const createInstallUrl = vi.fn();
const completeInstallation = vi.fn();
const listAuthorizedRepositories = vi.fn();
const addRepository = vi.fn();

vi.mock("../repositories/githubAppClient", async () => {
  const actual = await vi.importActual<typeof import("../repositories/githubAppClient")>(
    "../repositories/githubAppClient",
  );
  return {
    ...actual,
    createInstallUrl: (...args: unknown[]) => createInstallUrl(...args),
    completeInstallation: (...args: unknown[]) => completeInstallation(...args),
    listAuthorizedRepositories: (...args: unknown[]) => listAuthorizedRepositories(...args),
    addRepository: (...args: unknown[]) => addRepository(...args),
  };
});

const session = { user: { id: "11111111-1111-4111-8111-111111111111" } } as unknown as Session;

function emptyRepositoriesQuery() {
  return {
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  };
}

function renderDashboard(overrides: Partial<Parameters<typeof LabDashboard>[0]> = {}) {
  return render(
    <LabDashboard
      profile={{ ...createEmptyProfile(), displayName: "Jasmine", completedAt: "2026-09-04T00:00:00.000Z" }}
      session={session}
      syncState="synced"
      settingsOpen={false}
      onOpenSettings={() => {}}
      onCloseSettings={() => {}}
      onEditProfile={() => {}}
      {...overrides}
    />,
  );
}

describe("LabDashboard GitHub repository access", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockImplementation(() => emptyRepositoriesQuery());
    createInstallUrl.mockReset();
    completeInstallation.mockReset();
    listAuthorizedRepositories.mockReset();
    addRepository.mockReset();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Choose Repository Access for a signed-in user with no artifacts", async () => {
    renderDashboard();
    expect(await screen.findByRole("button", { name: "Choose Repository Access" })).toBeInTheDocument();
  });

  it("requests an installation URL from GitHub when no installation exists yet", async () => {
    listAuthorizedRepositories.mockResolvedValue({ repositories: [], hasInstallation: false });
    createInstallUrl.mockResolvedValue({
      installUrl: "https://github.com/apps/revival/installations/new",
      state: "abc",
    });

    renderDashboard();
    const button = await screen.findByRole("button", { name: "Choose Repository Access" });
    fireEvent.click(button);

    await waitFor(() => expect(listAuthorizedRepositories).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(createInstallUrl).toHaveBeenCalledTimes(1));
  });

  it("shows an installation-canceled banner when the callback has no state", async () => {
    window.history.replaceState({}, "", "/github/callback");
    renderDashboard();
    expect(await screen.findByText(/Installation was canceled/)).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("completes installation and opens the picker on a successful callback", async () => {
    window.history.replaceState(
      {},
      "",
      "/github/callback?installation_id=555&setup_action=install&state=signed-state",
    );
    completeInstallation.mockResolvedValue({ status: "installed", accountLogin: "jasmine" });
    listAuthorizedRepositories.mockResolvedValue({ repositories: [], hasInstallation: true });

    renderDashboard();

    await waitFor(() =>
      expect(completeInstallation).toHaveBeenCalledWith({
        installationId: 555,
        setupAction: "install",
        state: "signed-state",
      }),
    );
    expect(await screen.findByText(/GitHub App installed for jasmine/)).toBeInTheDocument();
    expect(await screen.findByRole("dialog", { name: "Add repositories to the dig site" })).toBeInTheDocument();
  });

  it("shows a pending-approval banner for an organization that requires owner approval", async () => {
    window.history.replaceState(
      {},
      "",
      "/github/callback?installation_id=555&setup_action=request&state=signed-state",
    );
    completeInstallation.mockResolvedValue({ status: "pending_approval" });

    renderDashboard();

    expect(await screen.findByText(/an organization owner must approve/i)).toBeInTheDocument();
  });
});
