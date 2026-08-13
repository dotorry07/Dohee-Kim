alter table public.users
  add column if not exists student_number text;

create unique index if not exists users_student_number_unique
  on public.users(student_number)
  where student_number is not null;
