# Product Requirements Document

## Product Summary

**Revival: Bring this project back to life** is a web application and coding agent for creative developers whose promising GitHub projects have gone dormant. It presents a multi-repository dashboard as a retro digital archaeology lab, reconstructs the purpose and condition of a selected project, and helps its creator choose whether to revive, rescope, or preserve it.

Revival is designed around two connected payoffs:

1. **Emotional understanding:** the creator feels that Revival accurately recovered what they meant to build and made a recommendation that sounds personally relevant.
2. **Technical trust:** after explicit approvals, Revival turns that understanding into a small code change, checks the result, and opens a reviewable pull request without silently changing the default branch.

The product never shames users for time away. Every returning session begins with **Welcome back.**

## Target User

### Primary user

A creative developer, programmer, AI system builder, technical architect, or frequent hackathon participant who:

- Maintains several personal or experimental GitHub repositories
- Moves between paid work, personal responsibilities, creative interests, and deadlines
- Has at least one promising JavaScript or TypeScript project they want to resume
- Experiences friction reconstructing what the project was, where work stopped, and what to do next
- Wants AI assistance without surrendering control of their repository

### User mindset

The user may feel curious, excited, uncertain, or mildly embarrassed about an old project. Revival must treat dormancy as normal. Its language should be welcoming, curious, honest, and celebratory rather than judgmental, urgent, or productivity-obsessed.

### Initial repository fit

The first release is optimized for JavaScript and TypeScript repositories, especially React, Vite, and Node projects. Unsupported or weakly understood projects may still be added, but Revival must set expectations and never imply a level of understanding it has not demonstrated.

## Product Principles

1. **Welcome, never shame.** Time away is context, not failure.
2. **Evidence before confidence.** Revival separates recovered facts, strong inferences, and unknowns.
3. **Understand before acting.** No code change begins until the project has been reconstructed and a path chosen.
4. **Human approval at consequential moments.** The user approves the work proposal and separately approves pull-request creation.
5. **Preserve optionality.** Users can correct findings, compare three paths, return to earlier paths, download their work, and leave without changing GitHub.
6. **One meaningful step beats a giant rewrite.** A revival patch restores momentum; it does not attempt to finish an entire application.
7. **Make the invisible memorable.** Repository analysis becomes a focused artifact-scanning experience without hiding progress or errors.

## Core User Journey

### First visit

1. User opens Revival.
2. Revival introduces the promise: bring a paused coding project back to life.
3. Before GitHub connection, the user completes **How I Build**.
4. Revival confirms the initial Creator Memory and explains that it can be edited later.
5. User enters the digital archaeology lab.
6. User may connect GitHub immediately or choose **Connect Later**.
7. If GitHub is not connected, the empty dig site remains visible and the computer displays **Connect to GitHub to revive your first project.**

### Repository setup

1. User connects GitHub.
2. User sees a searchable list of accessible repositories.
3. User manually selects one or more repositories to add to Revival.
4. Each selected repository appears as a bone-like artifact card labeled **Unexamined Artifact**.
5. Each card shows its repository name, last commit, and calculated time dormant.

### Excavation

1. User opens one artifact and presses **Excavate**.
2. Revival clearly displays the repository name and creator name.
3. An old-terminal scanner gradually decodes the project using labeled stages.
4. First-time users remain in a focused reveal. Returning users may choose **Skip Scan** without stopping the analysis.
5. If the app is closed, the excavation continues.
6. When the user returns, Revival says **Welcome back** and opens or links to the recovered results.

### Reconstruction and decision

1. Revival displays a tabbed, vertically scrollable excavation report.
2. Findings are presented as editable cards and labeled by confidence.
3. If the overall reconstruction is low-confidence, Revival displays a preliminary reconstruction and asks two or three targeted questions.
4. User may dictate or type corrections through **Edit This**.
5. Revival revises affected findings before recommending a path.
6. Revival presents one strongest recommendation and a **Show Me Another Path** action.
7. The user may cycle through exactly three paths and return to any earlier one.
8. User chooses **Revive**, **Rescope**, or **Archive**.

### Completion

- A successful Revive ends with a tested patch, reviewed diff, approved pull request, updated repository status, positive completion message, and **First Revival** badge when applicable.
- A successful Rescope ends with an editable plan and README revision, optionally submitted through an approved pull request.
- A successful Archive ends with a permanently stored Project Time Capsule and downloadable Markdown document.

## Epics And User Stories

### Epic 1: Welcoming Onboarding

#### Story 1.1 — Enter without shame

As a returning creator, I want Revival to welcome me without mentioning how long I neglected my work so that I feel comfortable returning.

Acceptance criteria:

- Every authenticated return visit displays **Welcome back.**
- The welcome message does not change based on inactivity length, time of day, streaks, missed goals, or repository dormancy.
- No screen describes the user as lazy, inconsistent, behind, or failing.
- Dormant time is presented as neutral repository metadata.

#### Story 1.2 — Complete How I Build

As a new user, I want to describe how I build before connecting GitHub so that Revival can make recommendations aligned with my preferences.

Acceptance criteria:

- **How I Build** appears before the GitHub connection step.
- The onboarding gathers preferred languages/frameworks, common project types, desired MVP size, planning style, testing preferences, product priorities, and whether the user generally favors repair, simplification, or experimentation.
- Every question can be completed by typing.
- Long-form preference questions also accept voice dictation.
- User can review and edit the collected profile before continuing.
- Revival explains that the profile remains editable and may improve through future feedback.
- Completion leads to the digital archaeology lab, not directly to GitHub.

#### Story 1.3 — Defer GitHub connection

As a new user, I want to explore the interface before granting GitHub access so that I can decide whether I trust the product.

Acceptance criteria:

- The lab offers both **Connect GitHub** and **Connect Later**.
- Choosing Connect Later does not block access to Settings or Creator Memory.
- The empty dig site shows the lab environment and a computer reading **Connect to GitHub to revive your first project.**
- The empty state contains no fake repositories, fake activity, or guilt-oriented message.

### Epic 2: GitHub Connection And Repository Curation

#### Story 2.1 — Connect GitHub intentionally

As a creator, I want to connect GitHub with a clear explanation of access so that I understand what Revival can view and when it may write.

Acceptance criteria:

- Before connection, Revival distinguishes read access used for excavation from write access used for an approved branch and pull request.
- Successful connection returns the user to the lab.
- Canceling or denying connection returns to the empty state without losing Creator Memory.
- A disconnected or expired GitHub connection is clearly indicated without deleting previously stored reports.

#### Story 2.2 — Manually add repositories

As a creator with many repositories, I want to search and deliberately add selected projects so that Revival contains only work I care about revisiting.

Acceptance criteria:

- User sees a searchable repository list after connecting GitHub.
- Results display enough identity information to distinguish similarly named repositories.
- User can select one or several repositories.
- No accessible repository is automatically added.
- Added repositories immediately appear on the dashboard as **Unexamined Artifact** cards.
- The same repository cannot be added twice.
- User can return later to add more repositories.

### Epic 3: Digital Dig-Site Dashboard

#### Story 3.1 — Scan the project collection

As a creator, I want to understand the state of my selected repositories at a glance so that I can choose what deserves attention.

Acceptance criteria:

- The dashboard supports several repository cards.
- Every card displays repository name, most recent commit date, and human-readable time dormant.
- An unexamined repository displays **Unexamined Artifact**.
- Examined repository statuses may display **Revival in Progress**, **Rescoped**, **Preserved**, or **Revived**.
- Repository status changes immediately after the associated milestone succeeds.
- Cards remain readable and actionable within the archaeology theme.

#### Story 3.2 — Start one focused excavation

As a creator, I want to choose one repository for analysis so that I can focus on one meaningful decision.

Acceptance criteria:

- Every unexamined artifact has a visible **Excavate** action.
- The confirmation view displays the exact repository name.
- Starting an excavation does not start analysis of any other repository.
- A repository already being excavated cannot accidentally start a duplicate excavation.

### Epic 4: Excavation Reveal

#### Story 4.1 — Watch the project being decoded

As a creator, I want the analysis to feel like an artifact being recovered so that a technically complex wait becomes understandable and memorable.

Acceptance criteria:

- The excavation screen displays the creator name and repository name.
- A bone-like artifact is placed into or shown inside an old-computer scanner.
- The computer progressively displays stages such as:
  - **Recovering documentation**
  - **Examining project structure**
  - **Tracing project history**
  - **Reconstructing intent**
- Progress labels correspond to actual stages rather than a purely decorative timer.
- The first excavation presents the complete focused sequence.
- After the first excavation, **Skip Scan** becomes available.
- Skip Scan bypasses the presentation only; it does not cancel or shorten analysis.

#### Story 4.2 — Leave and return safely

As a creator, I want excavation to continue if I close the app so that I do not lose progress.

Acceptance criteria:

- Closing or navigating away does not cancel a submitted excavation.
- Returning to an active excavation shows its current state.
- Returning after completion displays **Welcome back** and makes the recovered report immediately accessible.
- A failed excavation is not shown as complete.

### Epic 5: Evidence-Aware Reconstruction

#### Story 5.1 — Understand the recovered project

As a creator, I want a structured reconstruction of my project so that I can remember what I intended and where work stopped.

Acceptance criteria:

- The report uses named tabs with vertically scrollable content rather than one fixed-length summary.
- The report covers:
  - Original vision
  - Apparent target user
  - Recovered or working features
  - Last known activity and likely stopping point
  - Important product or technical decisions
  - Unfinished or broken work
  - Unknowns and open questions
  - Recommended next direction
- Findings are divided into readable cards.
- Every substantive finding is visibly labeled **Recovered Fact**, **Strong Inference**, or **Unknown**.
- The product never converts an inference into a fact merely because it is repeated elsewhere in the report.

#### Story 5.2 — Resolve low-confidence findings

As a creator, I want Revival to ask for help when evidence is insufficient so that it does not invent my intent.

Acceptance criteria:

- A low-confidence result is labeled **Preliminary Reconstruction**.
- Revival still shows what it recovered instead of returning a blank failure.
- It asks two or three targeted questions tied to specific uncertainties.
- User may answer by typing or dictation.
- Findings update after the answers.
- Path recommendations are generated from the revised reconstruction, not the known-low-confidence version.

#### Story 5.3 — Correct the excavation

As a creator, I want to edit incorrect findings so that the final reconstruction represents my project accurately.

Acceptance criteria:

- Every findings card offers **Edit This**.
- User may type or dictate a correction.
- The edited card visibly changes after confirmation.
- Related summaries or recommendations are refreshed when the correction materially affects them.
- Revival asks whether a correction reflects a reusable Creator Memory preference before saving it there.
- Declining the memory update still applies the correction to the current project.

### Epic 6: Three Deliberate Paths

#### Story 6.1 — Receive one clear recommendation

As a creator returning with limited context, I want one strongest recommendation first so that I am not overwhelmed by choices.

Acceptance criteria:

- Revival initially presents one recommended path.
- The recommendation explains why it fits the recovered evidence and Creator Memory.
- The user may select it or choose **Show Me Another Path**.
- Revival provides exactly three distinct paths for the current excavation.
- After the third path, the user can cycle back to the first.
- Previously shown paths remain accessible and unchanged unless the user edits project findings.
- A material finding correction may regenerate the set, but Revival warns the user before replacing existing paths.

#### Story 6.2 — Choose a fate

As a creator, I want to choose Revive, Rescope, or Archive so that Revival supports the project rather than assuming every repository must continue.

Acceptance criteria:

- Each path clearly identifies whether its proposed outcome is Revive, Rescope, or Archive.
- The three actions remain available even when Revival recommends one more strongly.
- Selecting a fate opens a review screen before any change occurs.
- Returning to the report does not discard the three paths.

### Epic 7: Revive A Project

#### Story 7.1 — Approve a momentum patch

As a creator, I want to understand the proposed code change before work begins so that I remain in control.

Acceptance criteria:

- The proposal states:
  - What Revival intends to change
  - Why this is the best momentum-building action
  - Files likely to be affected
  - What successful completion will look like
  - What checks Revival plans to run
- The proposal is scoped to one coherent improvement.
- User may approve, reject, edit the request, or return to another path.
- No file is changed before explicit approval through **Approve Excavation Work**.

#### Story 7.2 — Observe restoration work

As a creator, I want to see what Revival is doing so that the agent's work is understandable rather than mysterious.

Acceptance criteria:

- The work view displays meaningful stages rather than an indefinite loading indicator.
- User can see whether Revival is examining, editing, building, linting, or testing.
- Completion clearly distinguishes successful checks, failed checks, skipped checks, and unavailable checks.
- If no tests are discovered, Revival displays **No tests discovered**.
- When no test suite exists, Revival lists the other checks it completed and never labels the patch “fully tested.”

#### Story 7.3 — Review before GitHub write

As a creator, I want to inspect the finished work before a branch or pull request is created so that I can reject unsafe or unwanted changes.

Acceptance criteria:

- Revival presents the complete diff.
- Check results appear beside or immediately before the approval controls.
- User may approve pull-request creation, reject the patch, or download the patch.
- Pull-request creation requires a separate confirmation from the initial work approval.
- Revival never merges into the default branch.

#### Story 7.4 — Recover from pull-request failure

As a creator, I want to keep my completed patch if GitHub pull-request creation fails so that the agent's work is not lost.

Acceptance criteria:

- Failure messaging explicitly states that the patch remains safe.
- **Download Patch** is the primary action.
- **Try Again** appears as a smaller secondary text action.
- Retrying does not rerun or silently alter the approved code unless a new issue requires a changed patch and the user approves it.
- A failed pull request does not set the repository status to Revived.

#### Story 7.5 — Celebrate a successful revival

As a creator, I want success to feel rewarding so that reopening old work feels exciting rather than burdensome.

Acceptance criteria:

- Successful pull-request creation updates the repository status to **Revived**.
- Revival displays a positive message such as **You brought a project back to life.**
- The user's first successful revival awards **First Revival** exactly once.
- The badge is added to the profile museum collection.
- The user can open the pull request or return to the dashboard.

### Epic 8: Rescope A Project

#### Story 8.1 — Create a smaller direction

As a creator whose original project became too ambitious, I want a focused new plan so that the useful core can still ship.

Acceptance criteria:

- Revival explains what to preserve, remove, postpone, and why.
- The plan names a coherent next milestone.
- A rewritten README reflects the proposed scope rather than merely appending generic text.
- Both the project plan and README are editable by typing or dictation.
- Editing one document does not silently overwrite the other.
- User reviews the README diff before any GitHub write.
- An optional pull request is created only after explicit approval.
- Successful completion updates the dashboard status to **Rescoped**.

### Epic 9: Preserve A Project

#### Story 9.1 — Create a Project Time Capsule

As a creator who does not want to continue a project now, I want its value and context preserved so that stopping does not feel like losing everything.

Acceptance criteria:

- Archive produces a Project Time Capsule containing:
  - Original vision
  - What worked
  - Likely reason work stopped, clearly labeled as inference when appropriate
  - Reusable ideas or components
  - Important decisions
  - Unresolved questions
  - Instructions for returning later
- The Time Capsule remains accessible inside Revival.
- User can download it as Markdown.
- The initial release does not automatically commit the Time Capsule into the repository.
- Revival does not delete or archive the GitHub repository.
- Completion updates the dashboard status to **Preserved**, not “dead” or “abandoned.”

### Epic 10: Creator Memory And Museum

#### Story 10.1 — Control Creator Memory

As a creator, I want to see and edit what Revival believes about me so that personalization remains transparent.

Acceptance criteria:

- Settings contains a dedicated Creator Memory view.
- Users can edit or delete individual preferences.
- Users can mark a memory as **Not actually my preference**.
- Deleted or rejected memories no longer influence new recommendations.
- Revival asks before converting project-specific feedback into a reusable personal preference.
- The view distinguishes user-provided preferences from preferences learned through interaction.

#### Story 10.2 — Improve through feedback

As a repeat user, I want Revival to adapt to my corrections and choices so that recommendations increasingly sound like me.

Acceptance criteria:

- Revival can propose a memory update after a user accepts a path, rejects a recommendation, edits a plan, or corrects a finding.
- The proposed memory is visible before saving.
- User may accept, edit, or reject it.
- Accepted memories influence future path explanations.
- Revival can identify which Creator Memory items shaped a personalized recommendation.

#### Story 10.3 — View the profile museum

As a creator, I want completed milestones preserved as artifacts so that returning to old work feels rewarding.

Acceptance criteria:

- The profile includes a small museum-style collection.
- **First Revival** appears in a specimen case after the first successful Revival pull request.
- Locked future spaces may suggest later badges without implying they are currently earnable.
- The museum remains secondary to Creator Memory and project management.

## Empty States And Edge Cases

### No GitHub connection

- Show the dig-site environment and connection prompt.
- Preserve completed onboarding and Creator Memory.
- Allow connection from both the empty-state computer and Settings.

### Connected account has no accessible repositories

- Explain that no repositories are available to add.
- Offer to refresh access or review the GitHub connection.
- Do not create sample artifacts that could be mistaken for the user's work.

### Repository was removed or permission was revoked

- Preserve prior excavation reports and Time Capsules.
- Mark live repository access as unavailable.
- Offer reconnection or removal from the dashboard.
- Do not claim that current repository information is up to date.

### Empty or poorly documented repository

- Produce a Preliminary Reconstruction from available evidence.
- Label missing areas Unknown.
- Ask targeted questions before recommending paths.
- Allow Archive even if there is insufficient evidence for Revive.

### Unsupported project type

- Identify the detected project type when possible.
- Explain that initial repair support is optimized for JavaScript and TypeScript.
- Permit evidence review and Time Capsule creation when safe.
- Do not offer an executable momentum patch unless Revival can explain and check the work credibly.

### Excavation fails

- Preserve the repository card.
- State which stage failed in plain language.
- Offer Retry and return-to-dashboard actions.
- Never display a partial report as a completed excavation without labeling it preliminary.

### Repository changes after excavation

- Indicate that the report may be stale when newer commits exist.
- Offer **Re-excavate** before executing an old recommendation.
- Do not apply a patch based on known-stale repository state without user confirmation.

### No build, lint, or test commands

- List each unavailable check.
- Show any checks that were completed.
- Avoid the phrase “all checks passed” when meaningful checks were unavailable.
- Keep Download Patch available after user review.

### User corrects a finding after viewing paths

- Explain that the existing paths may no longer fit.
- Ask whether to regenerate the three paths.
- Preserve existing paths until the user confirms replacement.

### User leaves during approved work

- Preserve work status.
- On return, show whether work is active, completed, failed, or waiting for review.
- Never create a pull request merely because the user left.

## What We Are Building

- Welcoming first-run and return experiences
- How I Build onboarding before GitHub
- Editable, consent-based Creator Memory
- GitHub connection and manual repository selection
- Multi-repository digital dig-site dashboard
- Artifact cards with lifecycle states
- Focused old-terminal excavation sequence
- Background continuation and returning-user Skip Scan
- Tabbed, scrollable, confidence-aware excavation reports
- Editable findings with voice or typed correction
- Preliminary Reconstruction and targeted clarification
- Exactly three persistent recommendation paths
- Revive, Rescope, and Archive workflows
- Two approval gates around code work and pull-request creation
- Visible patch, diff, and check results
- Honest no-test behavior
- Pull-request failure recovery and patch download
- Project Time Capsules with Markdown export
- One First Revival badge in a profile museum

## What We Would Add With More Time

- Additional programming languages and build systems
- GitLab and Bitbucket
- Team workspaces and shared Creator Memory
- Repository-level collaboration and reviewer assignment
- Automatic issue creation and milestone planning
- Optional Time Capsule commits
- Additional badges and museum collections
- More excavation artifacts and animations
- A deeper interactive excavation minigame
- Cross-repository pattern detection
- Suggestions that combine reusable components from several dormant projects
- Non-code creative projects such as films, books, and design systems
- Scheduled project-health check-ins
- User-defined automation policies
- Automatic merging, only after a separate safety and permission design

These remain outside the hackathon v1 because they do not improve the central proof as much as accurate reconstruction, personalized recommendations, and one safe tested pull request.

## Submission Proof Points

### Technological Implementation

- NVIDIA Nemotron performs multi-source project reconstruction, uncertainty-aware reasoning, targeted clarification, and personalized path selection.
- Nebius Token Factory handles live inference.
- Token Factory Sandboxes make the coding-agent behavior visible through file changes and real checks.
- GitHub integration turns a recommendation into a reviewable pull request with explicit human approval.

### Design

- The digital archaeology lab, bone scanner, terminal progress, lifecycle labels, Time Capsules, and museum reward form one coherent product metaphor.
- The experience transforms repository analysis from a wall of text into a focused narrative.
- Shame-free language and editable findings make returning feel safe.

### Potential Impact

- Revival addresses the real reconstruction cost faced by creative builders managing many repositories.
- It helps recover value from existing work rather than encouraging endless new projects.
- The workflow remains useful beyond the hackathon because it produces project understanding, preserved context, and working code.

### Quality Of The Idea

- Revival differs from a general coding assistant because it determines what the creator meant and what should happen next before coding.
- Creator Memory, confidence labels, three bounded paths, and the non-destructive Archive option demonstrate understanding of both the technical and emotional problem.
- The memorable demo combines an emotional surprise with objective evidence: accurate purpose recovery, a personally relevant recommendation, passing checks, and a real pull request.

## Product Success Criteria

The hackathon build is ready for demonstration when:

1. A new user can complete How I Build before GitHub connection.
2. The user can connect GitHub and manually add a real repository.
3. The dashboard accurately displays its name, last commit, dormant time, and Unexamined Artifact status.
4. The excavation sequence reflects real analysis stages.
5. Revival reconstructs the selected demo repository accurately enough for its creator to confirm the original purpose.
6. Facts, inferences, and unknowns are visibly separated.
7. The creator can correct a finding by typing or dictation.
8. Revival produces a recommendation that visibly uses Creator Memory.
9. The user can review exactly three paths and select one.
10. Revive proposes one small change and waits for approval.
11. The change is performed in a sandbox with honest build, lint, and test reporting.
12. The user can review and download the patch.
13. A second approval creates a real branch and pull request.
14. Success updates the repository state and awards First Revival.
15. The entire emotional and technical arc can be shown clearly within a three-minute video.
