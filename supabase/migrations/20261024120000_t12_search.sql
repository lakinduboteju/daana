-- Global search across all of the household's events (ticket #12).

-- Items whose name, contributors' names, monastery or host contain `p_q`
-- (ignoring English capital letters; Sinhala matches as typed), in events
-- dated `p_from`..`p_to` (inclusive), whose status from item_status is one of
-- `p_statuses`, at `p_monastery_id`, assigned to `p_contributor_id`. A null
-- criterion matches everything. In event order, then
-- menu order.
-- Security invoker: row-level security keeps it to the caller's household.
create function public.search_items(
  p_q text default null,
  p_from date default null,
  p_to date default null,
  p_statuses text[] default null,
  p_monastery_id uuid default null,
  p_contributor_id uuid default null
)
returns table (
  item_id uuid,
  item_name text,
  required_quantity numeric,
  unit text,
  custom_unit text,
  status text,
  -- Oldest assignment first.
  contributor_names text[],
  event_id uuid,
  event_date date,
  meal text,
  host text,
  monastery_name text,
  cancelled_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with term as (
    select '%' || replace(replace(replace(btrim(p_q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
    where nullif(btrim(p_q), '') is not null
  ),
  names as (
    select a.item_id, array_agg(c.name order by a.created_at) as contributor_names
    from public.assignment a
    join public.contributor c on c.id = a.contributor_id
    group by a.item_id
  )
  select
    i.id,
    i.name,
    i.required_quantity,
    i.unit,
    i.custom_unit,
    s.status,
    coalesce(n.contributor_names, '{}'),
    e.id,
    e.date,
    e.meal,
    e.host,
    m.name,
    e.cancelled_at
  from public.item i
  join public.item_status s on s.item_id = i.id
  join public.category cat on cat.id = i.category_id
  join public.event e on e.id = i.event_id
  join public.monastery m on m.id = e.monastery_id
  left join names n on n.item_id = i.id
  where (p_from is null or e.date >= p_from)
    and (p_to is null or e.date <= p_to)
    and (p_statuses is null or s.status = any (p_statuses))
    and (p_monastery_id is null or e.monastery_id = p_monastery_id)
    and (
      p_contributor_id is null
      or exists (select 1 from public.assignment a where a.item_id = i.id and a.contributor_id = p_contributor_id)
    )
    and (
      not exists (select 1 from term)
      or exists (
        select 1 from term t
        where i.name ilike t.pattern
          or m.name ilike t.pattern
          or e.host ilike t.pattern
          or exists (select 1 from unnest(n.contributor_names) as cn(name) where cn.name ilike t.pattern)
      )
    )
  order by e.date, e.meal, e.created_at, cat.position, cat.created_at, i.position, i.created_at
$$;

revoke all on function public.search_items from public, anon;
grant execute on function public.search_items to authenticated;
