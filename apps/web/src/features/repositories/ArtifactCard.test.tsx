import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("offers a working Excavate action with an evidence-only explanation", () => {
    const onExcavate = vi.fn();
    render(<ArtifactCard repository={baseRepository} onExcavate={onExcavate} />);
    const button = screen.getByRole("button", { name: "Excavate" });
    expect(button).toBeEnabled();
    expect(screen.getByText(/Recover documentation, structure, and history/)).toBeInTheDocument();
    fireEvent.click(button);
    expect(onExcavate).toHaveBeenCalledTimes(1);
  });

  it("offers to resume a persisted operation", () => {
    render(
      <ArtifactCard
        repository={{ ...baseRepository, status: "revival_in_progress" }}
        operation={{
          id: "op-1",
          excavationId: "exc-1",
          repositoryId: baseRepository.id,
          state: "running",
          progressStage: "Tracing project history",
          progressPercent: 70,
          errorCode: null,
          retryable: false,
          presentationSeen: true,
          updatedAt: "2026-09-05T00:00:00.000Z",
        }}
        onExcavate={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Resume Scan" })).toBeInTheDocument();
    expect(screen.getByText("Tracing project history")).toBeInTheDocument();
  });

  it("does not offer Excavate for a repository past the unexamined stage", () => {
    render(<ArtifactCard repository={{ ...baseRepository, status: "revived" }} />);
    expect(screen.getByText("Revived")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excavate" })).not.toBeInTheDocument();
  });
});
