# GitHub App Setup (for Jasmine)

This is the exact configuration Revival's repository-connection flow expects. It is written
so you can do it yourself in the GitHub UI and the Supabase dashboard — nothing here requires
pasting a private key into chat.

Revival already separates two things that must stay separate:

- **Continue with GitHub** (Supabase social login) identifies *you*. It already works.
- **Choose Repository Access** (this GitHub App) grants Revival permission to *specific
  repositories you pick*. It is independent of Nebius and independent of social login.

## 1. Confirm the GitHub App's configuration

You said you already created the GitHub App. Open it at
`https://github.com/settings/apps/<your-app-slug>` (or your organization's equivalent) and
confirm these settings match exactly:

| Field | Value |
|---|---|
| Homepage URL | `https://revivalcode.netlify.app` |
| Setup URL (redirect after install) | `https://revivalcode.netlify.app/github/callback` |
| Setup URL behavior | "Redirect to setup URL" enabled, and required (so `installation_id` reaches the app after install) |
| Webhook | **Disable** for this phase — Revival does not yet listen for webhooks, and an unused endpoint is one more thing that can fail or leak events |
| Where can this GitHub App be installed | **Only on this account** or **Any account**, your choice — either works with "Only select repositories" below |

### Repository permissions

Set exactly:

| Permission | Access |
|---|---|
| Metadata | Read-only |
| Contents | Read and write |
| Pull requests | Read and write |
| Issues | Read-only |

Leave every other repository permission, organization permission, and account permission
**No access**.

### OAuth / user authorization

Revival does not use the GitHub App's own OAuth user-to-server flow — identity already comes
from Supabase's separate GitHub social login. You can leave "Request user authorization (OAuth)
during installation" **unchecked**. If it is already checked from initial setup, that's fine
too; Revival simply never uses the resulting user access token.

### Installation choice

When you (or any future user) click "Choose Repository Access" in Revival and land on GitHub's
install screen, choose **Only select repositories** and pick the repositories you want to
connect. Never choose "All repositories" for a Revival connection — the product is built around
deliberate, one-at-a-time selection.

If anything above doesn't match, update it in the GitHub App settings and hit **Save changes**.
Changing permissions on an app that's already installed on repositories may require existing
installations to re-approve the new permission set the next time they're used — that's expected
and safe.

## 2. Gather four values (do not paste the private key into chat)

Revival's server-side Supabase Edge Function needs four secrets. Three are visible directly on
the GitHub App's settings page:

- `GITHUB_APP_ID` — the numeric "App ID" near the top of the settings page.
- `GITHUB_APP_SLUG` — the URL slug of your app, e.g. `revival-dev` from
  `https://github.com/apps/revival-dev`.
- `GITHUB_APP_PRIVATE_KEY` — you should already have generated a `.pem` file when you created
  the app (GitHub only lets you download it once, at generation time). **Do not paste its
  contents here.** Just tell me the local filesystem path to that `.pem` file (for example
  `~/Downloads/revival-dev.2026-09-05.private-key.pem`), and I will read the file directly and
  set it as a Supabase secret without ever printing it back to you or committing it anywhere.
  If you don't have the file anymore, generate a new private key from the GitHub App settings
  page ("Generate a private key") and give me the path to the new download.
- `GITHUB_APP_STATE_SECRET` — this one isn't from GitHub at all. It's a random secret Revival
  generates itself to sign the short-lived installation "state" value so it can't be forged or
  replayed. Run this once, locally, and give me the output (it is not sensitive to share once,
  but treat it like a password afterward — don't commit it):

  ```bash
  openssl rand -hex 32
  ```

## 3. What I need explicit confirmation for before I do it

I will not do any of the following without you saying "yes, go ahead" first:

1. **Deploying the `github-app` Supabase Edge Function** to your live Supabase project
   (`supabase functions deploy github-app`, or the equivalent MCP call). Deploying is safe to
   redo, but it does become live immediately.
2. **Setting the four secrets above as Supabase Edge Function secrets**
   (`supabase secrets set GITHUB_APP_ID=... GITHUB_APP_SLUG=... GITHUB_APP_PRIVATE_KEY=... GITHUB_APP_STATE_SECRET=...`),
   which includes uploading your private key's contents to Supabase's secret store (never to
   Git, never to chat).
3. **Any change to the GitHub App's live settings** (permissions, webhook, URLs) beyond what
   you've already configured per Section 1.

Once you confirm, I will:

- Read the `.pem` file from the path you give me (locally, never echoing its contents back).
- Run `supabase secrets set` for all four values against the Revival Supabase project.
- Deploy the `github-app` Edge Function.
- Apply the new database migration (`supabase/migrations/20260905090000_github_app_repository_functions.sql`)
  if it isn't already applied.

## 4. How the pieces fit together

```
Browser (Netlify)                Supabase Edge Function "github-app"        GitHub
------------------               -----------------------------------        ------
Choose Repository Access  --->   create-install-url (verifies Supabase
                                  session, signs a short-lived state)  --->  redirect to
                                                                             github.com/apps/<slug>/installations/new
                                                                             (user picks repos)
/github/callback           <---------------------------------------------  redirect with
  ?installation_id=...                                                     installation_id, setup_action, state
                           --->   complete-installation (verifies state,
                                  mints a GitHub App JWT, confirms the
                                  installation with GitHub, upserts
                                  private.github_installations)        --->  GET /app/installations/{id}

Repository picker opens
                           --->   list-authorized-repositories (mints a
                                  short-lived installation token, lists
                                  only the repos selected during install,
                                  fetches each one's latest default-branch
                                  commit date)                          --->  GET /installation/repositories
                                                                              GET /repos/{owner}/{repo}/commits/{branch}

User clicks "Add to dig site"
                           --->   add-repository (re-verifies the repo is
                                  still authorized through that
                                  installation, then calls a narrowly
                                  scoped SECURITY DEFINER Postgres
                                  function to insert into
                                  public.repositories)
```

The Edge Function never returns an installation access token, never returns the private key,
and never stores an installation access token anywhere — a fresh one is minted for each request
that needs to call GitHub and then discarded.

## 5. After secrets are set — how to verify it live

Once the secrets are set and the function is deployed, the acceptance path is:

1. Sign in with Continue with GitHub (already working).
2. Click **Choose Repository Access** in the lab.
3. On GitHub, choose **Only select repositories**, pick one test repository (public or
   private), and click **Install**.
4. GitHub redirects to `/github/callback`; Revival should show "GitHub App installed for
   `<your account>`" and open the repository picker automatically.
5. Search for the repository, click **Add to dig site**.
6. The repository should appear as a bone-like **Unexamined Artifact** card with its real last
   commit date and dormant duration.
7. Clicking **Add to dig site** again for the same repository (or reopening the picker and
   adding it again) should say "already catalogued" rather than creating a duplicate card.
8. In GitHub, revoke the installation (Settings → Applications → the app → Uninstall, or
   suspend it), then reopen the repository picker in Revival — it should explain that no
   repositories are currently authorized rather than silently showing stale data.

If any step doesn't behave as described, tell me what happened and I'll debug the Edge Function
logs (`supabase functions logs github-app`).
