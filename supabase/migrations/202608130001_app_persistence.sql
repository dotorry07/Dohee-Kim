create table if not exists public.notice_reads (
  user_id uuid not null references public.users(id) on delete cascade,
  notice_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notice_id)
);

create table if not exists public.board_recommendations (
  post_id uuid not null references public.board_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.board_post_images (
  post_id uuid primary key references public.board_posts(id) on delete cascade,
  name text not null,
  data_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.board_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in ('freshman', 'free', 'department', 'info')),
  title text not null default '',
  content text not null default '',
  image jsonb,
  saved_at timestamptz not null default now()
);

create table if not exists public.user_rate_limits (
  user_id uuid not null references public.users(id) on delete cascade,
  action_key text not null,
  last_action_at timestamptz not null default now(),
  primary key (user_id, action_key)
);

create table if not exists public.timetable_preferences (
  user_id uuid not null references public.users(id) on delete cascade,
  preference_key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, preference_key)
);

create table if not exists public.academic_events (
  id text primary key,
  title text not null,
  start_date date not null,
  end_date date,
  display_date text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.campus_meals (
  id text primary key,
  campus text not null check (campus in ('sujeong', 'unjeong')),
  cafeteria text not null,
  hours text not null,
  price text not null,
  menus_by_day jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.notice_reads enable row level security;
alter table public.board_recommendations enable row level security;
alter table public.board_post_images enable row level security;
alter table public.board_drafts enable row level security;
alter table public.user_rate_limits enable row level security;
alter table public.timetable_preferences enable row level security;
alter table public.academic_events enable row level security;
alter table public.campus_meals enable row level security;

create index if not exists board_posts_created_at_idx on public.board_posts(created_at desc);
create index if not exists comments_post_id_created_at_idx on public.comments(post_id, created_at);
create index if not exists board_recommendations_user_id_idx on public.board_recommendations(user_id);
create index if not exists board_drafts_user_id_saved_at_idx on public.board_drafts(user_id, saved_at desc);
create index if not exists notice_reads_user_id_idx on public.notice_reads(user_id);

drop policy if exists "Public can read normalized board posts" on public.board_posts;
create policy "Public can read normalized board posts"
on public.board_posts for select
to anon, authenticated
using (true);

drop policy if exists "Public can read normalized comments" on public.comments;
create policy "Public can read normalized comments"
on public.comments for select
to anon, authenticated
using (true);

drop policy if exists "Public can read board recommendations" on public.board_recommendations;
create policy "Public can read board recommendations"
on public.board_recommendations for select
to anon, authenticated
using (true);

drop policy if exists "Public can read board post images" on public.board_post_images;
create policy "Public can read board post images"
on public.board_post_images for select
to anon, authenticated
using (true);

drop policy if exists "Public can read academic events" on public.academic_events;
create policy "Public can read academic events"
on public.academic_events for select
to anon, authenticated
using (true);

drop policy if exists "Public can read campus meals" on public.campus_meals;
create policy "Public can read campus meals"
on public.campus_meals for select
to anon, authenticated
using (true);
