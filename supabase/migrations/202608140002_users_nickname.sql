alter table public.users
  add column if not exists users_nickname text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'nickname'
  ) then
    update public.users
    set users_nickname = coalesce(users_nickname, nickname)
    where users_nickname is null;
  end if;
end $$;
