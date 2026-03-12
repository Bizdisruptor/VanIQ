create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  van_id text not null,
  active_view text not null default 'plan',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id text not null,
  view_id text not null,
  x numeric not null,
  y numeric not null,
  width numeric not null,
  height numeric not null,
  rotation numeric not null default 0,
  locked boolean not null default false,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.project_modules enable row level security;
alter table public.project_notes enable row level security;

create policy "users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

create policy "users can view own project modules"
  on public.project_modules for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "users can insert own project modules"
  on public.project_modules for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "users can update own project modules"
  on public.project_modules for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "users can delete own project modules"
  on public.project_modules for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "users can view own project notes"
  on public.project_notes for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "users can insert own project notes"
  on public.project_notes for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "users can delete own project notes"
  on public.project_notes for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger set_project_modules_updated_at
before update on public.project_modules
for each row execute function public.set_updated_at();
