# Revival Live Integration Spike

Status: **Harness implemented; live credentialed rerun pending.**

This spike is the submission-proof gate for three independent server-only integrations:

1. an eligible NVIDIA Nemotron model through Nebius Token Factory;
2. a real disposable Token Factory Sandbox (ConTree) edit and check;
3. a least-privilege GitHub App installation that exposes only selected repositories.

The orchestration uses `LocalJobAdapter` with the same typed request/result boundary intended
for a Nebius Serverless Job. This lets the contract be verified now without pretending the local
adapter is a deployed Serverless Job.

## Configuration

Install the official sandbox client with `uv tool install contree-cli`, then authenticate it
without putting a token in shell history:

```bash
export NEBIUS_API_KEY="..."
export NEBIUS_AI_PROJECT="..."
contree auth -y
```

Copy `.env.example` to `.env` and set these server-only values:

- `NEBIUS_TOKEN_FACTORY_API_KEY`
- `NEMOTRON_REASONING_MODEL` — exact eligible NVIDIA model alias from the live catalog
- `CONTREE_PROJECT` and optionally `CONTREE_IMAGE`
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_INSTALLATION_ID` for an installation limited to a test repository

Never prefix these variables with `VITE_`, paste them into browser code, or commit `.env`.

## Clean rerun

```bash
PYTHONPATH=services/control-api:services/workers \
  uv run python scripts/integration_spike.py --pretty
```

The command succeeds only when it receives a validated model completion, a non-empty sandbox
diff whose check passed, and at least one repository from the GitHub installation token. Its JSON
output is intentionally redacted: it contains provider IDs, latency, counts, repository metadata,
the harmless diff, and no API key, private key, or installation token.

## Observations

| Check | Current result |
|---|---|
| Token Factory model alias | Pending live catalog selection |
| Model latency and token use | Pending credentialed run |
| Sandbox image and operation ID | Pending credentialed run |
| Sandbox edit/check/diff | Pending credentialed run |
| GitHub selected repository metadata | Pending GitHub App installation |
| Serverless-compatible contract | Verified locally by automated test |

Do not mark checklist item 3 complete until a redacted successful output is added below and the
same command passes from a clean environment.

## Required GitHub App permissions

- Repository metadata: read (automatic)
- Contents: read and write
- Pull requests: read and write
- Issues: read only if issue evidence is enabled

During installation, choose **Only select repositories** and authorize a disposable public or
private test repository. Social sign-in remains a separate Supabase OAuth connection.

## Successful run evidence

Pending. Paste only the redacted JSON emitted by the command; never paste raw credentials.
