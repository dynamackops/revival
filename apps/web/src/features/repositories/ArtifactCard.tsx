import { humanizeDormantDuration } from "./dormant";
import type { CataloguedRepository } from "./types";
import type { ExcavationOperation } from "../excavation/types";

const STATUS_LABEL: Record<CataloguedRepository["status"], string> = {
  unexamined_artifact: "Unexamined Artifact",
  revival_in_progress: "Revival in Progress",
  rescoped: "Rescoped",
  preserved: "Preserved",
  revived: "Revived",
};

export function ArtifactCard({
  repository,
  operation,
  starting = false,
  onExcavate,
}: {
  repository: CataloguedRepository;
  operation?: ExcavationOperation;
  starting?: boolean;
  onExcavate?: () => void;
}) {
  const canOpenExcavation = repository.status === "unexamined_artifact"
    || repository.status === "revival_in_progress";
  const visibleStatus = operation && repository.status === "unexamined_artifact"
    ? "revival_in_progress"
    : repository.status;
  const actionLabel = (() => {
    if (starting) return "Opening scanner…";
    if (!operation) return "Excavate";
    if (operation.state === "completed") return "View Scan";
    if (operation.state === "failed" && operation.retryable) return "Try Again";
    return "Resume Scan";
  })();

  return (
    <article className="artifact-card" data-status={repository.status}>
      <div className="artifact-bone" aria-hidden="true" />
      <div className="artifact-body">
        <p className="artifact-visibility">
          {repository.visibility === "private" ? "Private" : "Public"} repository
        </p>
        <h3>
          {repository.owner}/{repository.name}
        </h3>
        <p className="artifact-meta">
          Last commit{" "}
          {repository.lastCommitAt
            ? new Date(repository.lastCommitAt).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "unknown"}
          {" · "}
          {humanizeDormantDuration(repository.lastCommitAt)}
        </p>
        <p className="artifact-status">{STATUS_LABEL[visibleStatus]}</p>
        {canOpenExcavation ? (
          <div>
            <button
              className="primary-button"
              type="button"
              disabled={starting || !onExcavate}
              onClick={onExcavate}
            >
              {actionLabel}
            </button>
            <p className="artifact-note">
              {operation
                ? operation.progressStage
                : "Recover documentation, structure, and history from the selected commit."}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
