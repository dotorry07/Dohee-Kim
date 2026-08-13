alter table public.class_schedules
  add column if not exists lesson_type_name text;

update public.class_schedules
set lesson_type_name = '원격'
where lesson_type_name is null
  and (
    replace(coalesce(building_name, ''), ' ', '') like '%원격%'
    or replace(coalesce(room_name, ''), ' ', '') like '%원격%'
    or replace(coalesce(memo, ''), ' ', '') like '%원격%'
  );
