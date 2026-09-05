# Excavation operation setup

Checklist item 6 adds the durable scan boundary without pretending the paused Nebius integration
has already run. The `excavation` Edge Function performs real GitHub reads at the repository's
current default-branch commit:

1. recover the README when one exists;
2. inspect the recursive Git tree;
3. read recent commit history;
4. prepare the evidence boundary for the later Nemotron reconstruction.

The operation then completes with the explicit message that Nemotron reconstruction is next.
No source files are written, no repository contents are persisted by this phase, and no model
result is fabricated.

## Deployment

Apply `supabase/migrations/20260905160000_excavation_operations.sql`, then deploy the function:

```bash
supabase functions deploy excavation
```

The function reuses the server-only secrets already configured for repository connection:

- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- Supabase-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

Optional: set `EXCAVATION_STAGE_DELAY_MS` to a value from `0` through `2000`. The default is
`650`, which keeps the focused terminal reveal legible without making the repository work fake.

## Live verification

1. Open an Unexamined Artifact and click **Excavate** twice quickly. Confirm only one excavation
   and one operation row exist for that repository.
2. Watch all four stage labels appear in order and confirm they match real GitHub requests in
   the Edge Function logs.
3. Refresh during the scan. Open the artifact again and confirm **Resume Scan** restores the
   persisted stage and percentage.
4. Use **Skip Scan** after it appears. Confirm the operation continues and reopening the artifact
   shows the current or completed state.
5. Let the scan complete. Confirm the UI says the evidence package was recovered and that
   Nemotron reconstruction is still waiting for the Nebius provider.
