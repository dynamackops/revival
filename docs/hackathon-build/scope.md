# Project Scope

## Project Name Candidates

- **Revival** — confirmed project name
- Tagline: **Bring this project back to life.**

## One-Line Summary

Revival is a GitHub-connected coding agent and digital archaeology lab that reconstructs paused JavaScript and TypeScript projects, helps their creators choose whether to revive, rescope, or archive them, and can produce a tested, approval-gated pull request.

## Target User

The initial user is a creative developer, programmer, AI system builder, technical architect, or frequent hackathon participant who maintains several side projects. Their projects did not necessarily fail; paid work, health, family, deadlines, or new ideas became more important. When they return, reconstructing the project's intent and technical state creates enough friction that the work remains dormant.

## Problem

Repository tools preserve code and activity but rarely preserve the creator's full intention. After time away, a builder must rediscover:

- What they were trying to create
- Which parts currently work
- Why certain technical or product decisions were made
- Where progress stopped
- What is unfinished or broken
- What small action would restore momentum

Existing coding assistants generally expect the user to arrive with a task. Revival specializes in project archaeology: it recovers enough context to recommend the right task in the first place. It must do this without guilting the user or presenting uncertain conclusions as facts.

## Core Workflow

1. The user signs in with GitHub OAuth.
2. A short **How I Build** onboarding creates an editable Creator Memory with framework preferences, project style, MVP appetite, planning preferences, testing expectations, and product priorities.
3. The user manually adds selected repositories to a multi-repository dashboard.
4. Every visit begins with **Welcome back.** Repository cards show the project name, last commit, and time dormant.
5. The user chooses one repository and presses **Excavate**.
6. A retro dig-site terminal scans a bone-like artifact while gradually decoding the README, source tree, commit history, branches, issues, and package configuration.
7. Revival reconstructs the project and labels each conclusion as **Recovered Fact**, **Strong Inference**, or **Unknown**.
8. It returns the project's apparent purpose, target user, working components, likely stopping point, important decisions, unfinished or broken areas, and recommended next steps.
9. The user can reject a recommendation and request alternate directions.
10. The user chooses **Revive**, **Rescope**, or **Archive**.

### Revive

- Generate a small momentum-patch proposal.
- Obtain explicit approval before editing.
- Clone and modify the repository inside a Token Factory Sandbox.
- Run relevant installation, build, lint, and test commands.
- Present the code diff and test results.
- Obtain a second explicit approval.
- Create a new GitHub branch and pull request; never silently write to or merge into the default branch.

### Rescope

- Produce a smaller, coherent project plan.
- Explain what should be preserved, removed, or postponed.
- Rewrite the README to reflect the new direction.
- Show the README diff.
- After approval, optionally create a rescoping pull request.

### Archive

- Produce a non-destructive **Project Time Capsule** documenting the original vision, what worked, why progress stopped when it can be inferred, reusable ideas or components, unresolved questions, and instructions for returning later.
- Do not archive or delete the GitHub repository without a separate explicit confirmation.

## What We Are Building

- A polished multi-repository web dashboard
- GitHub OAuth and manual repository addition
- Initial support for JavaScript and TypeScript repositories, prioritizing React, Vite, and Node
- Repository metadata cards with name, last commit, and time dormant
- A memorable old-terminal bone-scanning excavation sequence
- Nemotron-powered repository reconstruction and confidence-aware findings
- Editable Creator Memory that can improve from accepted plans, rejected recommendations, corrections, and patch feedback
- Revive, Rescope, and Archive paths
- Sandboxed code modification and test execution
- Reviewable diffs and test results
- Approval-gated GitHub branch and pull-request creation
- One lightweight success reward: a **First Revival** badge and a positive completion message such as **You brought a project back to life.**

## What We Are Not Building

- Support for writing, filmmaking, or other non-code creative projects
- GitLab or Bitbucket integration
- A full excavation minigame
- Autonomous modification of multiple repositories
- Automatic merging into a default branch
- Unapproved GitHub writes
- Full-project rewrites in one run
- Complex team collaboration or organization administration
- An extensive badge economy or collectible system
- Perfect support for every programming language and build system

These are deferred to protect the central experience: accurately reconstruct one paused project and safely create one meaningful, tested improvement.

## Inspiration And References

- **Sourcegraph Cody:** whole-codebase understanding, extended here with historical reconstruction and personal context
- **GitKraken:** visual history, reinterpreted as archaeological layers and recovered evidence
- **GitHub Projects:** multi-repository organization, presented through a more narrative and emotionally welcoming experience
- **Retro computer terminals and archaeological scanning equipment:** the central visual language

The interface should feel nostalgic and imaginative without becoming difficult to use. The excavation sequence is a short, polished transition rather than a separate game.

## Demo Path

1. Open Revival and see **Welcome back.**
2. Show several manually added repositories with last-commit and dormant-time metadata.
3. Select one of Jasmine's genuinely paused JavaScript or TypeScript projects.
4. Press **Excavate** and show the terminal scanning its artifact.
5. Reveal a surprisingly accurate reconstruction with facts, inferences, and unknowns clearly separated.
6. Show a personalized recommendation informed by Creator Memory.
7. Select **Revive** and approve one small patch.
8. Show the agent editing and testing the code in a Token Factory Sandbox.
9. Review the diff and passing test/build evidence.
10. Approve creation of a GitHub branch and pull request.
11. End with **You brought a project back to life** and award the First Revival badge.

The demo repository must be selected early enough to create a reliable, truthful before-and-after story.

## Submission Story

Creative builders do not abandon every repository because the idea was poor or because they lack discipline. Their attention moves to work, health, family, deadlines, and other meaningful projects. Returning later carries a hidden reconstruction cost, and conventional coding agents still require the creator to know what task to request.

Revival treats dormant work as an artifact worth understanding. NVIDIA Nemotron performs the higher-order reconstruction: synthesizing code, history, documentation, and personal preferences; distinguishing facts from inference; and choosing a small, credible path forward. Nebius Token Factory supplies model inference, while Token Factory Sandboxes make the agent's coding behavior visible and testable. The result is not merely a repository summary but a safe path from forgotten intention to a real, reviewable pull request.

### Scope Ruler

- Build the complete end-to-end core in an initial focused one-week sprint.
- Use the remaining runway before October 30, 2026 for reliability, evaluation, interface polish, model feedback, and the three-minute demo.
- When tradeoffs arise, protect the accurate reconstruction and tested-patch workflow before secondary animation or reward features.
