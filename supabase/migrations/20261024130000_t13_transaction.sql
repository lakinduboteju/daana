-- Money: givens and expenses (ticket #13).

create table public.transaction (
  id uuid primary key default gen_random_uuid(),
  -- Deleting an event deletes its money records.
  event_id uuid not null references public.event (id) on delete cascade,
  item_id uuid,
  -- No cascade: a contributor with transactions can't be deleted, so
  -- remove_contributor archives them instead and history stays.
  contributor_id uuid references public.contributor (id) on delete restrict,
  -- given: handed to a contributor; expense: an actual cost.
  kind text not null check (kind in ('given', 'expense')),
  -- Whole LKR rupees.
  amount integer not null check (amount > 0),
  date date not null default (now() at time zone 'Asia/Colombo')::date,
  method text check (method in ('cash', 'bank_transfer')),
  notes text,
  created_at timestamptz not null default now(),
  -- The item is always in the transaction's own event. Deleting the item
  -- keeps the transaction on the event, with no item.
  foreign key (event_id, item_id) references public.item (event_id, id) on delete set null (item_id)
);

create index transaction_event_id_idx on public.transaction (event_id, date);
create index transaction_item_id_idx on public.transaction (item_id);
create index transaction_contributor_id_idx on public.transaction (contributor_id);

alter table public.transaction enable row level security;

-- Through the event to the household. A linked contributor must be in the
-- event's household.
create policy "Members manage their events' transactions"
  on public.transaction for all
  to authenticated
  using ((select public.is_event_member(event_id)))
  with check (
    (select public.is_event_member(event_id))
    and (
      contributor_id is null
      or exists (
        select 1
        from public.contributor c
        join public.event e on e.household_id = c.household_id
        where c.id = contributor_id and e.id = event_id
      )
    )
  );

revoke all on public.transaction from anon;
grant select, insert, update, delete on public.transaction to authenticated;

-- Event money summary: givens and expenses are totalled separately, so the
-- same money is never counted twice.
create view public.event_money
with (security_invoker = true)
as
select
  e.id as event_id,
  coalesce(sum(t.amount) filter (where t.kind = 'given'), 0)::integer as total_given,
  coalesce(sum(t.amount) filter (where t.kind = 'expense'), 0)::integer as total_expense
from public.event e
left join public.transaction t on t.event_id = e.id
group by e.id;

grant select on public.event_money to authenticated;
revoke all on public.event_money from anon;

-- Reimbursement: what the organizer still owes each contributor in an event,
-- max(0, expenses − given). Only contributors owed something are listed.
create view public.reimbursement
with (security_invoker = true)
as
select
  t.event_id,
  t.contributor_id,
  (sum(t.amount) filter (where t.kind = 'expense') - coalesce(sum(t.amount) filter (where t.kind = 'given'), 0))::integer as amount
from public.transaction t
where t.contributor_id is not null
group by t.event_id, t.contributor_id
having coalesce(sum(t.amount) filter (where t.kind = 'expense'), 0) > coalesce(sum(t.amount) filter (where t.kind = 'given'), 0);

grant select on public.reimbursement to authenticated;
revoke all on public.reimbursement from anon;
