# Supabase migrations

The foundation migration creates Revival's user-owned product tables, private
server-only execution records, indexes, constraints, Row Level Security policies, and
the private `revival-artifacts` Storage bucket.

Database tests live under `supabase/tests/database`. They run with two authenticated
user identities and prove that cross-user reads and writes are blocked. Run them with:

    supabase start
    supabase db lint --local --level warning
    supabase test db

Migrations are created with the Supabase CLI and are applied to a live project only
after the target project has been selected explicitly.
