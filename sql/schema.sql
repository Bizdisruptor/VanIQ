-- VanIQ Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  plan text not null default 'free', -- 'free' | 'single' | 'builder'
  stripe_customer_id text,
  stripe_subscription_id text,
  single_build_purchase_id text,
  projects_used integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Van Build',
  van_model text not null default 'Transit 148 HR',
  modules jsonb not null default '[]'::jsonb,
  systems jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  thumbnail text, -- base64 or URL
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects: users can only see/edit their own
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- Index for fast lookups
create index projects_user_id_idx on public.projects(user_id);
create index projects_updated_at_idx on public.projects(updated_at desc);
