-- Contributor activity (ticket #11): the counts on the directory and the
-- contributor page. Cancelled events never count.
--   pending_count  pending assignments in upcoming events (whom to follow up with)
--   events_helped  events with at least one confirmed or received assignment
--   items_brought  received assignments
create view public.contributor_activity
with (security_invoker = true)
as
select
  c.id as contributor_id,
  c.household_id,
  count(a.id) filter (
    where a.status = 'pending'
      and e.date >= (now() at time zone 'Asia/Colombo')::date
  ) as pending_count,
  count(distinct a.event_id) filter (where a.status in ('confirmed', 'received')) as events_helped,
  count(a.id) filter (where a.status = 'received') as items_brought
from public.contributor c
left join (
  public.assignment a
  join public.event e on e.id = a.event_id and e.cancelled_at is null
) on a.contributor_id = c.id
group by c.id;

revoke all on public.contributor_activity from anon;
grant select on public.contributor_activity to authenticated;
