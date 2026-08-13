create extension if not exists "pgcrypto";

alter table public.users
  add column if not exists secondary_department text,
  add column if not exists student_number text;

create unique index if not exists users_student_number_unique
  on public.users(student_number)
  where student_number is not null;

insert into public.users (
  id,
  auth_user_id,
  email,
  name,
  nickname,
  department,
  secondary_department,
  student_number,
  grade,
  role,
  created_at
)
values (
  '00000000-0000-4000-8000-000000000001',
  null,
  'freshman@sungshin.ac.kr',
  '김새내',
  '새내기',
  '컴퓨터공학과',
  '',
  null,
  1,
  'user',
  '2026-03-01T09:00:00.000Z'
)
on conflict (email) do update
set
  name = excluded.name,
  nickname = excluded.nickname,
  department = excluded.department,
  secondary_department = excluded.secondary_department,
  student_number = excluded.student_number,
  grade = excluded.grade,
  role = excluded.role;

insert into public.user_password_credentials (
  user_id,
  password_hash,
  hash_algorithm,
  password_updated_at,
  must_reset_password
)
select
  id,
  crypt('password123', gen_salt('bf', 10)),
  'bcrypt',
  now(),
  false
from public.users
where email = 'freshman@sungshin.ac.kr'
on conflict (user_id) do update
set
  password_hash = excluded.password_hash,
  hash_algorithm = excluded.hash_algorithm,
  password_updated_at = excluded.password_updated_at,
  must_reset_password = excluded.must_reset_password,
  updated_at = now();
