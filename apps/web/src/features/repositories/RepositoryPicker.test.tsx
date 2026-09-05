import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RepositoryPicker } from "./RepositoryPicker";
import type { AuthorizedRepository } from "./githubAppClient";

const repositories: AuthorizedRepository[] = [
  {
    githubRepositoryId: 1,
    owner: "jasmine",
    name: "paused-app",
    fullName: "jasmine/paused-app",
    private: true,
    defaultBranch: "main",
    lastCommitAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    installationId: 999,
  },
  {
    githubRepositoryId: 2,
    owner: "jasmine",
    name: "another-repo",
    fullName: "jasmine/another-repo",
    private: false,
    defaultBranch: "main",
    lastCommitAt: null,
    installationId: 999,
  },
];

function baseProps() {
  return {
    repositories,
    loading: false,
    error: undefined as string | undefined,
    hasInstallation: true,
    existingRepositoryIds: new Set<number>(),
    addingRepositoryId: null,
    addFeedback: undefined as string | undefined,
    onAdd: vi.fn(),
    onRetry: vi.fn(),
    onStartInstall: vi.fn(),
    onClose: vi.fn(),
  };
}

describe("RepositoryPicker", () => {
  it("shows a loading state while reading GitHub", () => {
    render(<RepositoryPicker {...baseProps()} loading />);
    expect(screen.getByText(/Reading authorized repositories/)).toBeInTheDocument();
  });

  it("shows an error state with a retry action", () => {
    const props = baseProps();
    render(<RepositoryPicker {...props} error="GitHub is temporarily unavailable." />);
    expect(screen.getByText("GitHub is temporarily unavailable.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("prompts installation when no installation exists yet", () => {
    const props = baseProps();
    render(<RepositoryPicker {...props} hasInstallation={false} repositories={[]} />);
    expect(screen.getByText(/No GitHub App installation was found/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose Repository Access" }));
    expect(props.onStartInstall).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when the installation has no authorized repositories", () => {
    render(<RepositoryPicker {...baseProps()} repositories={[]} />);
    expect(screen.getByText(/GitHub reports no repositories are authorized/)).toBeInTheDocument();
  });

  it("filters the list by search query", () => {
    render(<RepositoryPicker {...baseProps()} />);
    expect(screen.getByText("jasmine/paused-app")).toBeInTheDocument();
    expect(screen.getByText("jasmine/another-repo")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search authorized repositories"), {
      target: { value: "paused" },
    });

    expect(screen.getByText("jasmine/paused-app")).toBeInTheDocument();
    expect(screen.queryByText("jasmine/another-repo")).not.toBeInTheDocument();
  });

  it("shows a no-match message when the search has no results", () => {
    render(<RepositoryPicker {...baseProps()} />);
    fireEvent.change(screen.getByLabelText("Search authorized repositories"), {
      target: { value: "nothing-matches-this" },
    });
    expect(screen.getByText(/No authorized repository matches/)).toBeInTheDocument();
  });

  it("calls onAdd for a repository that has not been catalogued", () => {
    const props = baseProps();
    render(<RepositoryPicker {...props} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Add to dig site" })[0]);
    expect(props.onAdd).toHaveBeenCalledWith(repositories[0]);
  });

  it("disables and labels a repository that is already catalogued", () => {
    render(<RepositoryPicker {...baseProps()} existingRepositoryIds={new Set([1])} />);
    const button = screen.getByRole("button", { name: "Already catalogued" });
    expect(button).toBeDisabled();
  });

  it("shows add feedback such as a duplicate notice", () => {
    render(<RepositoryPicker {...baseProps()} addFeedback="jasmine/paused-app is already catalogued." />);
    expect(screen.getByText("jasmine/paused-app is already catalogued.")).toBeInTheDocument();
  });

  it("closes when the backdrop is clicked and not when the panel is clicked", () => {
    const props = baseProps();
    render(<RepositoryPicker {...props} />);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(props.onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
