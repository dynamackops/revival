import { useState } from "react";

import {
  getSupabaseBrowserClient,
  hasSupabaseBrowserConfiguration,
} from "../../lib/supabase/client";

export function GitHubSignIn({ label = "Continue with GitHub" }: { label?: string }) {
  const configured = hasSupabaseBrowserConfiguration();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn() {
    setPending(true);
    setError(undefined);

    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (!authError) {
        return;
      }
    } catch {
      // The user-facing message below intentionally avoids leaking provider details.
    }

    setError("GitHub sign-in could not start. Please try again.");
    setPending(false);
  }

  return (
    <div className="auth-control">
      <button type="button" disabled={!configured || pending} onClick={signIn}>
        {pending ? "Opening GitHub…" : label}
      </button>
      {!configured ? (
        <p className="auth-note">GitHub connection is being prepared</p>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
