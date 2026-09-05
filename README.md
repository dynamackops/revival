# Revival

Bring this project back to life.

Revival is a GitHub-connected coding agent and digital archaeology lab for creative
developers returning to paused projects. It reconstructs a repository's purpose and
stopping point, separates recovered facts from inference, recommends a personally
relevant path, and can produce a tested patch in an isolated Nebius Token Factory
Sandbox after explicit approval.

## Current status

The hackathon implementation is being built from the documents in
docs/hackathon-build. The workspace foundation is verified, and the current milestone
adds Supabase Auth, an ownership-isolated product schema, and server-side JWT
verification.

## Architecture

- apps/web: React, Vite, and TypeScript client
- services/control-api: FastAPI control plane
- services/workers: asynchronous evidence, model, sandbox, and GitHub workers
- packages/contracts: shared browser-facing status and API contracts
- packages/prompts: versioned Nemotron prompts
- packages/evaluation: reconstruction and safety evaluation fixtures
- supabase: database and security migrations

## Local setup

Requirements: Node 24+, pnpm 11+, Python 3.12+, uv, Docker, and the Supabase CLI.

    cp .env.example .env
    pnpm install
    uv sync
    pnpm check

Start the local Supabase stack and run the database policy tests:

    supabase start
    supabase db lint --local --level warning
    supabase test db

Run the web client:

    pnpm dev

Run the API:

    uv run uvicorn app.main:app --app-dir services/control-api --reload

Never place service-role, GitHub App, or Nebius credentials in variables prefixed
with VITE_. Full repository contents will be processed only in disposable sandboxes.

`VITE_SUPABASE_PUBLISHABLE_KEY` is the only Supabase key used by the browser.
`SUPABASE_SERVICE_ROLE_KEY` is reserved for server-side jobs. Account sign-in uses
Supabase's GitHub provider; repository access will use a separate least-privilege
GitHub App so identity and code permissions stay independently revocable.

## Hackathon technology

The working submission will use NVIDIA Nemotron through Nebius Token Factory,
Nebius Serverless components for orchestration, and Token Factory Sandboxes for
isolated code editing and checks. Exact live model IDs are configured through
environment aliases and documented after the integration spike.

## License

MIT
