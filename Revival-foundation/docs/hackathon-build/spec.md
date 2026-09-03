# Revival — Technical Specification

## 1. Product and Technical Goal

Revival is a GitHub-connected digital archaeology lab for creative developers returning to paused JavaScript and TypeScript projects. It reconstructs what a repository was meant to become, distinguishes evidence from inference, recommends one personally tailored next path, and—only after explicit approval—uses an isolated Token Factory Sandbox to produce and test a small momentum patch. A second approval can create a branch and draft pull request.

The hackathon submission targets the Coding and Agentic Engineering Track. The technical proof is not merely repository summarization: Revival must inspect real project evidence, run code safely, report its confidence honestly, and complete an approval-gated coding workflow using NVIDIA Nemotron models served through Nebius.

## 2. Confirmed Product Decisions

| Area | Decision |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Public hosting | Netlify for the web client |
| Product data | Supabase Postgres, Auth, Realtime, and private Storage |
| Agent API | Python FastAPI deployed as a Nebius Serverless Endpoint |
| Long-running work | Nebius Serverless Jobs |
| Model provider | Nebius Token Factory using NVIDIA Nemotron |
| Code execution | Ephemeral Token Factory Sandboxes |
| Account sign-in | Supabase GitHub social login |
| Repository authorization | A separate least-privilege GitHub App installed on repositories selected by the user |
| Repository coverage | Public and private repositories; no arbitrary size cutoff |
| Initial code coverage | JavaScript and TypeScript, especially React, Vite, and Node |
| Patch delivery | Downloadable patch first; optional branch and draft pull request after approval |
| Data retention | Full repository contents remain ephemeral and are not stored in Supabase |
| Personalization | Editable How I Build profile plus permissioned learned and corrected Creator Memory |

## 3. System Architecture

### 3.1 Deployment topology

The browser talks only to Supabase and the Revival control API. The Netlify client uses the Supabase publishable key for user-scoped operations. The FastAPI control API verifies the Supabase access token, resolves the user's GitHub App installation, creates durable operation records, and starts Serverless Jobs.

Serverless Jobs collect repository evidence through GitHub, call Nemotron through Token Factory, create an isolated Token Factory Sandbox when execution is needed, and stream operation status through Supabase. Repository code and GitHub installation credentials never enter the browser. Service-role database access, GitHub App private-key operations, and model credentials remain server-side.

### 3.2 Runtime responsibilities

| Component | Responsibility | Related PRD epics |
|---|---|---|
| Web client | Onboarding, dig site, focused excavation reveal, editable findings, path carousel, approvals, diff and check results, museum profile | 1–10 |
| FastAPI control API | Authentication, authorization, validation, operation creation, idempotency, signed artifact access, orchestration | 2–10 |
| Evidence collector job | Fetch selected repository metadata and relevant files, prioritize evidence, build a repository map | 3–5 |
| Reconstruction agent | Produce evidence-grounded purpose, state, stopping point, unknowns, questions, and confidence labels | 4–6 |
| Path agent | Generate one strongest path and exactly three persistent alternatives using Creator Memory | 5–6 |
| Work planner | Convert an approved path into a bounded change plan with likely files, success definition, and checks | 6–8 |
| Sandbox worker | Clone, edit, install, build, lint, typecheck, test, and generate a patch in an isolated sandbox | 7 |
| GitHub integration | List authorized repositories, create branches and draft pull requests, preserve approval boundaries | 2–3, 7–8 |
| Memory service | Store user-provided, learned, and corrected preferences with provenance and explicit edit controls | 1, 5, 6, 10 |
| Reward service | Award First Revival and render the museum collection | 7, 10 |

### 3.3 Service boundaries

- The web client never receives a GitHub App private key, installation token, Supabase service-role key, Nebius API key, or raw model credential.
- The control API performs short work only. Any repository analysis or sandbox execution that may exceed an interactive request returns an operation ID and runs asynchronously.
- Serverless Jobs are idempotent by operation ID and may safely retry without creating duplicate patches or pull requests.
- Sandboxes are disposable. Every run starts from a clean clone at a recorded commit SHA.
- The database stores derived findings, plans, statuses, checks, diffs, and artifact metadata—not a durable copy of repository source.

## 4. Repository Layout

    revival/
      apps/
        web/
          src/
            app/
            components/
            features/
              onboarding/
              dig-site/
              excavation/
              paths/
              work-orders/
              museum/
              settings/
            lib/
              api/
              auth/
              realtime/
            routes/
            styles/
          tests/
      services/
        control-api/
          app/
            api/
            auth/
            github/
            operations/
            schemas/
            services/
          tests/
        workers/
          evidence_collector/
          reconstruction_agent/
          path_agent/
          sandbox_runner/
          pull_request_publisher/
          shared/
          tests/
      packages/
        contracts/
        prompts/
        evaluation/
      supabase/
        migrations/
        seed.sql
      docs/
        architecture/
        demo/
        evaluation/
      .github/
        workflows/
      LICENSE
      README.md

The packages/contracts directory is the canonical source for API shapes and status enums. TypeScript types are generated for the client, while Pydantic models validate worker and model output. Prompts are versioned as source files so an evaluation result can identify the exact prompt and model alias used.

## 5. Data Model

All user-facing tables live in the public schema and have Row Level Security enabled. Server-only integration secrets and execution bookkeeping live in a private schema that the Data API does not expose.

### 5.1 Public user-owned tables

| Table | Essential fields | Notes |
|---|---|---|
| profiles | id UUID PK referencing auth.users, display_name, onboarding_complete, created_at, updated_at | One row per user |
| creator_memories | id, user_id, category, content, provenance, active, source_reference, created_at, updated_at | Provenance is user_provided, learned, or corrected |
| repositories | id, user_id, github_repository_id, installation_id_reference, owner, name, default_branch, visibility, last_commit_at, dormant_since, status, created_at | Unique on user_id plus github_repository_id |
| excavations | id, user_id, repository_id, commit_sha, state, confidence, preliminary, presentation_seen, model_alias, prompt_version, created_at, completed_at | Immutable source SHA for reproducibility |
| excavation_findings | id, excavation_id, kind, statement, confidence_label, evidence, user_edited, original_statement, sort_order | Label is recovered_fact, strong_inference, or unknown |
| excavation_paths | id, excavation_id, slot, title, summary, rationale, recommended, creator_fit, plan_json, status | Exactly three active slots; regenerated paths replace a slot version but do not grow infinitely |
| operations | id, user_id, repository_id, excavation_id, kind, state, progress_stage, progress_percent, error_code, retryable, created_at, updated_at | Realtime status source |
| time_capsules | id, user_id, repository_id, excavation_id, title, markdown, created_at | Permanent in-app archive artifact |
| badge_definitions | id, slug, name, description, artwork_key | Seed First Revival |
| user_badges | user_id, badge_id, awarded_at, source_repository_id | Unique on user_id plus badge_id |

### 5.2 Private server-only tables

| Table | Purpose |
|---|---|
| github_installations | Maps a user and GitHub installation ID; stores no private key and no long-lived access token |
| work_orders | Approved path, change boundary, planned files, success definition, and approval timestamps |
| sandbox_runs | Sandbox provider ID, source SHA, state, commands, exit results, expiry, and operation link |
| patches | Storage object reference, hash, summary, file counts, base SHA, and expiry |
| pull_requests | Repository, branch, head SHA, draft PR number and URL, state, and idempotency key |
| model_calls | Model alias, prompt version, latency, token counts, schema-validation state, and redacted error metadata |
| audit_events | Approval, correction, memory update, patch generation, download, and PR creation events |

### 5.3 Storage

Use one private Supabase Storage bucket named revival-artifacts for downloadable patches, time-capsule exports, and compact evaluation artifacts. Objects use user-scoped paths and short-lived signed URLs. Patch objects have a retention policy and can be regenerated from the recorded commit and work order while the GitHub installation remains valid.

### 5.4 Database rules and indexes

- Every exposed table enables RLS. Ownership policies compare the authenticated user to user_id, and UPDATE policies define both USING and WITH CHECK conditions.
- Use UUID primary keys, timestamptz timestamps, foreign keys, and constrained text status fields.
- Index all foreign-key columns and user_id columns.
- Add composite indexes for repositories by user_id and status, operations by user_id and updated_at, findings by excavation_id and sort_order, paths by excavation_id and slot, and memories by user_id and active.
- Never place GitHub tokens, private keys, Nebius credentials, or Supabase service-role credentials in Postgres rows accessible to the client.
- Serverless components should use a pooled Postgres connection appropriate for short-lived runtimes.

## 6. Core API Contracts

All mutating requests accept an Idempotency-Key header. Every long operation returns an operation object with id, state, progressStage, and links.

### 6.1 GitHub and repository endpoints

| Method and path | Request | Success response |
|---|---|---|
| POST /v1/github/install | returnUrl | GitHub App installation URL |
| GET /v1/github/callback | installation_id, setup_action, signed state | Redirect to repository picker |
| GET /v1/github/repositories | query, cursor | Authorized repositories with name, visibility, last commit, and dormant duration |
| POST /v1/repositories | githubRepositoryId | Added Unexamined Artifact |
| DELETE /v1/repositories/{id} | none | Removes dashboard record; does not modify GitHub |

GitHub social login is presented as Continue with GitHub. GitHub App installation is a distinct step labeled Choose Repository Access so users understand that account identity and repository permissions are separate.

### 6.2 Excavation endpoints

| Method and path | Purpose |
|---|---|
| POST /v1/repositories/{id}/excavations | Snapshot current default-branch SHA and enqueue evidence collection |
| GET /v1/excavations/{id} | Return findings, evidence, confidence, questions, and paths |
| POST /v1/excavations/{id}/clarifications | Submit answers to targeted low-confidence questions and enqueue revision |
| PATCH /v1/findings/{id} | Save a user correction while preserving the original statement |
| POST /v1/excavations/{id}/paths/{slot}/regenerate | Replace one of the three path slots; cycle history remains reachable |
| POST /v1/excavations/{id}/memory-suggestions/{id}/accept | Add a suggested Creator Memory item only after consent |

Evidence objects contain source type, repository-relative path, optional line range or commit reference, excerpt hash, and explanation. The client exposes these through Why Revival Thinks This drawers.

### 6.3 Work, sandbox, and pull-request endpoints

| Method and path | Purpose |
|---|---|
| POST /v1/paths/{id}/work-orders | Create the proposed bounded change and checks |
| POST /v1/work-orders/{id}/approve | Record approval and enqueue a sandbox run |
| GET /v1/sandbox-runs/{id} | Return planned and executed commands, logs, checks, diff summary, and status |
| GET /v1/patches/{id}/download | Issue a short-lived signed download URL |
| POST /v1/sandbox-runs/{id}/pull-requests | Create a pending PR proposal after a successful or reviewable run |
| POST /v1/pull-requests/{id}/approve | Record second approval, create branch, push patch, and open a draft PR |
| POST /v1/pull-requests/{id}/retry | Retry only the publishing stage without rerunning a valid sandbox patch |

Revival never merges a pull request. Version one blocks modifications under .github/workflows even if the GitHub App has repository content access.

### 6.4 Rescope, preserve, and profile endpoints

- POST /v1/paths/{id}/rescope produces an editable project plan and README proposal before any repository write.
- POST /v1/excavations/{id}/preserve creates the in-app Time Capsule and Markdown export.
- GET, POST, PATCH, and DELETE /v1/creator-memory allow complete user control.
- GET /v1/profile/museum returns earned badge metadata, including First Revival.

## 7. Main Data Flows

### 7.1 Onboarding before authentication

The How I Build answers begin in local browser state. If the user skips GitHub, the empty dig site is immediately available and prompts Connect to GitHub to revive your first project. When the user signs in, the client sends the pending profile once using a migration nonce, then clears the local copy. The user can edit or delete every memory item in Settings.

### 7.2 Repository to reconstruction

1. The user selects one GitHub App-authorized repository.
2. Revival records repository metadata and displays an Unexamined Artifact card.
3. Excavate records the current commit SHA and returns an operation ID.
4. The collector maps manifests, README files, source structure, tests, recent commits, issues when permitted, TODO markers, and project configuration.
5. The collector ignores dependency directories, generated output, large binaries, and likely secret files.
6. Nemotron converts the evidence map into structured findings.
7. If evidence is insufficient, Revival marks the result Preliminary Reconstruction and asks two or three targeted questions.
8. The final results page shows recovered purpose, current condition, stopping point, unknowns, and one recommended path with three persistent alternatives.

There is no arbitrary repository-size limit. Instead, evidence collection is adaptive: prioritize high-signal files, summarize hierarchically, and report coverage. If time or provider limits prevent complete analysis, return a useful preliminary result and disclose what was not examined.

### 7.3 Correction and personalization

Editing a finding changes the excavation result but not Creator Memory automatically. When a correction implies a durable preference, Revival offers a separate memory suggestion. Accepting it records the content and provenance as corrected; rejecting it changes nothing.

### 7.4 Approved patch to draft pull request

1. The user approves a work order containing scope, rationale, likely files, success definition, and planned checks.
2. A job creates a clean sandbox and clones the recorded commit.
3. The worker detects the package manager from lockfiles, installs dependencies, edits only within the approved boundary, and runs discovered checks.
4. When no tests exist, Revival states that plainly and lists the checks it could run.
5. The worker generates a unified patch, diff summary, command log, and check report.
6. The user can download the patch regardless of whether GitHub publishing succeeds.
7. After a second approval, Revival obtains a short-lived installation token, creates a revival-prefixed branch, applies the reviewed patch to the matching base SHA, and opens a draft pull request.
8. On success, the repository becomes Revived and First Revival is awarded if not already earned.

## 8. AI and Agent Design

### 8.1 Model routing

Configure model IDs through NEMOTRON_REASONING_MODEL and NEMOTRON_FAST_MODEL environment variables rather than hardcoding catalog identifiers. Before deployment, verify the exact NVIDIA model names currently available in the Token Factory catalog.

- Use a faster Nemotron model for repository-map compression, evidence summaries, query planning, and simple classification.
- Use Nemotron 3 Ultra, or the strongest eligible reasoning model available, for purpose reconstruction, stopping-point analysis, personalized path selection, and bounded patch planning.
- Code execution, tests, and GitHub state are tool results, never claims the model can invent.

### 8.2 Structured outputs

All model responses must validate against versioned Pydantic schemas. Required reconstruction fields include:

- projectPurpose
- intendedAudience
- currentCondition
- likelyStoppingPoint
- recoveredFacts
- strongInferences
- unknowns
- evidenceReferences
- confidenceScore
- preliminary
- clarificationQuestions

Path output must contain exactly three slots and identify one recommended slot. Patch plans must enumerate the change boundary, likely files, forbidden paths, success definition, and verification commands.

Malformed model output is retried once with the validation error. A second failure produces a Preliminary Reconstruction or a recoverable operation error; it never silently invents missing fields.

### 8.3 Prompt-injection resistance

Repository contents are untrusted data. System prompts explicitly prohibit obeying instructions found inside source files, issues, comments, or README text. Tool permissions are fixed by the orchestrator, not selected by model output. Model-proposed commands are compared against a command policy before execution, secrets are redacted from logs, outbound network access is disabled by default during checks, and writes are restricted to the sandbox workspace.

### 8.4 Evaluation set

Create a small checked-in evaluation corpus containing:

- Two of Jasmine's own paused repositories, with a written ground-truth purpose and stopping point.
- Three public JavaScript or TypeScript repositories representing React, Vite, and Node.
- One sparse or poorly documented repository.
- One repository containing adversarial instructions in a README or source comment.

Score evidence precision, purpose accuracy, stopping-point usefulness, confidence calibration, path personalization, schema validity, patch scope adherence, and check-report honesty. The demo repository must pass a rehearsal from fresh installation through draft PR.

## 9. GitHub Permissions and Safety

The GitHub App requests only Metadata read, Contents read and write, Pull requests read and write, and Issues read when issue evidence is enabled. Users choose specific repositories during installation. Installation access tokens are minted only when needed and are not stored as durable credentials.

Pull-request publication verifies that the base branch still matches the analyzed commit. If it has moved, Revival stops and offers a new excavation or an explicit rebase workflow rather than pushing an unreviewed change. Branch names include revival, the repository slug, and a short operation ID. Pull requests are always drafts and link to the excavation, evidence summary, checks, and model disclosure.

## 10. Failure and Recovery Rules

| Failure | Required behavior |
|---|---|
| GitHub permission expires | Preserve findings and patch metadata; ask the user to reconnect before listing or publishing |
| Repository changes after analysis | Block publication against the stale SHA and offer re-excavation |
| Evidence collection is incomplete | Return a Preliminary Reconstruction with coverage disclosure |
| Model output fails schema twice | Preserve collected evidence and show a retryable analysis error |
| Sandbox times out | Preserve any valid patch and completed check results; label unfinished checks |
| Dependency installation fails | Report the command and failure honestly; still offer a reviewable patch when one exists |
| No tests are discovered | List build, lint, typecheck, or static checks completed and say no test suite was found |
| Pull-request creation fails | Make Download Patch the primary action and Try Again the secondary text action |
| User closes the app | Continue the job; Realtime and persisted operation state restore the experience |
| Nebius analysis service is unavailable during judging | Show the last completed real excavation in read-only fallback mode, clearly labeled with its timestamp |

## 11. Security and Privacy Checklist

- Supabase Auth JWT is verified by the control API on every user request.
- RLS is enabled and tested for every public table and private Storage path.
- Service-role credentials exist only in server-side secret configuration.
- GitHub OAuth identity and GitHub App repository authorization are separate.
- Repository source is processed ephemerally and never copied wholesale into Supabase.
- Model inputs use the minimum relevant evidence and redact detected secrets.
- Audit events record user approvals without storing sensitive repository contents.
- Logs use repository IDs and operation IDs, not source excerpts.
- Patch downloads use expiring signed URLs.
- Users can edit or delete Creator Memory and disconnect repository access.
- Sandbox commands have CPU, memory, time, filesystem, and network limits.
- No automatic merges, production deployment, or changes outside the approved patch boundary.

## 12. Testing Strategy

### 12.1 Unit tests

- Repository dormancy calculation and status transitions.
- Evidence classification and citation serialization.
- Three-slot path rotation and restoration.
- Model schema validation and one-retry behavior.
- Command allowlist and forbidden-path enforcement.
- Creator Memory provenance and consent rules.
- Badge idempotency.

### 12.2 Integration tests

- Supabase GitHub login and local onboarding-profile transfer.
- GitHub App callback, installation ownership, and selected repository listing.
- RLS attempts proving one user cannot read or mutate another user's artifacts.
- Evidence collector against fixture repositories.
- Token Factory model call with structured output.
- Sandbox clone, edit, check, and patch generation.
- Draft PR creation in a dedicated test repository.
- Realtime progress restoration after browser refresh.

### 12.3 End-to-end acceptance tests

- A new user completes How I Build, skips GitHub, sees the correct empty state, then connects later.
- A private repository becomes an Unexamined Artifact without exposing its contents in client logs.
- The first excavation shows all stages and produces evidence-backed confidence labels.
- Editing an incorrect finding updates the result and offers—but does not force—a memory update.
- A low-confidence excavation asks targeted questions and revises its reconstruction.
- The recommended path sounds consistent with the user's How I Build profile.
- An approved change runs in a clean sandbox and produces a downloadable patch.
- A second approval opens a draft PR; a simulated publishing failure preserves Download Patch.
- The museum collection displays First Revival only once.

## 13. Build Order and Verification Gates

| Gate | Deliverable | Verification |
|---|---|---|
| 1. Foundation | Monorepo, environments, Supabase schema, RLS, auth shell | CI passes and cross-user RLS tests fail closed |
| 2. Dig site | Onboarding, GitHub sign-in, GitHub App install, repository picker, artifact cards | Public and private test repositories list correctly |
| 3. Excavation | Operations, evidence collector, Nemotron reconstruction, Realtime progress, results tabs | Ground-truth demo repo is described accurately with citations |
| 4. Decision | Editable findings, clarification loop, Creator Memory, three paths | Corrections persist and recommendation changes when relevant |
| 5. Coding agent | Work order, approval, Token Factory Sandbox, checks, patch download | Fresh sandbox run creates a bounded, reproducible patch |
| 6. Pull request | Second approval, branch creation, draft PR, recovery behavior | Test repo receives a draft PR and no merge occurs |
| 7. Product finish | Time Capsule, First Revival museum badge, accessibility, fallback demo | Three-minute demo can be recorded in one reliable flow |
| 8. Submission | Public repo, license, README, architecture, feedback, hosted app | Another developer can follow setup instructions |

Do not polish the excavation animation before Gate 3 can produce a real evidence-grounded reconstruction. Once Gate 3 works, visual craft becomes a high-value differentiator rather than a substitute for the core agent.

## 14. Hackathon Demo Path

The three-minute demonstration should use Jasmine's real paused repository:

1. Open on Welcome back and briefly show How I Build memory.
2. Reveal the repository as an Unexamined Artifact with last commit and dormant time.
3. Press Excavate and show the old-terminal stages backed by a real asynchronous operation.
4. Land on the accurate recovered purpose and stopping point, then open one Why Revival Thinks This drawer.
5. Show the personally tailored recommended path and its approval card.
6. Run the bounded change in a Token Factory Sandbox and show the real checks and diff.
7. Approve publication and open the GitHub draft pull request.
8. Return to the museum collection and reveal First Revival.

The narration must explicitly name NVIDIA Nemotron through Nebius Token Factory, Token Factory Sandboxes, and any Nebius Serverless components actually used. The README should document the same architecture, setup steps, model aliases, evaluation approach, safety boundary, and product feedback.

## 15. Primary Dependencies and Official References

- Nebius Token Factory quickstart: https://docs.tokenfactory.nebius.com/quickstart
- Token Factory Sandboxes overview: https://docs.tokenfactory.nebius.com/sandboxes/overview
- Token Factory Sandbox first steps: https://docs.tokenfactory.nebius.com/sandboxes/cli/tutorial/first-steps
- Nebius Serverless Jobs: https://docs.nebius.com/serverless/jobs/manage
- Nebius Serverless Endpoints: https://docs.nebius.com/serverless/endpoints/manage
- NVIDIA Nemotron 3 Ultra model card: https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard
- NVIDIA Nemotron 3 Super model card: https://build.nvidia.com/nvidia/nemotron-3-super-120b-a12b/modelcard
- GitHub App permission selection: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- GitHub pull-request API: https://docs.github.com/en/rest/pulls/pulls
- Supabase GitHub social login: https://supabase.com/docs/guides/auth/social-login/auth-github
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control

## 16. Risks and Open Verification Items

| Item | Current decision | Verification before implementation |
|---|---|---|
| Exact Nemotron catalog IDs | Environment aliases | Confirm eligible model IDs in the live Token Factory catalog |
| Sandbox API and limits | Token Factory Sandbox | Run a minimal clone, install, test, and diff spike |
| Serverless execution duration | Endpoint for control, Jobs for long work | Benchmark one representative repository |
| Netlify to Nebius CORS | Explicit production origins | Verify preflight and bearer-token flow |
| Private repo installation flow | GitHub App selected-repository access | Test install, suspend, revoke, and reconnect |
| Large repositories | Adaptive evidence, no arbitrary cutoff | Measure coverage and latency on small, medium, and large fixtures |
| Tavily prize eligibility | Optional enhancement only | Add only if a real freshness lookup improves the product and is visible in the demo |

## 17. Definition of Technically Ready

Revival is ready to submit when a judge can authenticate, authorize one repository, complete a real excavation, inspect evidence and confidence, approve a small change, see it run in an isolated Token Factory Sandbox, download the patch, and open a GitHub draft pull request after a distinct second approval. The hosted demo, public licensed repository, README, three-minute video, evaluation evidence, and candid feedback on Nebius and NVIDIA tooling must all describe the working implementation rather than planned features.
