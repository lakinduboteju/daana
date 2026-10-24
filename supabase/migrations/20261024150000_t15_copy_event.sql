-- Copy a previous event (ticket #15).
--
-- Creates a new event from the form's fields and copies the source event's
-- menu into it: categories, items (with quantities and units) and assignments,
-- every assignment reset to pending. The source's date is never copied (the
-- form asks for a new one), and nothing else is copied: money records and
-- documents stay with the source. Assignments of archived contributors are
-- left out, since an archived contributor can't be picked for a new event.
--
-- Security invoker: row-level security decides whether the organizer can read
-- the source and write the copy, so a foreign or missing source copies nothing
-- and raises.
create function public.copy_event(
  p_source_event_id uuid,
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
  v_household_id uuid;
  v_event_id uuid;
  v_category record;
  v_category_id uuid;
  v_item record;
  v_item_id uuid;
begin
  -- Copies keep the source's order: rows sort by (position, created_at), and
  -- now() is the same for the whole transaction, so each copied row takes
  -- clock_timestamp() instead.
  select e.household_id into v_household_id
  from public.event e
  where e.id = p_source_event_id;

  if v_household_id is null then
    raise exception 'Event % not found', p_source_event_id using errcode = 'no_data_found';
  end if;

  insert into public.event (
    household_id, date, meal, monastery_id, host, monk_count, layperson_count,
    organizer_name, organizer_phone, notes, instructions
  ) values (
    v_household_id, p_date, p_meal, p_monastery_id, nullif(trim(p_host), ''),
    p_monk_count, p_layperson_count,
    nullif(trim(p_organizer_name), ''), nullif(trim(p_organizer_phone), ''),
    nullif(trim(p_notes), ''), nullif(trim(p_instructions), '')
  )
  returning id into v_event_id;

  for v_category in
    select c.id, c.name, c.position
    from public.category c
    where c.event_id = p_source_event_id
    order by c.position, c.created_at
  loop
    insert into public.category (event_id, name, position, created_at)
    values (v_event_id, v_category.name, v_category.position, clock_timestamp())
    returning id into v_category_id;

    for v_item in
      select i.id, i.name, i.required_quantity, i.unit, i.custom_unit, i.notes, i.position
      from public.item i
      where i.category_id = v_category.id
      order by i.position, i.created_at
    loop
      insert into public.item (
        event_id, category_id, name, required_quantity, unit, custom_unit, notes, position, created_at
      ) values (
        v_event_id, v_category_id, v_item.name, v_item.required_quantity,
        v_item.unit, v_item.custom_unit, v_item.notes, v_item.position, clock_timestamp()
      )
      returning id into v_item_id;

      -- Volatile clock_timestamp() is evaluated after the sort, in order.
      insert into public.assignment (event_id, item_id, contributor_id, quantity, status, created_at)
      select v_event_id, v_item_id, a.contributor_id, a.quantity, 'pending', clock_timestamp()
      from public.assignment a
      join public.contributor co on co.id = a.contributor_id
      where a.item_id = v_item.id
        and co.archived_at is null
      order by a.created_at;
    end loop;
  end loop;

  return v_event_id;
end;
$$;

revoke execute on function public.copy_event(uuid, date, text, uuid, text, integer, integer, text, text, text, text) from public, anon;
grant execute on function public.copy_event(uuid, date, text, uuid, text, integer, integer, text, text, text, text) to authenticated;
