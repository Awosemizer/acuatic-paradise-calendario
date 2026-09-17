-- v1.8.0 — roles, permissions, admin RPCs, seed CEOs/admin
-- Parent may also apply via Supabase MCP.

-- ---------------------------------------------------------------------------
-- Profile extensions
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists job_title text;

alter table public.profiles
  add column if not exists can_edit_calendar boolean not null default false;

alter table public.profiles
  add column if not exists can_edit_bitacora boolean not null default false;

alter table public.profiles
  add column if not exists can_edit_tasks boolean not null default false;

alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- Normalize role values: ceo | admin | staff
update public.profiles
set role = lower(trim(role))
where role is not null;

update public.profiles
set role = 'staff'
where role is null or role not in ('ceo', 'admin', 'staff');

comment on column public.profiles.role is 'ceo | admin | staff — ceo/admin are isAdmin';
comment on column public.profiles.job_title is 'Display title e.g. CEO, Administrador, Mesero';
comment on column public.profiles.can_edit_calendar is 'Staff may create/edit visits & events';
comment on column public.profiles.can_edit_bitacora is 'Staff may create/edit bitácora items & logs';
comment on column public.profiles.can_edit_tasks is 'Staff may create/edit shared team tasks';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('ceo', 'admin')
      and coalesce(p.is_active, true)
  );
$$;

create or replace function public.can_edit_calendar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_active, true)
        and coalesce(p.can_edit_calendar, false)
    );
$$;

create or replace function public.can_edit_bitacora()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_active, true)
        and coalesce(p.can_edit_bitacora, false)
    );
$$;

create or replace function public.can_edit_tasks()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_active, true)
        and coalesce(p.can_edit_tasks, false)
    );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_edit_calendar() to authenticated;
grant execute on function public.can_edit_bitacora() to authenticated;
grant execute on function public.can_edit_tasks() to authenticated;

-- ---------------------------------------------------------------------------
-- Protect privileged profile columns for non-admins
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  -- Allow service role / migrations (no JWT)
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('ceo', 'admin') and coalesce(p.is_active, true)
  ) into caller_is_admin;

  if caller_is_admin then
    return new;
  end if;

  -- Non-admins cannot change privileged fields (including their own)
  new.role := old.role;
  new.job_title := old.job_title;
  new.can_edit_calendar := old.can_edit_calendar;
  new.can_edit_bitacora := old.can_edit_bitacora;
  new.can_edit_tasks := old.can_edit_tasks;
  new.is_active := old.is_active;
  new.username := old.username;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- RLS profiles
-- ---------------------------------------------------------------------------
drop policy if exists "staff_select_profiles" on public.profiles;
drop policy if exists "staff_update_own_profile" on public.profiles;
drop policy if exists "staff_insert_own_profile" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Calendar WRITE gated; SELECT remains open
-- ---------------------------------------------------------------------------
drop policy if exists "staff_all_visits" on public.visits;
drop policy if exists "visits_select" on public.visits;
drop policy if exists "visits_insert" on public.visits;
drop policy if exists "visits_update" on public.visits;
drop policy if exists "visits_delete" on public.visits;

create policy "visits_select"
  on public.visits for select to authenticated using (true);
create policy "visits_insert"
  on public.visits for insert to authenticated
  with check (public.can_edit_calendar());
create policy "visits_update"
  on public.visits for update to authenticated
  using (public.can_edit_calendar())
  with check (public.can_edit_calendar());
create policy "visits_delete"
  on public.visits for delete to authenticated
  using (public.can_edit_calendar());

drop policy if exists "staff_all_events" on public.events;
drop policy if exists "events_select" on public.events;
drop policy if exists "events_insert" on public.events;
drop policy if exists "events_update" on public.events;
drop policy if exists "events_delete" on public.events;

create policy "events_select"
  on public.events for select to authenticated using (true);
create policy "events_insert"
  on public.events for insert to authenticated
  with check (public.can_edit_calendar());
create policy "events_update"
  on public.events for update to authenticated
  using (public.can_edit_calendar())
  with check (public.can_edit_calendar());
create policy "events_delete"
  on public.events for delete to authenticated
  using (public.can_edit_calendar());

-- ---------------------------------------------------------------------------
-- Bitácora WRITE gated; SELECT open (shared for all staff)
-- ---------------------------------------------------------------------------
drop policy if exists "staff_all_bitacora_items" on public.bitacora_items;
drop policy if exists "bitacora_items_select" on public.bitacora_items;
drop policy if exists "bitacora_items_insert" on public.bitacora_items;
drop policy if exists "bitacora_items_update" on public.bitacora_items;
drop policy if exists "bitacora_items_delete" on public.bitacora_items;

create policy "bitacora_items_select"
  on public.bitacora_items for select to authenticated using (true);
create policy "bitacora_items_insert"
  on public.bitacora_items for insert to authenticated
  with check (public.can_edit_bitacora());
create policy "bitacora_items_update"
  on public.bitacora_items for update to authenticated
  using (public.can_edit_bitacora())
  with check (public.can_edit_bitacora());
create policy "bitacora_items_delete"
  on public.bitacora_items for delete to authenticated
  using (public.can_edit_bitacora());

drop policy if exists "staff_all_bitacora_logs" on public.bitacora_logs;
drop policy if exists "bitacora_logs_select" on public.bitacora_logs;
drop policy if exists "bitacora_logs_insert" on public.bitacora_logs;
drop policy if exists "bitacora_logs_update" on public.bitacora_logs;
drop policy if exists "bitacora_logs_delete" on public.bitacora_logs;

create policy "bitacora_logs_select"
  on public.bitacora_logs for select to authenticated using (true);
create policy "bitacora_logs_insert"
  on public.bitacora_logs for insert to authenticated
  with check (public.can_edit_bitacora());
create policy "bitacora_logs_update"
  on public.bitacora_logs for update to authenticated
  using (public.can_edit_bitacora())
  with check (public.can_edit_bitacora());
create policy "bitacora_logs_delete"
  on public.bitacora_logs for delete to authenticated
  using (public.can_edit_bitacora());

-- ---------------------------------------------------------------------------
-- Tasks: shared write needs can_edit_tasks (or admin); personal = creator
-- SELECT unchanged (shared all / personal creator)
-- ---------------------------------------------------------------------------
drop policy if exists "tasks_select" on public.tasks;
drop policy if exists "tasks_insert" on public.tasks;
drop policy if exists "tasks_update" on public.tasks;
drop policy if exists "tasks_delete" on public.tasks;

create policy "tasks_select"
  on public.tasks for select to authenticated
  using (is_personal = false or created_by = auth.uid());

create policy "tasks_insert"
  on public.tasks for insert to authenticated
  with check (
    (is_personal = true and created_by = auth.uid())
    or (is_personal = false and public.can_edit_tasks())
  );

create policy "tasks_update"
  on public.tasks for update to authenticated
  using (
    (is_personal = true and created_by = auth.uid())
    or (is_personal = false and public.can_edit_tasks())
  )
  with check (
    (is_personal = true and created_by = auth.uid())
    or (is_personal = false and public.can_edit_tasks())
  );

create policy "tasks_delete"
  on public.tasks for delete to authenticated
  using (
    (is_personal = true and created_by = auth.uid())
    or (is_personal = false and public.can_edit_tasks())
  );

-- ---------------------------------------------------------------------------
-- Admin RPCs (SECURITY DEFINER) — create / delete / set password / update
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_user(
  p_username text,
  p_password text,
  p_full_name text default '',
  p_job_title text default null,
  p_role text default 'staff',
  p_can_edit_calendar boolean default false,
  p_can_edit_bitacora boolean default false,
  p_can_edit_tasks boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid;
  v_email text;
  v_username text;
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden crear usuarios';
  end if;

  v_username := lower(trim(p_username));
  if v_username is null or v_username = '' or v_username !~ '^[a-z0-9._]+$' then
    raise exception 'Usuario inválido';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres';
  end if;

  v_role := lower(trim(coalesce(p_role, 'staff')));
  if v_role not in ('ceo', 'admin', 'staff') then
    v_role := 'staff';
  end if;

  v_email := v_username || '@acuaticparadise.com';

  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'Ese usuario ya existe';
  end if;

  v_uid := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_uid,
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', v_username, 'full_name', coalesce(p_full_name, '')),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email),
    'email',
    v_uid::text,
    now(), now(), now()
  );

  insert into public.profiles (
    id, full_name, username, role, job_title,
    can_edit_calendar, can_edit_bitacora, can_edit_tasks, is_active
  ) values (
    v_uid,
    coalesce(nullif(trim(p_full_name), ''), v_username),
    v_username,
    v_role,
    p_job_title,
    case when v_role in ('ceo','admin') then true else coalesce(p_can_edit_calendar, false) end,
    case when v_role in ('ceo','admin') then true else coalesce(p_can_edit_bitacora, false) end,
    case when v_role in ('ceo','admin') then true else coalesce(p_can_edit_tasks, false) end,
    true
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    username = excluded.username,
    role = excluded.role,
    job_title = excluded.job_title,
    can_edit_calendar = excluded.can_edit_calendar,
    can_edit_bitacora = excluded.can_edit_bitacora,
    can_edit_tasks = excluded.can_edit_tasks,
    is_active = true;

  return v_uid;
end;
$$;

create or replace function public.admin_set_password(p_user_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden cambiar contraseñas';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres';
  end if;
  update auth.users
  set encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = now()
  where id = p_user_id;
  if not found then
    raise exception 'Usuario no encontrado';
  end if;
end;
$$;

create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden eliminar usuarios';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'No puedes eliminarte a ti mismo';
  end if;
  delete from auth.users where id = p_user_id;
end;
$$;

create or replace function public.admin_update_user(
  p_user_id uuid,
  p_full_name text default null,
  p_job_title text default null,
  p_role text default null,
  p_can_edit_calendar boolean default null,
  p_can_edit_bitacora boolean default null,
  p_can_edit_tasks boolean default null,
  p_is_active boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden editar usuarios';
  end if;

  if p_role is not null then
    v_role := lower(trim(p_role));
    if v_role not in ('ceo', 'admin', 'staff') then
      raise exception 'Rol inválido';
    end if;
  end if;

  update public.profiles set
    full_name = coalesce(p_full_name, full_name),
    job_title = case when p_job_title is null then job_title else p_job_title end,
    role = coalesce(v_role, role),
    can_edit_calendar = coalesce(p_can_edit_calendar, can_edit_calendar),
    can_edit_bitacora = coalesce(p_can_edit_bitacora, can_edit_bitacora),
    can_edit_tasks = coalesce(p_can_edit_tasks, can_edit_tasks),
    is_active = coalesce(p_is_active, is_active)
  where id = p_user_id;

  -- Admins always get full edit flags
  update public.profiles set
    can_edit_calendar = true,
    can_edit_bitacora = true,
    can_edit_tasks = true
  where id = p_user_id and role in ('ceo', 'admin');
end;
$$;

grant execute on function public.admin_create_user(text, text, text, text, text, boolean, boolean, boolean) to authenticated;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_update_user(uuid, text, text, text, boolean, boolean, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed / promote the 3 admins (idempotent)
-- Passwords: SergioIbarra=09SERGIO, GabrielaIbarra=10GABRIELA, LuisLopez=REFSTAR123
-- ---------------------------------------------------------------------------
do $$
declare
  v_id uuid;
  v_email text;
begin
  -- SergioIbarra (ceo)
  v_email := 'sergioibarra@acuaticparadise.com';
  select id into v_id from auth.users where email = v_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt('09SERGIO', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"sergioibarra","full_name":"Sergio Ibarra"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_id,
      jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', v_id::text, now(), now(), now()
    );
  else
    update auth.users set encrypted_password = crypt('09SERGIO', gen_salt('bf')), updated_at = now() where id = v_id;
  end if;
  insert into public.profiles (id, full_name, username, role, job_title, can_edit_calendar, can_edit_bitacora, can_edit_tasks, is_active)
  values (v_id, 'Sergio Ibarra', 'sergioibarra', 'ceo', 'CEO', true, true, true, true)
  on conflict (id) do update set
    full_name = excluded.full_name, username = excluded.username, role = excluded.role,
    job_title = excluded.job_title, can_edit_calendar = true, can_edit_bitacora = true,
    can_edit_tasks = true, is_active = true;

  -- GabrielaIbarra (ceo) — create if missing
  v_email := 'gabrielaibarra@acuaticparadise.com';
  select id into v_id from auth.users where email = v_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt('10GABRIELA', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"gabrielaibarra","full_name":"Gabriela Ibarra"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_id,
      jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', v_id::text, now(), now(), now()
    );
  else
    update auth.users set encrypted_password = crypt('10GABRIELA', gen_salt('bf')), updated_at = now() where id = v_id;
  end if;
  insert into public.profiles (id, full_name, username, role, job_title, can_edit_calendar, can_edit_bitacora, can_edit_tasks, is_active)
  values (v_id, 'Gabriela Ibarra', 'gabrielaibarra', 'ceo', 'CEO', true, true, true, true)
  on conflict (id) do update set
    full_name = excluded.full_name, username = excluded.username, role = excluded.role,
    job_title = excluded.job_title, can_edit_calendar = true, can_edit_bitacora = true,
    can_edit_tasks = true, is_active = true;

  -- LuisLopez (admin)
  v_email := 'luislopez@acuaticparadise.com';
  select id into v_id from auth.users where email = v_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt('REFSTAR123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"luislopez","full_name":"Luis Lopez"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_id,
      jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', v_id::text, now(), now(), now()
    );
  else
    update auth.users set encrypted_password = crypt('REFSTAR123', gen_salt('bf')), updated_at = now() where id = v_id;
  end if;
  insert into public.profiles (id, full_name, username, role, job_title, can_edit_calendar, can_edit_bitacora, can_edit_tasks, is_active)
  values (v_id, 'Luis Lopez', 'luislopez', 'admin', 'Administrador', true, true, true, true)
  on conflict (id) do update set
    full_name = excluded.full_name, username = excluded.username, role = excluded.role,
    job_title = excluded.job_title, can_edit_calendar = true, can_edit_bitacora = true,
    can_edit_tasks = true, is_active = true;
end;
$$;
