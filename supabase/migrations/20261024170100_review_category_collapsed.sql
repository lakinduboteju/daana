-- Collapsing a category on the menu is a one-tap change that saves immediately,
-- so it survives a reload. copy_event leaves it out: copied categories start open.

alter table public.category add column collapsed boolean not null default false;
