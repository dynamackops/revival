import { humanizeDormantDuration } from "./dormant";
import type { CataloguedRepository } from "./types";

const STATUS_LABEL: Record<CataloguedRepository["status"], string> = {
  unexamined_artifact: "Unexamined Artifact",
  revival_in_progress: "Revival in Progress",
  rescoped: "Rescoped",
  preserved: "Preserved",
  revived: "Revived",
};

export function ArtifactCard({ repository }: { repository: CataloguedRepository }) {
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
        <p className="artifact-status">{STATUS_LABEL[repository.status]}</p>
        {repository.status === "unexamined_artifact" ? (
          <div>
            <button className="primary-button" type="button" disabled>
              Excavate
            </button>
            <p className="artifact-note">
              Excavation is the next stage of Revival. Repository connection and cataloguing are
              real; the reconstruction agent is not wired up yet.
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
