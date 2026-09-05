import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArtifactCard } from "./ArtifactCard";
import type { CataloguedRepository } from "./types";

const baseRepository: CataloguedRepository = {
  id: "11111111-1111-4111-8111-111111111111",
  githubRepositoryId: 42,
  owner: "jasmine",
  name: "revival-demo",
  defaultBranch: "main",
  visibility: "private",
  lastCommitAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
  dormantSince: null,
  status: "unexamined_artifact",
};

describe("ArtifactCard", () => {
  it("renders repository identity, visibility, dormant duration, and status", () => {
    render(<ArtifactCard repository={baseRepository} />);
    expect(screen.getByText("jasmine/revival-demo")).toBeInTheDocument();
    expect(screen.getByText("Private repository")).toBeInTheDocument();
    expect(screen.getByText("Unexamined Artifact")).toBeInTheDocument();
    expect(screen.getByText(/Dormant 1 month/)).toBeInTheDocument();
  });

  it("shows a visible but disabled Excavate action with an honest explanation", () => {
    render(<ArtifactCard repository={baseRepository} />);
    const button = screen.getByRole("button", { name: "Excavate" });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Excavation is the next stage/)).toBeInTheDocument();
  });

  it("does not offer Excavate for a repository past the unexamined stage", () => {
    render(<ArtifactCard repository={{ ...baseRepository, status: "revived" }} />);
    expect(screen.getByText("Revived")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excavate" })).not.toBeInTheDocument();
  });
});
