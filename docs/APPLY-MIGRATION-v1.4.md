# Apply note — v1.4 profile avatar/bio

Parent agent: apply this migration via Supabase MCP (or SQL editor):

`supabase/migrations/20260914160000_profiles_avatar_bio.sql`

It:
1. Adds `profiles.avatar_url` and `profiles.bio` (keeps existing `role`)
2. Creates public Storage bucket `avatars` with policies:
   - public read
   - authenticated write/update/delete only under `{user_id}/…`

The app tolerates missing columns (save falls back / shows a clear message).

If Storage MCP / `storage.buckets` insert fails in your project, create the bucket manually in Dashboard → Storage → New bucket named `avatars` (Public), then re-run the policy statements from the migration.
