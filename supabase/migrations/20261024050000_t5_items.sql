-- Items: what's offered at an event, under one of its categories (ticket #5).

-- Lets item reference (event_id, category_id) so an item's category is always
-- in the item's own event.
alter table public.category add constraint category_event_id_id_key unique (event_id, id);

create table public.item (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.event (id) on delete cascade,
  category_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  required_quantity numeric check (required_quantity is null or required_quantity > 0),
  unit text not null default 'pieces' check (unit in ('kg', 'l', 'pieces', 'other')),
  custom_unit text,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  -- A typed unit only when the unit is "other", and then it's required.
  check ((unit = 'other') = (custom_unit is not null and length(trim(custom_unit)) > 0)),
  -- Deleting a category deletes its items.
  foreign key (event_id, category_id) references public.category (event_id, id) on delete cascade
);

create index item_category_id_idx on public.item (category_id, position);
create index item_event_id_idx on public.item (event_id);

alter table public.item enable row level security;

create policy "Members manage their events' items"
  on public.item for all
  to authenticated
  using ((select public.is_event_member(event_id)))
  with check ((select public.is_event_member(event_id)));

revoke all on public.item from anon;
grant select, insert, update, delete on public.item to authenticated;
