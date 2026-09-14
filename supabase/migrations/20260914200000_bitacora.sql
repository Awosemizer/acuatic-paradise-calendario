-- Bitácora de mantenimiento compartida (piscina / salón / general)
-- Staff autenticado: select / insert / update en items y logs.

create table if not exists public.bitacora_items (
  id uuid primary key default gen_random_uuid(),
  area text not null check (area in ('piscina', 'salon', 'general')),
  title text not null,
  description text,
  interval_days integer not null check (interval_days > 0),
  last_done_at timestamptz,
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bitacora_items_area_idx on public.bitacora_items (area);
create index if not exists bitacora_items_active_idx on public.bitacora_items (active);
create index if not exists bitacora_items_last_done_idx on public.bitacora_items (last_done_at);

create table if not exists public.bitacora_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.bitacora_items (id) on delete cascade,
  done_at timestamptz not null default now(),
  done_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists bitacora_logs_item_id_idx on public.bitacora_logs (item_id);
create index if not exists bitacora_logs_done_at_idx on public.bitacora_logs (done_at desc);

drop trigger if exists bitacora_items_set_updated_at on public.bitacora_items;
create trigger bitacora_items_set_updated_at
  before update on public.bitacora_items
  for each row execute function public.set_updated_at();

alter table public.bitacora_items enable row level security;
alter table public.bitacora_logs enable row level security;

drop policy if exists "staff_all_bitacora_items" on public.bitacora_items;
create policy "staff_all_bitacora_items"
  on public.bitacora_items for all to authenticated
  using (true)
  with check (true);

drop policy if exists "staff_all_bitacora_logs" on public.bitacora_logs;
create policy "staff_all_bitacora_logs"
  on public.bitacora_logs for all to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.bitacora_items to authenticated;
grant select, insert, update, delete on public.bitacora_logs to authenticated;

alter table public.bitacora_items replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.bitacora_items;
  exception
    when duplicate_object then null;
  end;
end;
$$;

-- Semillas por defecto (idempotente por título + área)
insert into public.bitacora_items (area, title, description, interval_days)
select v.area, v.title, v.description, v.interval_days
from (values
  ('piscina'::text, 'Cambio de arena del filtro'::text, 'Reemplazo de la media filtrante del filtro de arena.'::text, 1460),
  ('piscina', 'Retrolavado / lavado del filtro', 'Backwash y enjuague del filtro de recirculación.', 14),
  ('piscina', 'Limpieza de skimmers y prefiltro de bomba', 'Vaciar cestas de skimmer y prefiltro de la bomba.', 7),
  ('piscina', 'Revisión de bomba de recirculación', 'Ruidos, fugas, presión y funcionamiento general.', 30),
  ('piscina', 'Limpieza / revisión de resistencias del calentador', 'Inspección y limpieza de resistencias del calentador.', 365),
  ('piscina', 'Revisión eléctrica del calentador (conexiones)', 'Revisar conexiones, contactores y cableado del calentador.', 180),
  ('piscina', 'Medición de cloro y pH', 'Registrar niveles de cloro libre y pH del agua.', 1),
  ('piscina', 'Aspira / limpiafondos', 'Aspirado del fondo y zonas de sedimentación.', 7),
  ('piscina', 'Limpieza de bordes y línea de agua', 'Limpiar bordes, azulejos y línea de flotación.', 7),
  ('piscina', 'Dosificación alguicida / floculante (registro)', 'Registrar dosis de alguicida o floculante aplicadas.', 14),
  ('salon', 'Limpieza de baños y vestidores', 'Limpieza diaria de baños y vestidores del salón.', 1),
  ('salon', 'Revisión de audio e iluminación del salón', 'Probar audio, luces y controles del salón de eventos.', 30),
  ('general', 'Inventario de meseros / mobiliario', 'Contar mesas, sillas, mantelería y equipo disponible.', 30)
) as v(area, title, description, interval_days)
where not exists (
  select 1 from public.bitacora_items i
  where i.area = v.area and i.title = v.title
);
