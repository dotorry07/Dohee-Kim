alter table public.personal_schedules
add column if not exists timetable_id uuid references public.timetables(id) on delete cascade;

create index if not exists personal_schedules_timetable_id_idx
  on public.personal_schedules(timetable_id);
