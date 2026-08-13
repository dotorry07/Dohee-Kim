alter table public.class_schedules
  add column if not exists credits text;

update public.class_schedules
set credits = trim(split_part(trim(split_part(memo, '·', array_length(string_to_array(memo, '·'), 1))), '/', 1))
where credits is null
  and memo is not null
  and trim(split_part(memo, '·', array_length(string_to_array(memo, '·'), 1))) ~ '^[0-9]+([.][0-9]+)?(/[0-9]+([.][0-9]+)?){0,2}(학점)?$';
