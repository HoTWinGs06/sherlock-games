-- Fix the trigger to populate username and display_name from auth metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  v_display_name := new.raw_user_meta_data ->> 'display_name';

  insert into public.profiles (id, username, display_name)
  values (new.id, v_display_name, v_display_name)
  on conflict (id) do update
    set username     = coalesce(profiles.username, excluded.username),
        display_name = coalesce(profiles.display_name, excluded.display_name);

  return new;
end;
$$;

-- Backfill all existing users whose profiles are missing username/display_name
update public.profiles
set
  display_name = coalesce(display_name, u.raw_user_meta_data ->> 'display_name'),
  username     = coalesce(username, u.raw_user_meta_data ->> 'display_name')
from auth.users u
where profiles.id = u.id
  and (profiles.username is null or profiles.display_name is null);
