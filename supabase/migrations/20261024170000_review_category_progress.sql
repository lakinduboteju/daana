-- Category progress on the menu: how many of a category's items are ready
-- (confirmed or received) out of all its items. Statuses come from item_status.

create view public.category_progress
with (security_invoker = true)
as
select
  c.id as category_id,
  c.event_id,
  count(s.item_id)::int as item_count,
  (count(s.item_id) filter (where s.status in ('confirmed', 'received')))::int as ready_count
from public.category c
left join public.item_status s on s.category_id = c.id
group by c.id;

grant select on public.category_progress to authenticated;
revoke all on public.category_progress from anon;
