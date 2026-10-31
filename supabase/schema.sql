-- ============================================================================
-- sherlock-games — Supabase schema (run in Supabase SQL Editor, once)
--
-- Three tables:
--   profiles        — one row per anonymous player: total points + tier
--   game_solves     — one solve per game per player (unique) → no double awards
--   puzzle_answers  — the sealed side: hashes / alias lists / reveal text.
--                     RLS with NO policy → unreachable from the browser;
--                     only the verify-answer edge function (service role)
--                     reads it.
--
-- The edge function + seed file pair with this: functions/verify-answer,
-- seed-answers.sql (kept local, never committed).
-- ============================================================================

-- ---------------------------------------------------------------- profiles --
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  total_points integer not null default 0,
  tier         text not null default 'Apprentice',
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- players read only their own row; writes happen server-side only
create policy "players read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- auto-create a profile row the moment an anonymous player signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------ game_solves --
create table public.game_solves (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  game_id        text not null,
  points_awarded integer not null,
  solved_at      timestamptz not null default now(),
  unique (user_id, game_id)
);

alter table public.game_solves enable row level security;

-- players can see which files they have already reconciled
create policy "players read own solves"
  on public.game_solves for select
  using (auth.uid() = user_id);

-- INSERT is deliberately left policyless: only the service role (edge
-- function) may record solves, so a player can never award themselves.

-- ---------------------------------------------------------- puzzle_answers --
create table public.puzzle_answers (
  game_id     text primary key,
  kind        text not null check (kind in ('exact', 'geo')),
  answer_hash text,        -- kind='exact': vault fingerprint(expected text)
  aliases     jsonb,       -- kind='geo':   accepted scene names
  points      integer not null,
  reveal      text not null
);

alter table public.puzzle_answers enable row level security;
-- no policies at all: browser roles (anon / authenticated) read nothing.
-- The edge function reads it with the service role only.

-- ------------------------------------------------------- atomic award rpc --
-- One round-trip, race-safe: the award happens only if the solve row was
-- freshly inserted (unique constraint). Returns the new total.
create or replace function public.award_solve(p_user uuid, p_game text, p_points integer)
returns table (newly boolean, total integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_done  boolean;
begin
  insert into public.profiles (id) values (p_user)
    on conflict (id) do nothing;

  insert into public.game_solves (user_id, game_id, points_awarded)
  values (p_user, p_game, p_points)
    on conflict (user_id, game_id) do nothing;
  v_done := found;

  if v_done then
    update public.profiles
       set total_points = total_points + p_points,
           tier = case
                    when total_points + p_points >= 200 then 'Master Sleuth'
                    when total_points + p_points >=  60 then 'Investigator'
                    else 'Apprentice'
                  end
     where id = p_user;
  end if;

  select total_points into v_total from public.profiles where id = p_user;
  return query select v_done, coalesce(v_total, 0) as total;
end;
$$;
