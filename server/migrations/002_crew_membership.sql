-- Apply after 001_crews.sql. Functions are callable only by the match service.
begin;
create table public.runroad_crew_invites (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  crew_id uuid not null references public.runroad_crews(id) on delete cascade,
  account_id uuid not null unique references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '24 hours')
);
alter table public.runroad_crew_invites enable row level security;
revoke all on public.runroad_crew_invites from public, anon, authenticated;
grant select, insert, update, delete on public.runroad_crew_invites to service_role;

create function public.runroad_get_crew(p_account uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('id', c.id, 'name', c.name, 'wins', c.wins,
    'supplies', c.supplies, 'rescues', c.rescues,
    'members', (select count(*) from public.runroad_crew_members where crew_id = c.id))
  from public.runroad_crews c join public.runroad_crew_members m on m.crew_id = c.id
  where m.account_id = p_account;
$$;

create function public.runroad_create_crew(p_account uuid, p_name text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c uuid;
begin
  if p_name is null or char_length(btrim(p_name)) not between 3 and 24 then
    raise exception 'Invalid crew name' using errcode = 'P0001';
  end if;
  insert into public.runroad_crews(name) values(btrim(p_name)) returning id into c;
  -- The account primary key enforces one crew even across concurrent requests.
  insert into public.runroad_crew_members(account_id, crew_id) values(p_account, c);
  return public.runroad_get_crew(p_account);
end $$;

create function public.runroad_invite_crew(p_account uuid, p_hash text)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare c uuid; expiry timestamptz;
begin
  select crew_id into c from public.runroad_crew_members where account_id = p_account;
  if c is null then raise exception 'Crew membership required' using errcode = 'P0001'; end if;
  perform 1 from public.runroad_crews where id = c for update;
  -- Recheck after acquiring the same row lock used by joins and departures.
  if not exists(select 1 from public.runroad_crew_members where account_id = p_account and crew_id = c) then
    raise exception 'Crew membership required' using errcode = 'P0001';
  end if;
  delete from public.runroad_crew_invites where account_id = p_account;
  insert into public.runroad_crew_invites(token_hash, crew_id, account_id)
    values(p_hash, c, p_account) returning expires_at into expiry;
  return expiry;
end $$;

create function public.runroad_join_crew(p_account uuid, p_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c uuid;
begin
  select crew_id into c from public.runroad_crew_invites where token_hash = p_hash and expires_at > now();
  if c is null then raise exception 'Invite unavailable' using errcode = 'P0001'; end if;
  perform 1 from public.runroad_crews where id = c for update;
  if not exists(select 1 from public.runroad_crew_invites i
    join public.runroad_crew_members m on m.account_id = i.account_id and m.crew_id = i.crew_id
    where i.token_hash = p_hash and i.crew_id = c and i.expires_at > now()) then
    raise exception 'Invite unavailable' using errcode = 'P0001';
  end if;
  if exists(select 1 from public.runroad_crew_members where account_id = p_account and crew_id = c) then
    return public.runroad_get_crew(p_account);
  end if;
  if (select count(*) from public.runroad_crew_members where crew_id = c) >= 8 then
    raise exception 'Crew is full' using errcode = 'P0001';
  end if;
  insert into public.runroad_crew_members(account_id, crew_id) values(p_account, c);
  return public.runroad_get_crew(p_account);
end $$;

create function public.runroad_leave_crew(p_account uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare c uuid;
begin
  select crew_id into c from public.runroad_crew_members where account_id = p_account;
  if c is null then return; end if;
  perform 1 from public.runroad_crews where id = c for update;
  delete from public.runroad_crew_invites where account_id = p_account;
  delete from public.runroad_crew_members where account_id = p_account and crew_id = c;
  -- Preserve a shared garage while members remain; clean up abandoned crews.
  delete from public.runroad_crews where id = c and not exists(
    select 1 from public.runroad_crew_members where crew_id = c);
end $$;

revoke all on function public.runroad_get_crew(uuid), public.runroad_create_crew(uuid,text),
  public.runroad_invite_crew(uuid,text), public.runroad_join_crew(uuid,text), public.runroad_leave_crew(uuid)
  from public, anon, authenticated;
grant execute on function public.runroad_get_crew(uuid), public.runroad_create_crew(uuid,text),
  public.runroad_invite_crew(uuid,text), public.runroad_join_crew(uuid,text), public.runroad_leave_crew(uuid)
  to service_role;
commit;
