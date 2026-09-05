import { useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { GitHubSignIn } from "../auth/GitHubSignIn";
import { humanize, type HowIBuildProfile } from "../onboarding/howIBuild";
import { ArtifactCard } from "../repositories/ArtifactCard";
import { RepositoryPicker } from "../repositories/RepositoryPicker";
import { useGitHubAppConnection } from "../repositories/useGitHubAppConnection";

export function LabDashboard({ profile, session, syncState, settingsOpen, onOpenSettings, onCloseSettings, onEditProfile }: {
  profile: HowIBuildProfile;
  session: Session | null;
  syncState: "device" | "syncing" | "synced" | "error";
  settingsOpen: boolean;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onEditProfile: () => void;
}) {
  const name = profile.displayName.trim() || "Creator";
  const [connectionDeferred, setConnectionDeferred] = useState(false);
  const connection = useGitHubAppConnection(session);
  const hasArtifacts = connection.cataloguedRepositories.length > 0;
  const existingRepositoryIds = new Set(
    connection.cataloguedRepositories.map((repository) => repository.githubRepositoryId),
  );

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <a className="wordmark" href="/" aria-label="Revival home">
          <span className="wordmark-mark" aria-hidden="true">R</span>
          <span>REVIVAL <small>DIG SITE 01</small></span>
        </a>
        <nav aria-label="Lab navigation">
          <button type="button" onClick={onOpenSettings}>Creator Memory</button>
          <span className="connection-light" data-connected={Boolean(session)}>
            <i aria-hidden="true" /> {session ? "GitHub identity linked" : "Local profile"}
          </span>
        </nav>
      </header>

      <section className="welcome-block">
        <p className="eyebrow">
          Field log · {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
        </p>
        <h1>Welcome back, {name}.</h1>
        <p>Your dig site is quiet. Nothing has been lost.</p>
      </section>

      {connection.banner ? (
        <ConnectionBanner banner={connection.banner} onDismiss={connection.dismissBanner} />
      ) : null}

      <section className="dig-site" aria-labelledby="dig-site-title">
        <div className="site-grid" aria-hidden="true" />
        <div className="archaeology-markers" aria-hidden="true">
          <span>01</span><span>02</span><span>03</span>
        </div>
        <div className="lab-computer">
          <div className="computer-screen">
            <p>REVIVAL TERMINAL · {hasArtifacts ? "ARTIFACTS CATALOGUED" : "AWAITING ARTIFACT"}</p>
            <h2 id="dig-site-title">
              {session
                ? hasArtifacts
                  ? "Return anytime to add another repository."
                  : "Choose repository access to begin."
                : "Connect to GitHub to revive your first project."}
            </h2>
            <p className="screen-copy">
              Your repositories stay untouched until you approve an excavation and any proposed work.
            </p>
            {!session && !connectionDeferred ? (
              <div className="connection-actions">
                <GitHubSignIn label="Connect GitHub" />
                <button className="connect-later" type="button" onClick={() => setConnectionDeferred(true)}>
                  Connect later
                </button>
              </div>
            ) : !session ? (
              <div className="connection-actions deferred-message">
                <span>No problem. The lab will wait.</span>
                <GitHubSignIn label="Connect whenever you’re ready" />
              </div>
            ) : (
              <div className="connection-actions">
                <button
                  className="primary-button"
                  type="button"
                  disabled={connection.connecting}
                  onClick={() => {
                    if (hasArtifacts) connection.openPicker();
                    else void connection.chooseRepositoryAccess();
                  }}
                >
                  {connection.connecting
                    ? "Opening GitHub…"
                    : hasArtifacts
                      ? "Add repositories"
                      : "Choose Repository Access"}
                </button>
                {!hasArtifacts ? (
                  <button className="connect-later" type="button" onClick={connection.openPicker}>
                    Already installed the app? Add repositories
                  </button>
                ) : null}
              </div>
            )}
          </div>
          <div className="computer-base" aria-hidden="true"><span /></div>
        </div>

        {hasArtifacts ? (
          <div className="artifact-grid">
            {connection.cataloguedRepositories.map((repository) => (
              <ArtifactCard key={repository.id} repository={repository} />
            ))}
          </div>
        ) : (
          <div className="empty-plinth" aria-hidden="true">
            <div className="plinth-top" />
            <p>ARTIFACT BAY<br />EMPTY</p>
          </div>
        )}
      </section>

      {connection.cataloguedError ? (
        <p className="picker-state" role="alert">{connection.cataloguedError}</p>
      ) : null}

      <footer className="lab-footer">
        <span>
          {connection.cataloguedLoading
            ? "Reading dig site…"
            : `${connection.cataloguedRepositories.length} artifact${connection.cataloguedRepositories.length === 1 ? "" : "s"} catalogued`}
        </span>
        <span data-sync={syncState}>
          {syncState === "synced" ? "Creator Memory synced" : null}
          {syncState === "syncing" ? "Syncing Creator Memory…" : null}
          {syncState === "error" ? "Saved on this device · sync will retry" : null}
          {syncState === "device" ? "Creator Memory saved on this device" : null}
        </span>
      </footer>

      {connection.pickerOpen ? (
        <RepositoryPicker
          repositories={connection.authorizedRepositories}
          loading={connection.pickerLoading}
          error={connection.pickerError}
          hasInstallation={connection.hasInstallation}
          existingRepositoryIds={existingRepositoryIds}
          addingRepositoryId={connection.addingRepositoryId}
          addFeedback={connection.addFeedback}
          onAdd={(repository) => void connection.addRepository(repository)}
          onRetry={() => void connection.chooseRepositoryAccess()}
          onStartInstall={() => void connection.startInstall()}
          onClose={connection.closePicker}
        />
      ) : null}

      {settingsOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={onCloseSettings}>
          <section
            className="memory-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="memory-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div><p className="eyebrow">Profile archive</p><h2 id="memory-title">Creator Memory</h2></div>
              <button className="close-button" type="button" aria-label="Close Creator Memory" onClick={onCloseSettings}>×</button>
            </div>
            <p>Revival uses this to recommend a path that sounds like something you would actually build.</p>
            <dl className="memory-grid compact">
              <Memory label="Usually builds" value={profile.projectTypes} />
              <Memory label="Preferred tools" value={profile.frameworks} />
              <Memory label="First-version size" value={humanize(profile.mvpSize)} />
              <Memory label="Planning" value={humanize(profile.planningStyle)} />
              <Memory label="Testing" value={humanize(profile.testingStyle)} />
              <Memory label="Product priorities" value={profile.productPriorities} />
              <Memory label="When stuck" value={humanize(profile.buildInstinct)} />
            </dl>
            <button className="primary-button" type="button" onClick={onEditProfile}>Edit How I Build</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Memory({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function ConnectionBanner({
  banner,
  onDismiss,
}: {
  banner: NonNullable<ReturnType<typeof useGitHubAppConnection>["banner"]>;
  onDismiss: () => void;
}) {
  const content = (() => {
    switch (banner.kind) {
      case "completing":
        return { tone: "info" as const, message: "Confirming your GitHub App installation…" };
      case "installation_canceled":
        return {
          tone: "muted" as const,
          message: "Installation was canceled. No repository access was granted.",
        };
      case "pending_approval":
        return {
          tone: "info" as const,
          message: "An organization owner must approve this installation before repositories can be listed.",
        };
      case "installed":
        return {
          tone: "success" as const,
          message: banner.accountLogin
            ? `GitHub App installed for ${banner.accountLogin}. Choose which repositories to add.`
            : "GitHub App installed. Choose which repositories to add.",
        };
      case "error":
        return { tone: "error" as const, message: banner.message };
      default:
        return { tone: "muted" as const, message: "" };
    }
  })();

  return (
    <div className="connection-banner" data-tone={content.tone} role="status">
      <p>{content.message}</p>
      {banner.kind !== "completing" ? (
        <button type="button" className="close-button" aria-label="Dismiss" onClick={onDismiss}>
          ×
        </button>
      ) : null}
    </div>
  );
}
