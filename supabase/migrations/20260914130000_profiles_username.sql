-- Añade username único a profiles (login por nombre de usuario).
-- Seguro de re-ejecutar si la columna ya existe en la migración init.

alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_key
  on public.profiles (username)
  where username is not null;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

-- Rellenar username desde el correo sintético (local-part) si falta
update public.profiles p
set username = lower(split_part(u.email, '@', 1))
from auth.users u
where p.id = u.id
  and (p.username is null or p.username = '')
  and u.email is not null;

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
