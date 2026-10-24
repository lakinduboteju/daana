-- Monastery is a name. Location is no longer stored (#20).
-- Views are dropped and recreated because a column cannot be removed with
-- CREATE OR REPLACE VIEW.

drop view public.event_summary;
drop view public.monastery_recent;

alter table public.monastery drop column location;

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
  greatest(m.created_at, max(e.created_at)) as last_used_at
from public.monastery m
left join public.event e on e.monastery_id = m.id
where m.archived_at is null
group by m.id;

revoke all on public.monastery_recent from anon;
grant select on public.monastery_recent to authenticated;
