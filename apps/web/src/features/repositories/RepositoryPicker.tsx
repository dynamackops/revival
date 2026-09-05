import { useMemo, useState } from "react";

import type { AuthorizedRepository } from "./githubAppClient";
import { humanizeDormantDuration } from "./dormant";

export function RepositoryPicker({
  repositories,
  loading,
  error,
  hasInstallation,
  existingRepositoryIds,
  addingRepositoryId,
  addFeedback,
  onAdd,
  onRetry,
  onStartInstall,
  onClose,
}: {
  repositories: AuthorizedRepository[];
  loading: boolean;
  error?: string;
  hasInstallation: boolean;
  existingRepositoryIds: Set<number>;
  addingRepositoryId: number | null;
  addFeedback?: string;
  onAdd: (repository: AuthorizedRepository) => void;
  onRetry: () => void;
  onStartInstall: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return repositories;
    return repositories.filter((repository) => repository.fullName.toLowerCase().includes(normalized));
  }, [repositories, query]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="repository-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repository-picker-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Selected repository access</p>
            <h2 id="repository-picker-title">Add repositories to the dig site</h2>
          </div>
          <button className="close-button" type="button" aria-label="Close repository picker" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="picker-copy">
          Only repositories you deliberately select here are added. Nothing is catalogued
          automatically, and you can return anytime to add more.
        </p>

        <input
          type="search"
          placeholder="Search your authorized repositories"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search authorized repositories"
          disabled={loading || Boolean(error) || !hasInstallation}
        />

        {addFeedback ? (
          <p className="picker-feedback" role="status">
            {addFeedback}
          </p>
        ) : null}

        {loading ? (
          <p className="picker-state" role="status">
            Reading authorized repositories from GitHub…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="picker-state" role="alert">
            <p>{error}</p>
            <button type="button" className="text-button" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error && !hasInstallation ? (
          <div className="picker-state">
            <p>
              No GitHub App installation was found for your account yet. Choose Repository Access
              to select which repositories Revival can see.
            </p>
            <button type="button" className="primary-button" onClick={onStartInstall}>
              Choose Repository Access
            </button>
          </div>
        ) : null}

        {!loading && !error && hasInstallation && repositories.length === 0 ? (
          <div className="picker-state">
            <p>
              GitHub reports no repositories are currently authorized. This usually means the
              installation was revoked or uninstalled, or no repositories are selected for it.
              Choose Repository Access to reconnect, or reopen the GitHub installation settings to
              select at least one repository and return here.
            </p>
            <button type="button" className="primary-button" onClick={onStartInstall}>
              Choose Repository Access
            </button>
          </div>
        ) : null}

        {!loading && !error && hasInstallation && repositories.length > 0 && filtered.length === 0 ? (
          <p className="picker-state">No authorized repository matches &ldquo;{query}&rdquo;.</p>
        ) : null}

        {!loading && !error && filtered.length > 0 ? (
          <ul className="repository-list">
            {filtered.map((repository) => {
              const alreadyAdded = existingRepositoryIds.has(repository.githubRepositoryId);
              const isAdding = addingRepositoryId === repository.githubRepositoryId;
              return (
                <li key={repository.githubRepositoryId} className="repository-row">
                  <div>
                    <p className="repository-name">{repository.fullName}</p>
                    <p className="repository-meta">
                      {repository.private ? "Private" : "Public"} · default branch{" "}
                      {repository.defaultBranch} · {humanizeDormantDuration(repository.lastCommitAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    disabled={alreadyAdded || isAdding}
                    onClick={() => onAdd(repository)}
                  >
                    {alreadyAdded ? "Already catalogued" : isAdding ? "Adding…" : "Add to dig site"}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
