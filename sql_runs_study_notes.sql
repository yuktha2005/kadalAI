-- Study Notes Table
-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists "pgcrypto";

-- Study Notes table to store project-specific research notes
create table if not exists public.study_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_project foreign key (project_id) references public.projects(id) on delete cascade
);

-- Updated-at trigger
drop trigger if exists trg_study_notes_set_updated_at on public.study_notes;
create trigger trg_study_notes_set_updated_at
before update on public.study_notes
for each row
execute function public.set_updated_at();

-- Helpful indexes
create index if not exists idx_study_notes_project_id on public.study_notes(project_id);
create index if not exists idx_study_notes_created_at on public.study_notes(created_at desc);
create index if not exists idx_study_notes_title on public.study_notes using gin(to_tsvector('english', title));

-- Row Level Security (RLS)
alter table public.study_notes enable row level security;

-- Policies (allow anon reads/inserts/updates for now)
drop policy if exists "Allow read to anon" on public.study_notes;
create policy "Allow read to anon"
on public.study_notes
for select
to anon, authenticated
using (true);

drop policy if exists "Allow insert to anon" on public.study_notes;
create policy "Allow insert to anon"
on public.study_notes
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow update to authenticated" on public.study_notes;
create policy "Allow update to authenticated"
on public.study_notes
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Allow delete to authenticated" on public.study_notes;
create policy "Allow delete to authenticated"
on public.study_notes
for delete
to authenticated
using (true);

