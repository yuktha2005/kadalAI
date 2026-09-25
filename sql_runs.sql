-- First Query
-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists "pgcrypto";

-- 1) Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  water_body text,
  progress integer not null default 0 check (progress between 0 and 100),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Updated-at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_set_updated_at on public.projects;
create trigger trg_projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- 3) Helpful indexes
create index if not exists idx_projects_date on public.projects(date);
create index if not exists idx_projects_water_body on public.projects(water_body);

-- 4) Row Level Security (RLS)
alter table public.projects enable row level security;

-- Policies (adjust to your auth model; these allow anon reads/inserts)
drop policy if exists "Allow read to anon" on public.projects;
create policy "Allow read to anon"
on public.projects
for select
to anon, authenticated
using (true);

drop policy if exists "Allow insert to anon" on public.projects;
create policy "Allow insert to anon"
on public.projects
for insert
to anon, authenticated
with check (true);

-- Optional: restrict updates/deletes to authenticated only
drop policy if exists "Allow update to authenticated" on public.projects;
create policy "Allow update to authenticated"
on public.projects
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Allow delete to authenticated" on public.projects;
create policy "Allow delete to authenticated"
on public.projects
for delete
to authenticated
using (true);

-- sample data insert 2nd query 

insert into public.projects (title, description, water_body, progress, date) values
('Andaman Deep Sea Survey', 'Comprehensive survey of deep-sea biodiversity in the Andaman Sea region', 'Andaman Sea', 75, '2024-01-15'),
('Arabian Sea Plankton Study', 'Analysis of planktonic communities and their seasonal variations', 'Arabian Sea', 60, '2024-02-03'),
('Bay of Bengal Coral Reefs', 'Monitoring coral reef health and biodiversity in the Bay of Bengal', 'Bay of Bengal', 90, '2024-01-28'),
('Indian Ocean Deep Currents', 'Study of deep ocean currents and their impact on marine life distribution', 'Indian Ocean', 45, '2024-02-10');