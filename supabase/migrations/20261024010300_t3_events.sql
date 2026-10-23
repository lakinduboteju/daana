-- Monasteries, category templates, events and their categories (ticket #3).
-- Every row belongs to a household, directly or through its event (ADR 0001).

create table public.monastery (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  location text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  -- Lets event reference (household_id, monastery_id) so an event's monastery
  -- is always in the event's own household.
  unique (household_id, id)
);

create table public.category_template (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  position integer not null,
  created_at timestamptz not null default now()
);

create index category_template_household_id_idx on public.category_template (household_id, position);

create table public.event (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id) on delete cascade,
  date date not null,
  meal text not null check (meal in ('breakfast', 'lunch')),
  monastery_id uuid not null,
  host text check (host is null or length(trim(host)) > 0),
  monk_count integer not null default 0 check (monk_count >= 0),
  layperson_count integer not null default 0 check (layperson_count >= 0),
  organizer_name text,
  organizer_phone text,
  notes text,
  instructions text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  -- A referenced monastery can't be deleted; the app archives it instead.
  foreign key (household_id, monastery_id) references public.monastery (household_id, id) on delete restrict
);

create index event_household_id_date_idx on public.event (household_id, date);
create index event_monastery_id_idx on public.event (monastery_id);

create table public.category (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.event (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  position integer not null,
  created_at timestamptz not null default now()
);

create index category_event_id_idx on public.category (event_id, position);

-- True when the signed-in organizer is a member of the event's household.
-- Row-level security for every event-owned table (categories, items, …) uses this.
create function public.is_event_member(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event e
    join public.household_member m on m.household_id = e.household_id
    where e.id = p_event_id
      and m.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_event_member(uuid) from public, anon;
grant execute on function public.is_event_member(uuid) to authenticated;

alter table public.monastery enable row level security;
alter table public.category_template enable row level security;
alter table public.event enable row level security;
alter table public.category enable row level security;

create policy "Members manage their household's monasteries"
  on public.monastery for all
  to authenticated
  using ((select public.is_household_member(household_id)))
  with check ((select public.is_household_member(household_id)));

create policy "Members manage their household's category templates"
  on public.category_template for all
  to authenticated
  using ((select public.is_household_member(household_id)))
  with check ((select public.is_household_member(household_id)));

create policy "Members manage their household's events"
  on public.event for all
  to authenticated
  using ((select public.is_household_member(household_id)))
  with check ((select public.is_household_member(household_id)));

create policy "Members manage their events' categories"
  on public.category for all
  to authenticated
  using ((select public.is_event_member(event_id)))
  with check ((select public.is_event_member(event_id)));

revoke all on public.monastery, public.category_template, public.event, public.category from anon;
grant select, insert, update, delete
  on public.monastery, public.category_template, public.event, public.category
  to authenticated;

-- An event with what the app shows about it but never calculates itself.
-- Upcoming or past uses today's date in Sri Lanka. Later tickets add item counts.
create view public.event_summary
with (security_invoker = true)
as
select
  e.id,
  e.household_id,
  e.date,
  e.meal,
  e.host,
  e.monk_count,
  e.layperson_count,
  e.cancelled_at,
  e.created_at,
  e.monastery_id,
  m.name as monastery_name,
  m.location as monastery_location,
  e.date - (now() at time zone 'Asia/Colombo')::date as days_away,
  e.date < (now() at time zone 'Asia/Colombo')::date as is_past
from public.event e
join public.monastery m on m.id = e.monastery_id;

revoke all on public.event_summary from anon;
grant select on public.event_summary to authenticated;

-- The household's monasteries that aren't archived, most recently used first.
create view public.monastery_recent
with (security_invoker = true)
as
select
  m.id,
  m.household_id,
  m.name,
  m.location,
  greatest(m.created_at, max(e.created_at)) as last_used_at
from public.monastery m
left join public.event e on e.monastery_id = m.id
where m.archived_at is null
group by m.id;

revoke all on public.monastery_recent from anon;
grant select on public.monastery_recent to authenticated;

-- Creates an event and copies the household's category templates into its
-- categories, in one transaction. Runs as the organizer, so row-level
-- security applies. Returns the new event's id.
create function public.create_event(
  p_household_id uuid,
  p_date date,
  p_meal text,
  p_monastery_id uuid,
  p_host text,
  p_monk_count integer,
  p_layperson_count integer,
  p_organizer_name text default null,
  p_organizer_phone text default null,
  p_notes text default null,
  p_instructions text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  insert into public.event (
    household_id, date, meal, monastery_id, host, monk_count, layperson_count,
    organizer_name, organizer_phone, notes, instructions
  ) values (
    p_household_id, p_date, p_meal, p_monastery_id, nullif(trim(p_host), ''),
    p_monk_count, p_layperson_count,
    nullif(trim(p_organizer_name), ''), nullif(trim(p_organizer_phone), ''),
    nullif(trim(p_notes), ''), nullif(trim(p_instructions), '')
  )
  returning id into v_event_id;

  insert into public.category (event_id, name, position)
  select v_event_id, t.name, t.position
  from public.category_template t
  where t.household_id = p_household_id
  order by t.position;

  return v_event_id;
end;
$$;

revoke execute on function public.create_event(uuid, date, text, uuid, text, integer, integer, text, text, text, text) from public, anon;
grant execute on function public.create_event(uuid, date, text, uuid, text, integer, integer, text, text, text, text) to authenticated;

-- Household setup now also adds the nine default category templates.
create or replace function public.setup_household(p_name text, p_username text)
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

  insert into public.category_template (household_id, name, position)
  select v_household_id, t.name, t.position
  from unnest(array[
    'බත්', 'හොදි', 'ව්‍යංජන', 'පලතුරු', 'කැවිලි හා අතුරුපස', 'පාන', 'වෙනත් ආහාර', 'පිරිකර', 'ඖෂධ'
  ]) with ordinality as t (name, position);

  return v_household_id;
end;
$$;

-- Households set up before this migration get the default templates too.
insert into public.category_template (household_id, name, position)
select h.id, t.name, t.position
from public.household h
cross join unnest(array[
  'බත්', 'හොදි', 'ව්‍යංජන', 'පලතුරු', 'කැවිලි හා අතුරුපස', 'පාන', 'වෙනත් ආහාර', 'පිරිකර', 'ඖෂධ'
]) with ordinality as t (name, position)
where not exists (select 1 from public.category_template c where c.household_id = h.id);
