create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  name text not null,
  nickname text not null,
  department text not null,
  grade integer not null check (grade between 1 and 4),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table public.timetables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  semester text not null,
  title text not null,
  is_selected boolean not null default false,
  score numeric(3, 2) not null default 0,
  created_at timestamptz not null default now()
);

create unique index timetables_one_selected_per_semester
  on public.timetables(user_id, semester)
  where is_selected;

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  grade integer not null check (grade between 1 and 4),
  course_name text not null,
  professor_name text not null,
  day_of_week text not null check (day_of_week in ('MON', 'TUE', 'WED', 'THU', 'FRI')),
  start_time text not null,
  end_time text not null,
  building_name text not null,
  room_name text not null,
  required_type text not null check (required_type in ('required', 'elective')),
  review_average numeric(2, 1) not null default 0,
  created_at timestamptz not null default now()
);

create table public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references public.timetables(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  course_name text not null,
  professor_name text not null,
  day_of_week text not null check (day_of_week in ('MON', 'TUE', 'WED', 'THU', 'FRI')),
  start_time text not null,
  end_time text not null,
  building_name text not null,
  room_name text not null,
  color text not null default '#0f766e',
  memo text
);

create table public.personal_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  day_of_week text not null check (day_of_week in ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')),
  start_time text not null,
  end_time text not null,
  memo text
);

create table public.board_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in ('freshman', 'free', 'department', 'info')),
  title text not null check (char_length(title) between 1 and 100),
  content text not null check (char_length(content) between 1 and 5000),
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_name text not null,
  professor_name text not null,
  semester text not null,
  rating integer not null check (rating between 1 and 5),
  assignment_level text not null check (assignment_level in ('low', 'medium', 'high')),
  exam_level text not null check (exam_level in ('low', 'medium', 'high')),
  attendance_type text not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, course_name, professor_name)
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('academic', 'scholarship', 'registration', 'event', 'career', 'general')),
  title text not null,
  summary text not null,
  source_url text,
  is_pinned boolean not null default false,
  published_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.campus_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('lecture', 'library', 'student', 'food', 'admin', 'facility')),
  description text not null,
  building_name text not null,
  floor text not null,
  map_x integer not null,
  map_y integer not null
);

alter table public.users enable row level security;
alter table public.timetables enable row level security;
alter table public.courses enable row level security;
alter table public.class_schedules enable row level security;
alter table public.personal_schedules enable row level security;
alter table public.board_posts enable row level security;
alter table public.comments enable row level security;
alter table public.course_reviews enable row level security;
alter table public.notices enable row level security;
alter table public.campus_places enable row level security;
