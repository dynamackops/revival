# Revival Build Checklist

Status: Locked for autonomous implementation with visual review pauses.

## Build Preferences

- **Build mode:** Autonomous
- **Comprehension checks:** N/A
- **Git:** Commit after every completed checklist item; tag the three major visual-review checkpoints as revival-lab-shell, revival-understands, and revival-end-to-end
- **Verification:** Yes — automated checks at every item plus visual review pauses after items 4, 8, and 10
- **Check-in cadence:** Balanced — Codex handles implementation details and pauses when Jasmine's product or visual judgment materially affects the result
- **Planning ownership:** Codex sequences and manages the build
- **Protected wow moment:** Accurate original-purpose recovery and a personally tailored recommendation, followed by a real tested patch and draft pull request

## Checklist

- [x] **1. Scaffold the Revival workspace and shared contracts**
  Spec ref: `spec.md > 4. Repository Layout`
  What to build: In one focused setup slice, create the pnpm TypeScript workspace, React/Vite web app, FastAPI service and worker packages, shared status enums, Pydantic response schemas, environment examples, MIT license, and CI shells. Keep model IDs and provider URLs environment-driven.
  Acceptance: The repository visibly separates the browser, control API, workers, contracts, prompts, evaluations, Supabase migrations, and documentation; no secret or provider credential is committed.
  Verify: Run `pnpm install && pnpm -r typecheck`, `uv run pytest`, and a secret-pattern scan; confirm CI can invoke both stacks.

- [ ] **2. Create the Supabase foundation and prove ownership isolation**
  Spec ref: `spec.md > 5. Data Model > 5.1 Public user-owned tables`
  What to build: Add migrations for profiles, Creator Memory, repositories, excavations, findings, paths, operations, Time Capsules, and badges; add the private server-only schema, private artifact bucket, indexes, status constraints, triggers, and RLS policies. Wire Supabase GitHub social login into the web shell and JWT verification into FastAPI.
  Acceptance: A user can authenticate, but cannot read or mutate another user's rows or Storage objects; service credentials remain server-only; every exposed table is protected by RLS.
  Verify: Run migration linting and automated two-user RLS tests, then inspect the browser bundle and network calls to confirm it contains only the publishable key.

- [ ] **3. Retire the highest-risk integrations with a live vertical spike**
  Spec ref: `spec.md > 16. Risks and Open Verification Items`
  What to build: Make the smallest real provider path that calls an eligible NVIDIA Nemotron model through Token Factory, starts a disposable Token Factory Sandbox, performs a harmless file edit and check, exercises a Serverless Job or local adapter with the same contract, and lists one GitHub App-authorized test repository. Record exact model aliases, observed limits, latency, and required permissions.
  Acceptance: The implementation uses at least one eligible NVIDIA open-source model on Nebius; sandbox code execution is real rather than mocked; public and private repository access can be authorized without granting access to every repository.
  Verify: Save redacted command output and provider IDs under `docs/architecture/integration-spike.md`; rerun the spike from a clean environment and confirm it returns a validated model response, sandbox diff, and authorized repository metadata.

- [ ] **4. Build How I Build and the first digital-archaeology lab shell**
  Spec ref: `spec.md > 7. Main Data Flows > 7.1 Onboarding before authentication`
  What to build: Create the pre-auth How I Build flow with typed and browser-dictated answers, review/edit screen, local-to-account transfer, Welcome back return state, retro lab dashboard, Settings entry, and Connect GitHub or Connect Later choice. The disconnected lab must show the computer prompt without fake repositories.
  Acceptance: How I Build occurs before GitHub; its questions cover frameworks, project types, MVP size, planning, testing, product priorities, and repair/simplify/experiment preferences; choosing Connect Later preserves the profile and allows Settings access.
  Verify: Run component and end-to-end tests for onboarding, refresh, sign-in transfer, editing, and Connect Later; pause for Jasmine's first visual review of the lab, typography, artifact language, and emotional tone before continuing.

- [ ] **5. Add intentional GitHub access and the artifact dashboard**
  Spec ref: `spec.md > 6. Core API Contracts > 6.1 GitHub and repository endpoints`
  What to build: Register the GitHub App flow separately from social sign-in, explain read versus approved write access, provide searchable selected-repository access, and add manual repository curation. Render each selected repository as a bone-like card with name, latest commit, dormant duration, visibility, lifecycle status, and Excavate action.
  Acceptance: No repository is added automatically or twice; both public and private selected repositories work; cards support several projects and show Unexamined Artifact, Revival in Progress, Rescoped, Preserved, or Revived; revoked access preserves prior reports.
  Verify: Exercise install, cancel, selected-repository, private-repository, duplicate-add, revoke, and reconnect flows against a GitHub test organization; run UI tests for search and dashboard state.

- [ ] **6. Implement durable excavation operations and the focused scan**
  Spec ref: `spec.md > 7. Main Data Flows > 7.2 Repository to reconstruction`
  What to build: Add idempotent excavation creation, operation persistence, background job dispatch, Supabase Realtime updates, resumable status, and the old-terminal bone scanner. Map real stages to Recovering documentation, Examining project structure, Tracing project history, and Reconstructing intent; enable Skip Scan only after the first presentation.
  Acceptance: The screen names Jasmine and the chosen repository; progress labels reflect actual work; duplicate clicks do not create duplicate excavations; closing and reopening restores active or completed status; Skip Scan hides presentation without canceling analysis.
  Verify: Run an end-to-end job with artificial stage delays, refresh and close the browser mid-run, then confirm one operation completes and the UI resumes accurately.

- [ ] **7. Build adaptive evidence collection and Nemotron reconstruction**
  Spec ref: `spec.md > 8. AI and Agent Design`
  What to build: Collect high-signal manifests, README content, source structure, configuration, tests, recent commits, issues when allowed, and TODO markers; ignore dependencies, generated output, binaries, and likely secrets. Add hierarchical summarization, coverage reporting, injection-resistant prompts, model routing, Pydantic validation, one malformed-output retry, and evidence references.
  Acceptance: A real repository report covers original vision, target user, working features, likely stopping point, decisions, unfinished work, and unknowns; every substantive statement is labeled Recovered Fact, Strong Inference, or Unknown; incomplete analysis is labeled Preliminary Reconstruction.
  Verify: Run the evaluation fixtures, including sparse and adversarial repositories; confirm schema validity, secret redaction, citation traceability, honest coverage, and correct preliminary behavior.

- [ ] **8. Deliver the editable reconstruction and three personalized paths**
  Spec ref: `spec.md > 6. Core API Contracts > 6.2 Excavation endpoints`
  What to build: Create tabbed scrollable findings, Why Revival Thinks This evidence drawers, Edit This by typing or dictation, targeted low-confidence questions, consent-based Creator Memory suggestions, and exactly three persistent path slots. Present one strongest recommendation first and explain which memory and evidence shaped it.
  Acceptance: Corrections update the current project without silently changing Creator Memory; two or three targeted questions precede paths when confidence is low; Show Me Another Path cycles through three stable alternatives; Revive, Rescope, and Archive remain available.
  Verify: Use Jasmine's real demo repository and written ground truth to review purpose accuracy, stopping-point usefulness, confidence labels, and personal fit; pause for the second visual review and do not proceed until the central “it understood my project” moment feels convincing.

- [ ] **9. Turn an approved Revive path into a safe downloadable patch**
  Spec ref: `spec.md > 7. Main Data Flows > 7.4 Approved patch to draft pull request`
  What to build: Generate a bounded work order with rationale, likely files, success definition, forbidden paths, and planned checks; record Approve Excavation Work before execution. In a clean sandbox at the recorded SHA, detect the package manager, edit within scope, run discovered build/lint/typecheck/test commands, store a unified patch and results, and issue a signed download.
  Acceptance: No file changes before approval; workflow-file edits are blocked; the complete diff and check states are visible; missing tests say No tests discovered and list other checks; a timeout or failed check preserves any valid reviewable patch.
  Verify: Run successful, no-test, install-failure, forbidden-path, and timeout fixtures; hash and reapply the downloaded patch to a clean clone and confirm the resulting diff matches the reviewed artifact.

- [ ] **10. Publish only after second approval and complete First Revival**
  Spec ref: `spec.md > 9. GitHub Permissions and Safety`
  What to build: Add the distinct pull-request review and approval, short-lived GitHub installation token, base-SHA freshness check, revival-prefixed branch, patch push, draft pull request, failure retry, repository status transition, completion message, and idempotent First Revival museum award.
  Acceptance: The user can approve, reject, or download before any GitHub write; Revival never merges; stale repository state blocks publishing; PR failure makes Download Patch primary and Try Again secondary; success says You brought a project back to life and awards First Revival exactly once.
  Verify: Rehearse a successful draft PR, repeated approval, stale SHA, revoked permission, and simulated PR failure in a test repository; pause for Jasmine's third visual review of the entire emotional and technical arc.

- [ ] **11. Finish the alternate fates, resilience, evaluation, and public deployment**
  Spec ref: `spec.md > 10. Failure and Recovery Rules`
  What to build: Implement Rescope with editable plan and README diff, Preserve with in-app and Markdown Time Capsule, Creator Memory settings, museum view, last-completed-real-excavation fallback, accessibility and responsive passes, evaluation reporting, Netlify deployment, Nebius service deployment, CORS, observability, and provider feedback notes. Add a Tavily freshness tool only if it improves a real outdated-dependency or documentation decision and can be demonstrated honestly.
  Acceptance: Rescope and Preserve never write without approval; users can edit or delete memory; the fallback is clearly timestamped and read-only; the hosted app completes the core path on desktop and mobile; evaluation measures evidence precision, confidence calibration, personalization, patch scope, and check honesty.
  Verify: Run unit, integration, accessibility, responsive, security, and fresh-user end-to-end suites against production; complete a timed three-minute rehearsal with the real demo repository and save the final evaluation report.

- [ ] **12. Prepare Devpost handoff**
  Spec ref: `prd.md > Submission Proof Points`
  What to build: Finalize the public repository, top-visible open-source license, setup-ready README, architecture and safety notes, screenshots, hosted demo URL, three-minute demo script and recording plan, Nebius and NVIDIA usage explanation, evaluation evidence, tool feedback, and any required statement about what was built during the submission period.
  Acceptance: The submission clearly proves the emotional wow moment and the technical sandbox-to-draft-PR flow; all required links are public; another developer can run the project; the materials explicitly identify the live NVIDIA Nemotron, Token Factory, Sandbox, and Serverless usage that actually shipped.
  Verify: Review every official submission requirement against the handoff folder, test all links in a signed-out browser, confirm the video is public and three minutes or shorter, and confirm the next command is `$prepare-submission`.
