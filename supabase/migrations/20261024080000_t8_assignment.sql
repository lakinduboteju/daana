-- Assignments and item status (ticket #8).

-- Lets assignment reference (event_id, item_id) so an assignment's item is
-- always in the assignment's own event.
alter table public.item add constraint item_event_id_id_key unique (event_id, id);

create table public.assignment (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.event (id) on delete cascade,
  item_id uuid not null,
  -- No cascade: a contributor with assignments can't be deleted, so
  -- remove_contributor archives them instead and history stays.
  contributor_id uuid not null references public.contributor (id) on delete restrict,
  quantity numeric check (quantity is null or quantity > 0),
  -- A new assignment is always pending: adding a name is never agreement.
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'received')),
  created_at timestamptz not null default now(),
  -- Deleting an item deletes its assignments.
  foreign key (event_id, item_id) references public.item (event_id, id) on delete cascade
);

create index assignment_item_id_idx on public.assignment (item_id, created_at);
create index assignment_event_id_idx on public.assignment (event_id);
create index assignment_contributor_id_idx on public.assignment (contributor_id);

alter table public.assignment enable row level security;

-- Through the item's event to the household. The contributor must be one the
-- organizer can see (their own household's), so no one assigns a stranger.
create policy "Members manage their events' assignments"
  on public.assignment for all
  to authenticated
  using ((select public.is_event_member(event_id)))
  with check (
    (select public.is_event_member(event_id))
    and exists (
      select 1
      from public.contributor c
      join public.event e on e.household_id = c.household_id
      where c.id = contributor_id and e.id = event_id
    )
  );

revoke all on public.assignment from anon;
grant select, insert, update, delete on public.assignment to authenticated;

-- Item status, worked out from the item's assignments (never set by hand):
--   unassigned  no assignments
--   received    every assignment received
--   confirmed   every assignment confirmed or received, and no shortfall
--   pending     no assignment confirmed or received
--   partial     otherwise
-- Shortfall = required quantity − confirmed quantity (confirmed + received).
-- It counts only when the required quantity is set and every confirmed or
-- received assignment has a quantity; otherwise it's null (unknown).
create view public.item_status
with (security_invoker = true)
as
with totals as (
  select
    i.id as item_id,
    i.event_id,
    i.category_id,
    i.required_quantity,
    count(a.id) as assignment_count,
    count(a.id) filter (where a.status = 'received') as received_count,
    count(a.id) filter (where a.status in ('confirmed', 'received')) as confirmed_count,
    coalesce(sum(a.quantity) filter (where a.status in ('confirmed', 'received')), 0) as confirmed_quantity,
    count(a.id) filter (where a.status in ('confirmed', 'received') and a.quantity is null) as confirmed_without_quantity
  from public.item i
  left join public.assignment a on a.item_id = i.id
  group by i.id
),
shortfalls as (
  select
    t.*,
    case
      when t.required_quantity is not null and t.confirmed_without_quantity = 0
        then greatest(t.required_quantity - t.confirmed_quantity, 0)
    end as shortfall
  from totals t
)
select
  item_id,
  event_id,
  category_id,
  case
    when assignment_count = 0 then 'unassigned'
    when received_count = assignment_count then 'received'
    when confirmed_count = assignment_count and coalesce(shortfall, 0) = 0 then 'confirmed'
    when confirmed_count = 0 then 'pending'
    else 'partial'
  end as status,
  assignment_count,
  confirmed_quantity,
  shortfall
from shortfalls;

grant select on public.item_status to authenticated;
revoke all on public.item_status from anon;
