create table if not exists public.freshman_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_key text not null,
  label text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, item_key)
);

alter table public.freshman_checklist_items enable row level security;

create policy "Users can read their own profile"
  on public.users for select
  using (auth_user_id = auth.uid());

create policy "Users can read their own timetables"
  on public.timetables for select
  using (exists (
    select 1 from public.users
    where users.id = timetables.user_id
      and users.auth_user_id = auth.uid()
  ));

create policy "Users can read classes from their own timetables"
  on public.class_schedules for select
  using (exists (
    select 1
    from public.timetables
    join public.users on users.id = timetables.user_id
    where timetables.id = class_schedules.timetable_id
      and users.auth_user_id = auth.uid()
  ));

create policy "Users can read their own personal schedules"
  on public.personal_schedules for select
  using (exists (
    select 1 from public.users
    where users.id = personal_schedules.user_id
      and users.auth_user_id = auth.uid()
  ));

create policy "Users can read their own freshman checklist"
  on public.freshman_checklist_items for select
  using (exists (
    select 1 from public.users
    where users.id = freshman_checklist_items.user_id
      and users.auth_user_id = auth.uid()
  ));

create policy "Users can insert their own freshman checklist"
  on public.freshman_checklist_items for insert
  with check (exists (
    select 1 from public.users
    where users.id = freshman_checklist_items.user_id
      and users.auth_user_id = auth.uid()
  ));

create policy "Users can update their own freshman checklist"
  on public.freshman_checklist_items for update
  using (exists (
    select 1 from public.users
    where users.id = freshman_checklist_items.user_id
      and users.auth_user_id = auth.uid()
  ));
