-- Tareas personales vs. compartidas del equipo
alter table public.tasks
  add column if not exists is_personal boolean not null default false;

create index if not exists tasks_is_personal_idx on public.tasks (is_personal);
create index if not exists tasks_created_by_idx on public.tasks (created_by);

alter table public.tasks enable row level security;

drop policy if exists "staff_all_tasks" on public.tasks;
drop policy if exists "tasks_select" on public.tasks;
drop policy if exists "tasks_insert" on public.tasks;
drop policy if exists "tasks_update" on public.tasks;
drop policy if exists "tasks_delete" on public.tasks;

-- Shared tasks visible to all authenticated staff.
-- Personal tasks only visible to their creator.
create policy "tasks_select"
  on public.tasks for select to authenticated
  using (
    is_personal = false
    or created_by = auth.uid()
  );

create policy "tasks_insert"
  on public.tasks for insert to authenticated
  with check (
    (is_personal = false)
    or (is_personal = true and created_by = auth.uid())
  );

create policy "tasks_update"
  on public.tasks for update to authenticated
  using (
    is_personal = false
    or created_by = auth.uid()
  )
  with check (
    (is_personal = false)
    or (is_personal = true and created_by = auth.uid())
  );

create policy "tasks_delete"
  on public.tasks for delete to authenticated
  using (
    is_personal = false
    or created_by = auth.uid()
  );

grant select, insert, update, delete on public.tasks to authenticated;
