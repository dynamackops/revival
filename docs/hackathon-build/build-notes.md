# Revival Build Notes

## 2026-09-02 — Ideation

- Jasmine rejected generic personal-assistant directions and asked for something unique, authentic, different, and genuinely helpful.
- Selected concept: **Revival: Bring this project back to life.**
- Core problem: Creators and AI-native builders accumulate promising repositories that become difficult to resume after time away because intent, decisions, current state, and stopping points are scattered across code and history.
- Initial agent workflow: analyze a GitHub repository, reconstruct intent, assess condition, identify the likely stopping point, offer Revive/Rescope/Archive, then make and test one user-approved momentum patch.
- Scope direction: coding repositories only for the hackathon; broader writing and filmmaking support is deferred.
- Product structure: multi-repository dashboard.
- Visual metaphor: digital archaeology lab.
- Active shaping moment: Jasmine chose the stronger “Revival” framing and explicitly set the tagline, visual metaphor, and dashboard structure.
- Onboarding deepening rounds: one essential-context pass using existing conversation context, one sharpening round, and one optional visual-identity round.

## 2026-09-02 — Scope

- Confirmed target users: creative developers, programmers, system builders, technical architects, and frequent hackathon participants with paused side projects.
- Emotional principle: no shame or streak-loss language. Every session opens with **Welcome back.**
- Central product moment: Revival describes the project's intent and stopping point accurately enough that the creator feels understood.
- Visual system: a retro digital archaeology lab. The Excavate action moves into an old-terminal sequence that scans a bone-like artifact while project evidence is decoded.
- Evidence is labeled **Recovered Fact**, **Strong Inference**, or **Unknown**.
- Dashboard cards show repository name, last commit, and time dormant. Repositories are added manually after GitHub OAuth.
- Creator Memory begins with a short How I Build profile, remains visible and editable in Settings, and learns gradually from user corrections and decisions.
- Revive creates a proposed momentum patch, edits and tests it in a sandbox after approval, shows the diff and results, then creates a branch and pull request only after a second approval.
- Rescope generates a smaller project plan and README rewrite, with an optional approved pull request.
- Archive generates a non-destructive Project Time Capsule.
- Initial language scope: JavaScript and TypeScript, prioritizing React, Vite, and Node repositories.
- Reward: positive completion language and one lightweight First Revival badge. A full badge system is deferred.
- Build-time ruler: one-week core sprint with the remaining period through October 30 for testing, evaluation, polish, and submission work.
- Explicit cuts: non-code projects, multiple simultaneous excavations, automatic merges, full-project rewrites, GitLab/Bitbucket, complex teams, a full minigame, and an extensive badge system.
- Scope deepening rounds: 1.

## 2026-09-02 — Product Requirements

- Onboarding order changed through active shaping: How I Build occurs before GitHub connection so Revival understands the creator before seeing their repositories.
- Users may connect GitHub immediately or later. The empty dig site displays **Connect to GitHub to revive your first project.**
- Repository selection is searchable and manual. Each added project becomes a bone-like Unexamined Artifact.
- Excavation is a focused old-terminal scan that names the creator and repository and exposes real analysis stages. The full sequence is shown on first use; returning users can skip the presentation.
- Excavations continue if the app closes and are ready or resumable when the user returns.
- Results use tabs containing vertically scrollable cards rather than fixed-length summaries.
- Every finding is editable by text or dictation. Relevant corrections may be offered as Creator Memory updates, but only with permission.
- Low-confidence analysis produces a Preliminary Reconstruction, asks 2–3 targeted questions, then revises findings before generating paths.
- Revival presents one strongest path and rotates through exactly three persistent alternatives.
- Work approval shows the change, rationale, likely files, success definition, and checks before edits begin.
- Missing tests are reported honestly alongside the checks that could run.
- Rescope produces an editable plan and README before optional pull-request approval.
- Archive stores a permanent in-app Time Capsule and Markdown download; repository commit is deferred.
- If pull-request creation fails, **Download Patch** is the primary action and **Try Again** is a secondary text action.
- Dashboard statuses: Unexamined Artifact, Revival in Progress, Rescoped, Preserved, and Revived.
- The profile contains a small museum collection. First Revival is the only earnable v1 badge.
- Demo emphasis: original-purpose recovery and personally tailored recommendation are the emotional wow; tested work and pull-request creation are the technical proof.
- PRD deepening rounds: 1.

## 2026-09-02 — Technical Specification

- Confirmed a split TypeScript and Python architecture: React/Vite/Tailwind on Netlify, Supabase for product state, and FastAPI plus Serverless Jobs on Nebius for orchestration.
- Separated GitHub social sign-in from a least-privilege GitHub App so identity and repository authorization remain understandable and independently revocable.
- Chose NVIDIA Nemotron through Nebius Token Factory for evidence-grounded reconstruction and path reasoning, with environment-based model aliases so exact catalog models can be verified before deployment.
- Defined ephemeral Token Factory Sandboxes as the only place repository code is cloned, edited, and tested. Full repository contents are not stored in Supabase.
- Kept public and private repository support without an arbitrary size cutoff. Large repositories use adaptive evidence collection, hierarchical summarization, coverage reporting, and preliminary results when analysis is incomplete.
- Required two approval gates: one before sandbox edits and another before creating a branch and draft pull request. Revival never merges.
- Confirmed Creator Memory provenance, editable findings, evidence drawers, honest failure states, persisted asynchronous operations, and a last-completed-excavation demo fallback.
- Supabase guidance materially shaped the use of RLS on every exposed table, a private schema for server-only records, signed Storage URLs, indexed ownership fields, and strict separation of service credentials from the browser.
- Technical deepening rounds: 1.

## 2026-09-02 — Build Checklist Draft

- Jasmine chose to hand off checklist design while keeping visual review pauses during implementation.
- Build mode is autonomous with automated verification at every item and visual reviews after the lab shell, personalized reconstruction, and full patch-to-pull-request flow.
- Git commits serve as revert points after every completed checklist item; the three major visual checkpoints also receive named tags.
- The sequence retires the riskiest live integrations before visual polish, then protects the accurate-reconstruction wow moment before expanding secondary features.
- The Devpost handoff remains the final checklist item.
- Existing project decisions already answered the required submission wow-moment question, so it was not asked again.
- Checklist deepening rounds: 0 on the hand-off path; draft awaits Jasmine's required gut check.

## 2026-09-02 — Build Checklist Locked

- Jasmine approved the 12-item checklist without changes and said, **im ready to builddd**.
- Build preferences are now locked: autonomous implementation, verification on every item, commits as revert points, and visual review pauses after items 4, 8, and 10.
- Next action: execute the checklist through the guided build workflow.

## 2026-09-02 — Build Item 1 Started

- Created the Revival monorepo foundation: React/Vite/TypeScript web shell, FastAPI control API, worker package, shared contracts, prompt and evaluation packages, Supabase migration area, CI workflow, environment template, secret scanner, README, and MIT license.
- Static verification passed: the secret scan, JSON manifest parsing, Python compilation, and archive integrity check.
- Dependency-backed verification is blocked in this Work environment because package-registry network requests are unavailable and the required npm and Python packages are not cached.
- Tried the normal installation path and an explicit offline-cache path; neither could supply the missing dependencies.
- Checklist item 1 remains unchecked because the agreed verification command has not passed.
- The code checkpoint is preserved as Revival-foundation.zip.

## 2026-09-03 — Build Item 1 Completed

- Connected the build to the public repository https://github.com/dynamackops/revival.
- The browser upload had placed source under Revival-foundation, so the project was normalized to the repository root on branch codex/foundation-verify.
- Opened draft pull request #1 as the safe foundation checkpoint.
- Restored hidden project files omitted by browser upload, including the environment template, gitignore, CI workflow, editor settings, and hackathon state.
- GitHub Actions exposed and verified three small hardening fixes: pnpm 11 build-script allowlisting, explicit enum value comparisons for mypy, and explicit Vitest function imports.
- CI run 33749834964 passed both jobs: dependency installation, secret scan, TypeScript checks, frontend test, production build, Ruff, mypy, and Python tests.
- Checklist item 1 is complete. The successful head commit is 0a9b1ca747ebe35a501691499872e2145a740fe1.

## 2026-09-03 — Build Item 2 Implementation Candidate

- Created the foundation migration with Supabase CLI 2.116.0 and implemented every public product table, private execution table, ownership index, status constraint, update trigger, and RLS policy in the technical specification.
- Added a private `revival-artifacts` Storage bucket with user-folder SELECT, INSERT, UPDATE, and DELETE policies.
- Added an official pgTAP-style two-user test covering RLS enablement, cross-user repository and Creator Memory isolation, protected finding edits, private-schema denial, anonymous denial, and private Storage configuration.
- Wired the browser to Supabase's GitHub OAuth provider using PKCE and a publishable-key-only client. Added both source and built-bundle guards against server-only credentials.
- Added FastAPI bearer authentication using Supabase's asymmetric JWKS endpoint, strict issuer and audience checks, allowed signing algorithms, and verified UUID subjects.
- GitHub Actions run 33751571389 passed the web, Python, database lint, and two-user Supabase jobs for commit ac1b4088d56d6aa57b4f8269b1631a4ac222dfd2.
- Live GitHub social-login verification remains pending because no Revival Supabase project has been selected or created. Existing connected projects were not reused because they belong to other applications.

## 2026-09-04 — How I Build And Lab Shell Candidate

- Added a working **Enter the Lab** action to the Revival startup terminal.
- Built a four-stage pre-auth How I Build interview covering project types, preferred tools, MVP size, planning, testing, product priorities, and repair/simplify/experiment instincts.
- Added typed answers, browser-native dictation when available, a reconstruction review, local persistence across refreshes, and stable memory IDs for idempotent account transfer.
- Connected completed onboarding data to the existing RLS-protected `profiles` and `creator_memories` tables after Supabase authentication; the browser retains the local copy if sync fails.
- Built the first retro digital-archaeology lab shell with **Welcome back**, an honest empty artifact bay, **Connect GitHub**, **Connect later**, and editable Creator Memory.
- Added a Netlify SPA redirect so the Supabase OAuth callback can return to the React application.
- Verified the live Revival Supabase project still has RLS enabled on all ten public tables. Supabase advisors reported no warning- or error-level security findings; informational private-schema and unused-index notices are expected for the empty pre-launch database.
- Local verification passed: secret scan, TypeScript type-check, five frontend tests, production build, and browser-bundle credential guard.
- Visual review remains pending, so checklist item 4 is not marked complete yet.

## 2026-09-05 — Foundation Auth And Lab Visual Checkpoint Approved

- Jasmine confirmed that GitHub authentication works after correcting the GitHub OAuth callback configuration.
- This closes checklist item 2: the live Supabase GitHub sign-in now completes, complementing the already-passing two-user RLS, server credential, and browser bundle checks.
- Jasmine approved the How I Build and digital-archaeology lab visuals, typography, artifact language, and emotional tone.
- This closes checklist item 4 and establishes the **revival-lab-shell** visual checkpoint.
- Reconciled PR #1 with the newer Netlify configuration on `main`: retained the normalized root workspace, preserved Node 24 and Corepack bootstrapping, kept the SPA redirect, and limited Netlify's scan exception to the browser-safe Supabase publishable key.
- Checklist item 3 remains the next uncompleted implementation gate because the live Nebius Token Factory, Sandbox, Serverless adapter, and GitHub App repository spike has not yet been completed.

## 2026-09-05 — Repository Connection Built Independently Of Nebius

- Jasmine intentionally paused Nebius Token Factory / Sandbox setup because it requires adding a
  billing card, and chose to move forward with real GitHub repository connection first rather
  than block the dig-site dashboard on that decision. Checklist item 3 (the live Nemotron,
  Sandbox, and Serverless spike) remains explicitly unchecked; nothing here substitutes for it.
- Implemented the GitHub App installation and repository-selection flow as a standalone
  Supabase Edge Function (`supabase/functions/github-app`) with four actions:
  `create-install-url`, `complete-installation`, `list-authorized-repositories`, and
  `add-repository`. This runs independently of the Nebius control API so the dashboard's
  repository connection is real today rather than blocked on Nebius billing.
- Added a new migration (`supabase/migrations/20260905090000_github_app_repository_functions.sql`)
  with four narrowly scoped `SECURITY DEFINER` Postgres functions
  (`github_installation_upsert`, `github_installation_get`, `github_installation_verify`,
  `repository_add`) so the Edge Function can read and write `private.github_installations` and
  insert into `public.repositories` without exposing the private schema to the Data API and
  without granting `authenticated` any new table privileges. Execution is granted only to
  `service_role` and revoked from `public`, `anon`, and `authenticated`; every function pins an
  empty `search_path` and validates its own arguments.
- Replaced the disabled "Repository access is next" button in the lab with a working flow:
  Choose Repository Access requests a short-lived, user-bound, HMAC-signed state value from the
  Edge Function, opens GitHub's "Only select repositories" installation screen, and on return to
  `/github/callback` verifies the state and installation before opening a searchable repository
  picker. Added repositories render as bone-like Unexamined Artifact cards with a real last
  commit date, human-readable dormant duration, and a visible (currently disabled, honestly
  labeled) Excavate action, since excavation itself is not implemented yet.
- The installation access token and the GitHub App private key are never returned to the
  browser, logged, or stored; a fresh installation token is minted per request and discarded.
- Verified locally without Docker or a live Supabase project: applied all three migrations
  (including the new one) against a throwaway local Postgres 16 database with hand-built `auth`,
  `storage`, and role stubs, and manually exercised every new function — grants, idempotent
  upsert, ownership verification, duplicate-repository detection, and the installation-ownership
  rejection path — all matched the checked-in pgTAP test's expectations. `pnpm check` (secret
  scan, typecheck, lint, 33 Vitest cases including the new repository-connection suite, 12
  pytest cases, production build) and the browser-bundle credential guard all passed.
- Not yet run because this environment has neither a running Docker daemon nor the Deno
  runtime: `supabase test db` against the real Supabase local stack, `supabase db lint`, and
  `deno test` for the Edge Function's `state.ts`/`index.ts` unit tests. The SQL and Deno test
  files are checked in and were designed to be run as part of the existing CI `supabase` job and
  a new Edge Function CI step; they have not yet executed in a real CI run.
- Checklist item 5 (Add intentional GitHub access and the artifact dashboard) is **not** marked
  complete: its verify step requires exercising install, cancel, selected-repository,
  private-repository, duplicate-add, revoke, and reconnect flows against a real GitHub test
  organization and a deployed Supabase project, none of which has happened yet. See
  `docs/github-app-setup.md` for the exact GitHub App configuration and the secrets Jasmine
  needs to provide (by file path, never pasted into chat) before that live verification can run.
