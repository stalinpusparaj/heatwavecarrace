-- Supabase/PostgreSQL. Prepared migration; not yet applied to a database.
-- All access is through the trusted match service. No client table access.
begin;
create table public.runroad_crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 24),
  wins bigint not null default 0 check (wins >= 0),
  supplies bigint not null default 0 check (supplies >= 0),
  rescues bigint not null default 0 check (rescues >= 0),
  created_at timestamptz not null default now()
);
create table public.runroad_crew_members (
  account_id uuid primary key references auth.users(id) on delete cascade,
  crew_id uuid not null references public.runroad_crews(id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index runroad_crew_members_crew on public.runroad_crew_members(crew_id);
create table public.runroad_crew_results (
  crew_id uuid not null references public.runroad_crews(id) on delete cascade,
  match_id text not null check (match_id ~ '^[a-f0-9]{32}$'),
  recorded_at timestamptz not null default now(),
  primary key (crew_id, match_id)
);
alter table public.runroad_crews enable row level security;
alter table public.runroad_crew_members enable row level security;
alter table public.runroad_crew_results enable row level security;
revoke all on public.runroad_crews, public.runroad_crew_members, public.runroad_crew_results from public, anon, authenticated;
-- At most one win per crew per match, including two drivers in the same crew.
-- Membership is resolved in this transaction, never supplied by the browser.
create function public.runroad_record_crew_win(p_match text, p_accounts uuid[], p_rescues integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare c uuid; applied integer := 0; inserted integer;
begin
  if p_match is null or p_match !~ '^[a-f0-9]{32}$' or
     cardinality(p_accounts) is distinct from 2 or p_accounts[1] is null or
     p_accounts[2] is null or p_accounts[1] = p_accounts[2] or
     p_rescues is null or p_rescues not between 0 and 1 then
    raise exception 'Invalid server result';
  end if;
  for c in select distinct crew_id from public.runroad_crew_members
    where account_id = any(p_accounts) order by crew_id loop
    insert into public.runroad_crew_results(crew_id, match_id) values(c, p_match)
      on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 1 then
      update public.runroad_crews set wins = wins + 1, supplies = supplies + 2,
        rescues = rescues + p_rescues where id = c;
      applied := applied + 1;
    end if;
  end loop;
  return applied;
end $$;
revoke all on function public.runroad_record_crew_win(text, uuid[], integer) from public, anon, authenticated;
grant execute on function public.runroad_record_crew_win(text, uuid[], integer) to service_role;
grant select, insert, update, delete on public.runroad_crews, public.runroad_crew_members, public.runroad_crew_results to service_role;
commit;
