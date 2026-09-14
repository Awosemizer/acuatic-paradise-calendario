-- Acuatic Paradise — calendario compartido del equipo
-- Tablas: profiles, visits, events
-- RLS: cualquier usuario autenticado (staff) puede leer y escribir todas las filas.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  username text unique,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

-- ---------------------------------------------------------------------------
-- Visitas de clientes
-- ---------------------------------------------------------------------------
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  phone text,
  service_type text not null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  notes text,
  status text not null default 'programada'
    check (status in ('programada', 'completada', 'cancelada', 'no_asistio')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visits_starts_at_idx on public.visits (starts_at);
create index if not exists visits_status_idx on public.visits (status);

-- ---------------------------------------------------------------------------
-- Eventos internos (distintos visualmente de las visitas)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists visits_set_updated_at on public.visits;
create trigger visits_set_updated_at
  before update on public.visits
  for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Crear perfil al registrar un usuario
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
    ),
    lower(coalesce(
      new.raw_user_meta_data ->> 'username',
      split_part(new.email, '@', 1)
    ))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS — staff autenticado ve y edita TODO (calendario compartido)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.visits enable row level security;
alter table public.events enable row level security;

drop policy if exists "staff_select_profiles" on public.profiles;
create policy "staff_select_profiles"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "staff_update_own_profile" on public.profiles;
create policy "staff_update_own_profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "staff_insert_own_profile" on public.profiles;
create policy "staff_insert_own_profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "staff_all_visits" on public.visits;
create policy "staff_all_visits"
  on public.visits for all to authenticated
  using (true)
  with check (true);

drop policy if exists "staff_all_events" on public.events;
create policy "staff_all_events"
  on public.events for all to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.visits to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter table public.visits replica identity full;
alter table public.events replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.visits;
  exception
    when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.events;
  exception
    when duplicate_object then null;
  end;
end;
$$;
