-- Contributors: the household's reusable list of people who bring or pay for items.

create table public.contributor (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text check (phone is null or length(trim(phone)) > 0),
  whatsapp text check (whatsapp is null or length(trim(whatsapp)) > 0),
  notes text check (notes is null or length(trim(notes)) > 0),
  -- Archived contributors are hidden from lists and pickers but kept for history.
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index contributor_household_id_idx on public.contributor (household_id);

alter table public.contributor enable row level security;

create policy "Members can read their household's contributors"
  on public.contributor for select
  to authenticated
  using ((select public.is_household_member(household_id)));

create policy "Members can add contributors to their household"
  on public.contributor for insert
  to authenticated
  with check ((select public.is_household_member(household_id)));

create policy "Members can update their household's contributors"
  on public.contributor for update
  to authenticated
  using ((select public.is_household_member(household_id)))
  with check ((select public.is_household_member(household_id)));

create policy "Members can delete their household's contributors"
  on public.contributor for delete
  to authenticated
  using ((select public.is_household_member(household_id)));

revoke all on public.contributor from anon;
grant select, insert, update, delete on public.contributor to authenticated;
