-- Documents: receipts, bills and other images or PDFs on an event (ticket #14).
--
-- Files live in the private Storage bucket `documents` at
-- `<household_id>/<event_id>/<file>`. Storage policies let an organizer read
-- and delete only under their own household's folder, and upload only into
-- folders of their own household's events. The `document` table
-- holds each file's name and what it's linked to.

-- Lets a document link to a transaction in its own event.
alter table public.transaction add constraint transaction_event_id_id_key unique (event_id, id);

create table public.document (
  id uuid primary key default gen_random_uuid(),
  -- Deleting an event deletes its documents.
  event_id uuid not null references public.event (id) on delete cascade,
  item_id uuid,
  transaction_id uuid,
  name text not null check (length(trim(name)) > 0),
  storage_path text not null unique,
  mime_type text not null check (mime_type like 'image/%' or mime_type = 'application/pdf'),
  -- Bytes, at most 10 MB.
  size integer not null check (size > 0 and size <= 10485760),
  created_at timestamptz not null default now(),
  -- The item and transaction are always in the document's own event. Deleting
  -- either keeps the document on the event, unlinked.
  foreign key (event_id, item_id) references public.item (event_id, id) on delete set null (item_id),
  foreign key (event_id, transaction_id) references public.transaction (event_id, id) on delete set null (transaction_id)
);

create index document_event_id_idx on public.document (event_id, created_at);
create index document_item_id_idx on public.document (item_id);
create index document_transaction_id_idx on public.document (transaction_id);

alter table public.document enable row level security;

-- Through the event to the household. The file must sit under the event's
-- own household/event folder.
create policy "Members manage their events' documents"
  on public.document for all
  to authenticated
  using ((select public.is_event_member(event_id)))
  with check (
    (select public.is_event_member(event_id))
    and exists (
      select 1
      from public.event e
      where e.id = event_id
        and storage_path like e.household_id::text || '/' || e.id::text || '/%'
    )
  );

revoke all on public.document from anon;
grant select, insert, update, delete on public.document to authenticated;

-- The private bucket: images and PDFs up to 10 MB only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['image/*', 'application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- True when an object path is `<household_id>/<event_id>/<file>` for an event
-- of a household the current organizer belongs to.
create function public.is_document_path_member(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event e
    join public.household_member m on m.household_id = e.household_id
    where array_length(storage.foldername(p_name), 1) = 2
      and e.household_id::text = (storage.foldername(p_name))[1]
      and e.id::text = (storage.foldername(p_name))[2]
      and m.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_document_path_member(text) from public, anon;
grant execute on function public.is_document_path_member(text) to authenticated;

-- True when an object path starts with a household the current organizer
-- belongs to. Reading and deleting only need this, so an event's files can
-- still be removed right after the event itself is deleted (Storage reads an
-- object before deleting it). Uploads must also name one of its events.
create function public.is_document_household_member(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_member m
    where m.household_id::text = (storage.foldername(p_name))[1]
      and m.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_document_household_member(text) from public, anon;
grant execute on function public.is_document_household_member(text) to authenticated;

create policy "Members read their household's document files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' and (select public.is_document_household_member(name)));

create policy "Members upload their events' document files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and (select public.is_document_path_member(name)));

create policy "Members update their events' document files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'documents' and (select public.is_document_path_member(name)))
  with check (bucket_id = 'documents' and (select public.is_document_path_member(name)));

create policy "Members delete their household's document files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and (select public.is_document_household_member(name)));
