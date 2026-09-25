-- Query History Table
-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists "pgcrypto";

-- Query History table to store all RAG queries and responses
create table if not exists public.query_history (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  query_options jsonb, -- Stores filters like waterBody, scientificName, minDepth, maxDepth, dataTypes
  response_data jsonb not null, -- Stores the full QueryResponse object (answer, relevant_occurrences, dashboard_summary, etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at trigger
drop trigger if exists trg_query_history_set_updated_at on public.query_history;
create trigger trg_query_history_set_updated_at
before update on public.query_history
for each row
execute function public.set_updated_at();

-- Helpful indexes
create index if not exists idx_query_history_created_at on public.query_history(created_at desc);
create index if not exists idx_query_history_query on public.query_history using gin(to_tsvector('english', query));

-- Row Level Security (RLS)
alter table public.query_history enable row level security;

-- Policies (allow anon reads/inserts for now)
drop policy if exists "Allow read to anon" on public.query_history;
create policy "Allow read to anon"
on public.query_history
for select
to anon, authenticated
using (true);

drop policy if exists "Allow insert to anon" on public.query_history;
create policy "Allow insert to anon"
on public.query_history
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow update to authenticated" on public.query_history;
create policy "Allow update to authenticated"
on public.query_history
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Allow delete to authenticated" on public.query_history;
create policy "Allow delete to authenticated"
on public.query_history
for delete
to authenticated
using (true);

