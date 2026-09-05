import { useEffect, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { LabDashboard } from "./features/lab/LabDashboard";
import { HowIBuildFlow } from "./features/onboarding/HowIBuildFlow";
import {
  createEmptyProfile,
  loadHowIBuildProfile,
  saveHowIBuildProfile,
  syncHowIBuildProfile,
  type HowIBuildProfile,
} from "./features/onboarding/howIBuild";
import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfiguration,
} from "./lib/supabase/client";

type View = "landing" | "onboarding" | "review" | "lab" | "settings";

export function App() {
  const [profile, setProfile] = useState<HowIBuildProfile>(() =>
    loadHowIBuildProfile() ?? createEmptyProfile(),
  );
  const [view, setView] = useState<View>(profile.completedAt ? "lab" : "landing");
  const [session, setSession] = useState<Session | null>(null);
  const [syncState, setSyncState] = useState<"device" | "syncing" | "synced" | "error">(
    "device",
  );

  useEffect(() => {
    if (!hasSupabaseBrowserConfiguration()) {
      return;
    }

    const client = getSupabaseBrowserClient();
    let active = true;

    void client.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
      }
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession && window.location.pathname === "/auth/callback") {
        window.history.replaceState({}, "", "/");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user || !profile.completedAt) {
      return;
    }

    let active = true;
    setSyncState("syncing");
    void syncHowIBuildProfile(profile, session.user)
      .then(() => {
        if (active) setSyncState("synced");
      })
      .catch(() => {
        if (active) setSyncState("error");
      });

    return () => {
      active = false;
    };
  }, [profile, session]);

  function persistProfile(nextProfile: HowIBuildProfile) {
    saveHowIBuildProfile(nextProfile);
    setProfile(nextProfile);
    setSyncState(session ? "syncing" : "device");
  }

  if (view === "landing") {
    return (
      <main className="shell landing-shell">
        <section className="terminal landing-terminal" aria-labelledby="revival-title">
          <p className="eyebrow">Digital Archaeology Lab</p>
          <h1 id="revival-title">Revival</h1>
          <p className="tagline">Bring this project back to life.</p>
          <button
            className="primary-button enter-button"
            type="button"
            onClick={() => setView("onboarding")}
          >
            Enter the Lab <span aria-hidden="true">→</span>
          </button>
          <div className="status" role="status">
            <span aria-hidden="true" />
            Foundation systems online
          </div>
        </section>
      </main>
    );
  }

  if (view === "onboarding" || view === "review") {
    return (
      <HowIBuildFlow
        initialProfile={profile}
        initialReview={view === "review"}
        onSave={(nextProfile) => {
          persistProfile(nextProfile);
          setView("lab");
        }}
      />
    );
  }

  return (
    <LabDashboard
      profile={profile}
      session={session}
      syncState={syncState}
      settingsOpen={view === "settings"}
      onOpenSettings={() => setView("settings")}
      onCloseSettings={() => setView("lab")}
      onEditProfile={() => setView("review")}
    />
  );
}
