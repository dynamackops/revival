import { useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { GitHubSignIn } from "../auth/GitHubSignIn";
import { humanize, type HowIBuildProfile } from "../onboarding/howIBuild";

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

      <section className="dig-site" aria-labelledby="dig-site-title">
        <div className="site-grid" aria-hidden="true" />
        <div className="archaeology-markers" aria-hidden="true">
          <span>01</span><span>02</span><span>03</span>
        </div>
        <div className="lab-computer">
          <div className="computer-screen">
            <p>REVIVAL TERMINAL · AWAITING ARTIFACT</p>
            <h2 id="dig-site-title">
              {session ? "Choose repository access to begin." : "Connect to GitHub to revive your first project."}
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
              <button className="primary-button" type="button" disabled>Repository access is next</button>
            )}
          </div>
          <div className="computer-base" aria-hidden="true"><span /></div>
        </div>
        <div className="empty-plinth" aria-hidden="true">
          <div className="plinth-top" />
          <p>ARTIFACT BAY<br />EMPTY</p>
        </div>
      </section>

      <footer className="lab-footer">
        <span>0 artifacts catalogued</span>
        <span data-sync={syncState}>
          {syncState === "synced" ? "Creator Memory synced" : null}
          {syncState === "syncing" ? "Syncing Creator Memory…" : null}
          {syncState === "error" ? "Saved on this device · sync will retry" : null}
          {syncState === "device" ? "Creator Memory saved on this device" : null}
        </span>
      </footer>

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
