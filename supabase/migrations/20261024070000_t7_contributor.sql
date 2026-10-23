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

-- Deletes a contributor, or archives them when anything still references them
-- (for example an assignment), so past events stay accurate.
-- Tables that reference contributor must use `on delete restrict` / `no action`
-- (never cascade) for this to archive instead of losing history.
-- Security invoker: row-level security decides which contributors the caller can touch.
-- Returns 'deleted', 'archived', or null when the caller can't see the contributor.
create function public.remove_contributor(p_contributor_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  begin
    delete from public.contributor where id = p_contributor_id;
    if found then
      return 'deleted';
    end if;
    return null;
  exception when foreign_key_violation then
    update public.contributor
    set archived_at = coalesce(archived_at, now())
    where id = p_contributor_id;
    return 'archived';
  end;
end;
$$;

revoke execute on function public.remove_contributor(uuid) from public, anon;
grant execute on function public.remove_contributor(uuid) to authenticated;
