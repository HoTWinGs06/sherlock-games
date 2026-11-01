alter table public.profiles add column if not exists username text;

update public.profiles
set username = display_name
where username is null and display_name is not null;
