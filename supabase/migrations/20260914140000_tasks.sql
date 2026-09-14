-- Tareas compartidas del equipo
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  done boolean not null default false,
  due_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tasks_due_at_idx on public.tasks (due_at);
create index if not exists tasks_done_idx on public.tasks (done);
create index if not exists tasks_created_at_idx on public.tasks (created_at desc);

alter table public.tasks enable row level security;

drop policy if exists "staff_all_tasks" on public.tasks;
create policy "staff_all_tasks"
  on public.tasks for all to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.tasks to authenticated;

alter table public.tasks replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.tasks;
  exception
    when duplicate_object then null;
  end;
end;
$$;
