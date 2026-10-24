-- Data belongs to the organizer (ADR 0004, superseding ADR 0001). Events,
-- contributors, monasteries and category templates get an `organizer_id`;
-- everything else reaches its organizer through its event. The household,
-- its membership and its setup step are removed.

-- 1. Owners, taken from the household's earliest member (V1 households have
--    one). Rows of a household with no member have no one to belong to and are deleted, events first (their
--    monastery is restricted while an event uses it).

alter table public.event add column organizer_id uuid;
alter table public.contributor add column organizer_id uuid;
alter table public.monastery add column organizer_id uuid;
alter table public.category_template add column organizer_id uuid;

create function pg_temp.household_organizer(p_household_id uuid)
returns uuid
language sql
stable
as $$
  select m.user_id
  from public.household_member m
  where m.household_id = p_household_id
  order by m.created_at, m.user_id
  limit 1;
$$;

update public.event set organizer_id = pg_temp.household_organizer(household_id);
update public.contributor set organizer_id = pg_temp.household_organizer(household_id);
update public.monastery set organizer_id = pg_temp.household_organizer(household_id);
update public.category_template set organizer_id = pg_temp.household_organizer(household_id);

delete from public.event where organizer_id is null;
delete from public.contributor where organizer_id is null;
delete from public.monastery where organizer_id is null;
delete from public.category_template where organizer_id is null;

-- 2. Policies, views and functions that read the household go before its
--    columns do.

drop policy "Members manage their household's events" on public.event;
drop policy "Members can add contributors to their household" on public.contributor;
drop policy "Members can delete their household's contributors" on public.contributor;
drop policy "Members can read their household's contributors" on public.contributor;
drop policy "Members can update their household's contributors" on public.contributor;
drop policy "Members manage their household's monasteries" on public.monastery;
drop policy "Members manage their household's category templates" on public.category_template;
drop policy "Members manage their events' categories" on public.category;
drop policy "Members manage their events' items" on public.item;
drop policy "Members manage their events' assignments" on public.assignment;
drop policy "Members manage their events' transactions" on public.transaction;
drop policy "Members manage their events' documents" on public.document;
drop policy "Members read their household's document files" on storage.objects;
drop policy "Members delete their household's document files" on storage.objects;
drop policy "Members upload their events' document files" on storage.objects;
drop policy "Members update their events' document files" on storage.objects;

drop view public.event_summary;
drop view public.monastery_recent;
drop view public.contributor_activity;

drop function public.create_event(uuid, date, text, uuid, text, integer, integer, text, text, text, text);
drop function public.setup_household(text, text);
drop function public.is_document_path_member(text);
drop function public.is_document_household_member(text);
drop function public.is_event_member(uuid);

-- 3. The owner columns replace the household columns.

alter table public.event
  alter column organizer_id set not null,
  alter column organizer_id set default auth.uid(),
  add foreign key (organizer_id) references auth.users (id) on delete cascade;
alter table public.contributor
  alter column organizer_id set not null,
  alter column organizer_id set default auth.uid(),
  add foreign key (organizer_id) references auth.users (id) on delete cascade;
alter table public.monastery
  alter column organizer_id set not null,
  alter column organizer_id set default auth.uid(),
  add foreign key (organizer_id) references auth.users (id) on delete cascade,
  add unique (organizer_id, id);
alter table public.category_template
  alter column organizer_id set not null,
  alter column organizer_id set default auth.uid(),
  add foreign key (organizer_id) references auth.users (id) on delete cascade;

-- An event's monastery is one of its organizer's.
alter table public.event
  add foreign key (organizer_id, monastery_id) references public.monastery (organizer_id, id) on delete restrict;

alter table public.event drop column household_id;
alter table public.contributor drop column household_id;
alter table public.monastery drop column household_id;
alter table public.category_template drop column household_id;

create index event_organizer_id_date_idx on public.event (organizer_id, date);
create index contributor_organizer_id_idx on public.contributor (organizer_id);
create index category_template_organizer_id_idx on public.category_template (organizer_id, position);

drop table public.household_member;
drop table public.household;
drop function public.is_household_member(uuid);

-- 4. Access: an organizer sees only their own rows.

-- True when the signed-in organizer owns the event. Security definer so the
-- policies on event's children don't each re-check event's own policy.
create function public.owns_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event e
    where e.id = p_event_id
      and e.organizer_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_event(uuid) from public, anon;
grant execute on function public.owns_event(uuid) to authenticated;

create policy "Organizers manage their events"
  on public.event for all
  to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));

create policy "Organizers manage their contributors"
  on public.contributor for all
  to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));

create policy "Organizers manage their monasteries"
  on public.monastery for all
  to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));

create policy "Organizers manage their category templates"
  on public.category_template for all
  to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));

create policy "Organizers manage their events' categories"
  on public.category for all
  to authenticated
  using ((select public.owns_event(event_id)))
  with check ((select public.owns_event(event_id)));

create policy "Organizers manage their events' items"
  on public.item for all
  to authenticated
  using ((select public.owns_event(event_id)))
  with check ((select public.owns_event(event_id)));

-- The contributor must be one of the event's organizer's, so no one assigns
-- a stranger.
create policy "Organizers manage their events' assignments"
  on public.assignment for all
  to authenticated
  using ((select public.owns_event(event_id)))
  with check (
    (select public.owns_event(event_id))
    and exists (
      select 1
      from public.contributor c
      join public.event e on e.organizer_id = c.organizer_id
      where c.id = assignment.contributor_id
        and e.id = assignment.event_id
    )
  );

-- A linked contributor must be one of the event's organizer's.
create policy "Organizers manage their events' transactions"
  on public.transaction for all
  to authenticated
  using ((select public.owns_event(event_id)))
  with check (
    (select public.owns_event(event_id))
    and (
      contributor_id is null
      or exists (
        select 1
        from public.contributor c
        join public.event e on e.organizer_id = c.organizer_id
        where c.id = transaction.contributor_id
          and e.id = transaction.event_id
      )
    )
  );

-- The file must sit in the event's own folder, `<first folder>/<event_id>/`.
-- Who may store or read a file there is up to the storage policies below.
create policy "Organizers manage their events' documents"
  on public.document for all
  to authenticated
  using ((select public.owns_event(event_id)))
  with check (
    (select public.owns_event(event_id))
    and array_length(storage.foldername(storage_path), 1) = 2
    and (storage.foldername(storage_path))[2] = event_id::text
  );

-- 5. Document files live at `<organizer_id>/<event_id>/<file>`. The first
--    folder alone decides who reads or deletes a file, so files whose event
--    is already deleted can still be cleaned up. Files stored before this
--    migration, under `<household_id>/`, are read through their document's
--    event.

-- True when the object is the signed-in organizer's, by folder or, for files
-- stored before this migration, by its document's event.
create function public.owns_document_file(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (storage.foldername(p_name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.document d
      join public.event e on e.id = d.event_id
      where d.storage_path = p_name
        and e.organizer_id = (select auth.uid())
    );
$$;

-- True when an object path is `<organizer_id>/<event_id>/<file>` for one of
-- the signed-in organizer's events.
create function public.is_own_event_folder(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event e
    where array_length(storage.foldername(p_name), 1) = 2
      and (storage.foldername(p_name))[1] = (select auth.uid())::text
      and e.id::text = (storage.foldername(p_name))[2]
      and e.organizer_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_document_file(text) from public, anon;
grant execute on function public.owns_document_file(text) to authenticated;
revoke execute on function public.is_own_event_folder(text) from public, anon;
grant execute on function public.is_own_event_folder(text) to authenticated;

create policy "Organizers read their document files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' and (select public.owns_document_file(name)));

create policy "Organizers delete their document files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and (select public.owns_document_file(name)));

create policy "Organizers upload their events' document files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and (select public.is_own_event_folder(name)));

create policy "Organizers update their events' document files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'documents' and (select public.is_own_event_folder(name)))
  with check (bucket_id = 'documents' and (select public.is_own_event_folder(name)));

-- 6. Views, as before without the household.

create view public.event_summary
with (security_invoker = true)
as
select
  e.id,
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
    count(*) filter (where s.status = 'unassigned')::integer as unassigned_count,
    count(*) filter (where s.status = 'pending')::integer as pending_count,
    count(*) filter (where s.status = 'partial')::integer as partial_count,
    count(*) filter (where s.status = 'confirmed')::integer as confirmed_count,
    count(*) filter (where s.status = 'received')::integer as received_count
  from public.item_status s
  where s.event_id = e.id
) c;

revoke all on public.event_summary from anon;
grant select on public.event_summary to authenticated;

-- The organizer's monasteries that aren't archived, most recently used first.
create view public.monastery_recent
with (security_invoker = true)
as
select
  m.id,
  m.name,
  greatest(m.created_at, max(e.created_at)) as last_used_at
from public.monastery m
left join public.event e on e.monastery_id = m.id
where m.archived_at is null
group by m.id;

revoke all on public.monastery_recent from anon;
grant select on public.monastery_recent to authenticated;

create view public.contributor_activity
with (security_invoker = true)
as
select
  c.id as contributor_id,
  count(a.id) filter (
    where a.status = 'pending' and e.date >= (now() at time zone 'Asia/Colombo')::date
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

-- 7. Creating and copying events. The new event belongs to the signed-in
--    organizer (the column's default) and starts with their category
--    templates.

create function public.create_event(
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
set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  insert into public.event (
    date, meal, monastery_id, host, monk_count, layperson_count,
    organizer_name, organizer_phone, notes, instructions
  ) values (
    p_date, p_meal, p_monastery_id, nullif(trim(p_host), ''),
    p_monk_count, p_layperson_count,
    nullif(trim(p_organizer_name), ''), nullif(trim(p_organizer_phone), ''),
    nullif(trim(p_notes), ''), nullif(trim(p_instructions), '')
  )
  returning id into v_event_id;

  insert into public.category (event_id, name, position)
  select v_event_id, t.name, t.position
  from public.category_template t
  where t.organizer_id = (select auth.uid())
  order by t.position;

  return v_event_id;
end;
$$;

revoke execute on function public.create_event(date, text, uuid, text, integer, integer, text, text, text, text) from public, anon;
grant execute on function public.create_event(date, text, uuid, text, integer, integer, text, text, text, text) to authenticated;

create or replace function public.copy_event(
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
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_category record;
  v_category_id uuid;
  v_item record;
  v_item_id uuid;
begin
  -- Copies keep the source's order: rows sort by (position, created_at), and
  -- now() is the same for the whole transaction, so each copied row takes
  -- clock_timestamp() instead.
  if not exists (select 1 from public.event e where e.id = p_source_event_id) then
    raise exception 'Event % not found', p_source_event_id using errcode = 'no_data_found';
  end if;

  insert into public.event (
    date, meal, monastery_id, host, monk_count, layperson_count,
    organizer_name, organizer_phone, notes, instructions
  ) values (
    p_date, p_meal, p_monastery_id, nullif(trim(p_host), ''),
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

-- 8. Default category templates. A new organizer gets them as soon as their
--    user is created; organizers who have none get them now.

create function public.add_default_category_templates(p_organizer_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.category_template (organizer_id, name, position)
  select p_organizer_id, t.name, t.position
  from unnest(array[
    'බත්', 'හොදි', 'ව්‍යංජන', 'පලතුරු', 'කැවිලි හා අතුරුපස', 'පාන', 'වෙනත් ආහාර', 'පිරිකර', 'ඖෂධ'
  ]) with ordinality as t (name, position);
$$;

revoke execute on function public.add_default_category_templates(uuid) from public, anon, authenticated;

create function public.give_new_organizer_default_category_templates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.add_default_category_templates(new.id);
  return new;
end;
$$;

revoke execute on function public.give_new_organizer_default_category_templates() from public, anon, authenticated;

create trigger give_new_organizer_default_category_templates
  after insert on auth.users
  for each row execute function public.give_new_organizer_default_category_templates();

select public.add_default_category_templates(u.id)
from auth.users u
where not exists (select 1 from public.category_template t where t.organizer_id = u.id);
