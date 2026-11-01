insert into public.admins (id, secret_key)
select id, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
from auth.users
where email = 'nishantyadawad007@gmail.com'
on conflict (id) do update set secret_key = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

create policy "admins read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.admins
      where admins.id = auth.uid()
    )
  );
