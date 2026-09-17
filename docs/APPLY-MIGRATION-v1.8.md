# Apply note — v1.8.0 roles / permissions / admins

Parent agent: migration SQL lives at:

`supabase/migrations/20260917090000_roles_permissions_admins.sql`

Already applied via Supabase MCP in chunks:
1. `roles_permissions_schema`
2. `roles_permissions_rls`
3. `roles_permissions_admin_rpcs`
4. `roles_permissions_seed_admins`
5. `fix_protect_trigger_and_reseed_roles`

## What it does
- Extends `profiles` with `job_title`, `can_edit_calendar`, `can_edit_bitacora`, `can_edit_tasks`, `is_active`
- Roles: `ceo` | `admin` | `staff` (ceo/admin = isAdmin)
- RLS: SELECT shared for calendar/bitácora/tasks; WRITE gated by admin OR `can_edit_*`
- Personal tasks remain creator-only
- Admin RPCs (SECURITY DEFINER): `admin_create_user`, `admin_delete_user`, `admin_set_password`, `admin_update_user`
- Seeded admins (username / password / role):
  - `SergioIbarra` / `09SERGIO` / CEO
  - `GabrielaIbarra` / `10GABRIELA` / CEO
  - `LuisLopez` / `REFSTAR123` / Administrador

## How admins create users in the app
Más → Lista de usuarios del equipo → Agregar usuario
(username, password, cargo, role, permission toggles for staff)

Or call RPC `admin_create_user` while authenticated as ceo/admin.

## v1.8.1 note — admin_* EXECUTE grants

Migration already includes:

```sql
grant execute on function public.admin_create_user(text, text, text, text, text, boolean, boolean, boolean) to authenticated;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_update_user(uuid, text, text, text, boolean, boolean, boolean, boolean) to authenticated;
```

If create/edit user RPC fails with permission denied, re-run those four grants in SQL Editor (do not change admin passwords).
