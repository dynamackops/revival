import { useEffect, useRef } from "react";

import type { CataloguedRepository } from "../repositories/types";
import { EXCAVATION_STAGES } from "./stages";
import type { ExcavationOperation } from "./types";

export function ExcavationScanner({
  creatorName,
  repository,
  operation,
  starting,
  error,
  onStart,
  onSkip,
  onPresentationSeen,
}: {
  creatorName: string;
  repository: CataloguedRepository;
  operation?: ExcavationOperation;
  starting: boolean;
  error?: string;
  onStart: () => void;
  onSkip: () => void;
  onPresentationSeen: () => void;
}) {
  const marked = useRef(false);
  useEffect(() => {
    if (!operation || operation.presentationSeen || marked.current) return;
    marked.current = true;
    onPresentationSeen();
  }, [onPresentationSeen, operation]);

  const progress = operation?.progressPercent ?? 0;
  const terminal = operation?.state === "completed" || operation?.state === "failed";

  return (
    <div className="scan-console" aria-live="polite">
      <p>REVIVAL TERMINAL · ARTIFACT {repository.githubRepositoryId}</p>
      <h2>{creatorName}, scanning {repository.owner}/{repository.name}.</h2>
      {!operation ? (
        <>
          <div className="bone-scanner" aria-hidden="true"><span /></div>
          <p className="screen-copy">The repository stays untouched. Revival will only recover evidence from the selected commit.</p>
          <button className="primary-button" type="button" disabled={starting} onClick={onStart}>
            {starting ? "Starting excavation…" : "Begin focused scan"}
          </button>
        </>
      ) : (
        <>
          <div className="bone-scanner" data-active={!terminal} aria-hidden="true"><span /></div>
          <div className="scan-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <ol className="scan-stages">
            {EXCAVATION_STAGES.map((stage) => (
              <li key={stage.label} data-state={
                operation.progressStage === stage.label
                  ? "active"
                  : progress >= stage.percent
                    ? "complete"
                    : "waiting"
              }>
                <i aria-hidden="true" /> {stage.label}
              </li>
            ))}
          </ol>
          <p className="scan-current">{operation.progressStage}</p>
          {operation.state === "completed" ? (
            <p className="scan-handoff">Evidence package recovered. Nemotron reconstruction will begin when the Nebius provider is connected.</p>
          ) : null}
          {operation.state === "failed" ? (
            <button className="primary-button" type="button" disabled={!operation.retryable || starting} onClick={onStart}>
              {starting ? "Trying again…" : operation.retryable ? "Try again" : "Excavation paused"}
            </button>
          ) : null}
        </>
      )}
      {error ? <p className="scan-error" role="alert">{error}</p> : null}
      {operation?.presentationSeen ? (
        <button className="connect-later scan-skip" type="button" onClick={onSkip}>
          {terminal ? "Return to dig site" : "Skip Scan"}
        </button>
      ) : null}
    </div>
  );
}
