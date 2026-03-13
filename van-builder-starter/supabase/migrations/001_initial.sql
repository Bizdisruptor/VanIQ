create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  van_id text not null,
  items jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table projects enable row level security;
create policy "Users own their projects" on projects
  for all using (auth.uid() = user_id);
