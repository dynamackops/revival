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
