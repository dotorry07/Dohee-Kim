create table if not exists public.board_state (
  id text primary key,
  posts jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.board_state enable row level security;

drop policy if exists "Board state is publicly readable" on public.board_state;
create policy "Board state is publicly readable"
on public.board_state
for select
to anon, authenticated
using (true);

drop policy if exists "Board state is publicly insertable" on public.board_state;
create policy "Board state is publicly insertable"
on public.board_state
for insert
to anon, authenticated
with check (id = 'default');

drop policy if exists "Board state is publicly updatable" on public.board_state;
create policy "Board state is publicly updatable"
on public.board_state
for update
to anon, authenticated
using (id = 'default')
with check (id = 'default');
