import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CataloguedRepository } from "../repositories/types";
import { ExcavationScanner } from "./ExcavationScanner";
import type { ExcavationOperation } from "./types";

const repository: CataloguedRepository = {
  id: "11111111-1111-4111-8111-111111111111",
  githubRepositoryId: 42,
  owner: "jasmine",
  name: "revival-demo",
  defaultBranch: "main",
  visibility: "private",
  lastCommitAt: null,
  dormantSince: null,
  status: "revival_in_progress",
};

const operation: ExcavationOperation = {
  id: "22222222-2222-4222-8222-222222222222",
  excavationId: "33333333-3333-4333-8333-333333333333",
  repositoryId: repository.id,
  state: "running",
  progressStage: "Tracing project history",
  progressPercent: 70,
  errorCode: null,
  retryable: false,
  presentationSeen: false,
  updatedAt: "2026-09-05T00:00:00.000Z",
};

function scanner(overrides: Partial<Parameters<typeof ExcavationScanner>[0]> = {}) {
  const props = {
    creatorName: "Jasmine",
    repository,
    operation,
    starting: false,
    onStart: vi.fn(),
    onSkip: vi.fn(),
    onPresentationSeen: vi.fn(),
    ...overrides,
  };
  return { ...render(<ExcavationScanner {...props} />), props };
}

describe("ExcavationScanner", () => {
  it("names the creator and repository and reveals actual stage progress", () => {
    const { props } = scanner();
    expect(screen.getByRole("heading", { name: "Jasmine, scanning jasmine/revival-demo." })).toBeInTheDocument();
    expect(screen.getAllByText("Tracing project history")).toHaveLength(2);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "70");
    expect(props.onPresentationSeen).toHaveBeenCalledTimes(1);
  });

  it("does not offer Skip Scan until the first presentation was recorded", () => {
    const { rerender, props } = scanner();
    expect(screen.queryByRole("button", { name: "Skip Scan" })).not.toBeInTheDocument();
    rerender(<ExcavationScanner {...props} operation={{ ...operation, presentationSeen: true }} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip Scan" }));
    expect(props.onSkip).toHaveBeenCalledTimes(1);
  });

  it("finishes the evidence operation without pretending Nemotron ran", () => {
    scanner({
      operation: {
        ...operation,
        state: "completed",
        progressPercent: 100,
        progressStage: "Evidence recovered · Nemotron reconstruction is next",
        presentationSeen: true,
      },
    });
    expect(screen.getByText(/Nemotron reconstruction will begin/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return to dig site" })).toBeInTheDocument();
  });
});
