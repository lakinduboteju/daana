-- Event progress (#9): item counts per item status on event_summary.
-- Ready = confirmed + received. Needs attention = unassigned + pending, and
-- short = partial, both only for upcoming events that aren't cancelled
-- (0 otherwise). Columns are appended so earlier ones keep their positions.
create or replace view public.event_summary
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
  e.date < (now() at time zone 'Asia/Colombo')::date as is_past,
  c.item_count,
  c.unassigned_count,
  c.pending_count,
  c.partial_count,
  c.confirmed_count,
  c.received_count,
  c.confirmed_count + c.received_count as ready_count,
  case
    when e.cancelled_at is null and e.date >= (now() at time zone 'Asia/Colombo')::date
      then c.unassigned_count + c.pending_count
    else 0
  end as attention_count,
  case
    when e.cancelled_at is null and e.date >= (now() at time zone 'Asia/Colombo')::date
      then c.partial_count
    else 0
  end as short_count
from public.event e
join public.monastery m on m.id = e.monastery_id
cross join lateral (
  select
    count(*)::integer as item_count,
    (count(*) filter (where s.status = 'unassigned'))::integer as unassigned_count,
    (count(*) filter (where s.status = 'pending'))::integer as pending_count,
    (count(*) filter (where s.status = 'partial'))::integer as partial_count,
    (count(*) filter (where s.status = 'confirmed'))::integer as confirmed_count,
    (count(*) filter (where s.status = 'received'))::integer as received_count
  from public.item_status s
  where s.event_id = e.id
) c;
