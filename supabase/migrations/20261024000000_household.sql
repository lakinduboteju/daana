-- A household owns all data (ADR 0001). Organizers are members of a household.

create table public.household (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.household_member (
  household_id uuid not null references public.household (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_member_user_id_idx on public.household_member (user_id);

-- True when the signed-in organizer is a member of the household.
-- Every household-owned table's row-level security policy uses this.
-- Security definer so policies on household_member don't recurse.
create function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_member m
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_household_member(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;

alter table public.household enable row level security;
alter table public.household_member enable row level security;

create policy "Members can read their household"
  on public.household for select
  to authenticated
  using ((select public.is_household_member(id)));

create policy "Members can read their household's members"
  on public.household_member for select
  to authenticated
  using ((select public.is_household_member(household_id)));

revoke all on public.household, public.household_member from anon;
grant select on public.household, public.household_member to authenticated;

-- One-time household setup (ADR 0002): the organizer's auth user
-- `<username>@daana.local` must already exist. Creates the household and
-- links the organizer to it. Returns the new household's id.
-- Run as the database owner (SQL editor or psql); not callable from the app.
create function public.setup_household(p_name text, p_username text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
begin
  select u.id into v_user_id
  from auth.users u
  where u.email = lower(p_username) || '@daana.local';

  if v_user_id is null then
    raise exception 'No auth user %@daana.local. Create it first (Authentication > Users, email confirmed).', lower(p_username);
  end if;

  insert into public.household (name) values (p_name)
  returning id into v_household_id;

  insert into public.household_member (household_id, user_id)
  values (v_household_id, v_user_id);

  return v_household_id;
end;
$$;

revoke execute on function public.setup_household(text, text) from public, anon, authenticated;
grant execute on function public.setup_household(text, text) to service_role;
