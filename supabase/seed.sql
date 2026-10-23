-- Local development seed. Runs after migrations on `supabase db reset`.
-- Never runs against the hosted project.
--
-- Organizers (username / password):
--   organizer / password123   household "බොතේජු පවුල"
--   other     / password123   household "සිල්වා පවුල" (for household isolation checks)
--
-- Tests don't rely on this data: each test seeds its own household (see src/test/).

create function pg_temp.create_organizer(p_username text, p_password text)
returns uuid
language plpgsql
as $$
declare
  v_user_id uuid := gen_random_uuid();
  v_email text := p_username || '@daana.local';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id, v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  return v_user_id;
end;
$$;

select pg_temp.create_organizer('organizer', 'password123');
select public.setup_household('බොතේජු පවුල', 'organizer');

select pg_temp.create_organizer('other', 'password123');
select public.setup_household('සිල්වා පවුල', 'other');

-- Design sample events for `organizer` (dates relative to today, so there is
-- always something upcoming and something past).
with h as (
  select id from public.household where name = 'බොතේජු පවුල'
), m as (
  insert into public.monastery (household_id, name, location)
  select h.id, v.name, v.location
  from h, (values ('මාලබේ අසපුව', 'මාලබේ'), ('පොල්ගහවෙල අසපුව', 'පොල්ගහවෙල')) as v (name, location)
  returning id, household_id, name
)
select public.create_event(
  m.household_id, v.date, v.meal, m.id, v.host, v.monks, v.lay
)
from m
join (values
  ('මාලබේ අසපුව', current_date + 15, 'lunch', 'බොතේජු පවුල', 12, 20),
  ('පොල්ගහවෙල අසපුව', current_date + 15, 'breakfast', 'සිල්වා පවුල', 8, 6),
  ('මාලබේ අසපුව', current_date + 28, 'lunch', 'දහම් පාසල් ගුරු මණ්ඩලය', 15, 40),
  ('මාලබේ අසපුව', current_date - 12, 'lunch', 'ජයසිංහ පවුල — පින් අනුමෝදනා', 10, 15)
) as v (monastery, date, meal, host, monks, lay) on v.monastery = m.name;

-- Design sample menu for the first මාලබේ event (ticket #5).
insert into public.item (event_id, category_id, name, required_quantity, unit, custom_unit, notes)
select c.event_id, c.id, v.name, v.qty, v.unit, v.custom_unit, v.notes
from public.event e
join public.household h on h.id = e.household_id and h.name = 'බොතේජු පවුල'
join public.monastery mo on mo.id = e.monastery_id and mo.name = 'මාලබේ අසපුව'
join public.category c on c.event_id = e.id
join (values
  ('බත්', 'කිරිබත්', 3, 'kg', null, null),
  ('බත්', 'සුදු බත්', 3, 'kg', null, null),
  ('හොදි', 'පොල් කිරි හොදි', 2, 'l', null, null),
  ('ව්‍යංජන', 'පරිප්පු', 2, 'kg', null, null),
  ('ව්‍යංජන', 'අල තෙම්පරාදුව', 2, 'kg', null, null),
  ('ව්‍යංජන', 'බෝංචි', null, 'pieces', null, null),
  ('ව්‍යංජන', 'කොස් ඇඹුල', 2, 'other', 'තැටි', null),
  ('ව්‍යංජන', 'වම්බටු මෝජු', null, 'pieces', null, 'සීනි අඩුවෙන්'),
  ('පලතුරු', 'කෙසෙල්', 2, 'other', 'කැන්', null),
  ('පලතුරු', 'අන්නාසි', null, 'pieces', null, null),
  ('කැවිලි හා අතුරුපස', 'කැවුම්', 40, 'pieces', null, null),
  ('කැවිලි හා අතුරුපස', 'කොකිස්', 40, 'pieces', null, null),
  ('පාන', 'වතුර බෝතල්', 40, 'pieces', null, null),
  ('පාන', 'ඉඟුරු තේ', 4, 'l', null, null)
) as v (category, name, qty, unit, custom_unit, notes) on v.category = c.name
where e.date = current_date + 15 and e.meal = 'lunch';

-- Contributors from the design (Contributors / ContributorDetail artboards), in organizer's household.
insert into public.contributor (household_id, name, phone, whatsapp, notes)
select h.id, c.name, c.phone, c.whatsapp, c.notes
from public.household h
cross join (values
  ('සුනිල් ජයසිංහ', '077 123 4567', null, 'සෙනසුරාදා උදේට කතා කරන්න. වාහනයක් ඇත.'),
  ('අනුලා විජේසේකර', '071 234 5678', null, null),
  ('කමලා රත්නායක', '070 345 6789', '077 345 6789', null),
  ('ගුණපාල', '072 456 7890', null, null),
  ('දිල්රුක්ෂි', '075 567 8901', null, null),
  ('නිමල් සිල්වා', '076 678 9012', null, null),
  ('රුවන් කුමාර', null, null, null)
) as c (name, phone, whatsapp, notes)
where h.name = 'බොතේජු පවුල';

-- Design sample assignments on the first මාලබේ event's menu (ticket #8).
insert into public.assignment (event_id, item_id, contributor_id, quantity, status)
select i.event_id, i.id, co.id, v.qty, v.status
from public.item i
join public.event e on e.id = i.event_id and e.date = current_date + 15 and e.meal = 'lunch'
join public.monastery mo on mo.id = e.monastery_id and mo.name = 'මාලබේ අසපුව'
join public.household h on h.id = e.household_id and h.name = 'බොතේජු පවුල'
join (values
  ('කිරිබත්', 'නිමල් සිල්වා', 3, 'confirmed'),
  ('සුදු බත්', 'කමලා රත්නායක', 2, 'confirmed'),
  ('සුදු බත්', 'සුනිල් ජයසිංහ', 1, 'pending'),
  ('පරිප්පු', 'අනුලා විජේසේකර', 2, 'confirmed'),
  ('අල තෙම්පරාදුව', 'රුවන් කුමාර', 2, 'pending'),
  ('කොස් ඇඹුල', 'අනුලා විජේසේකර', 2, 'confirmed'),
  ('වම්බටු මෝජු', 'දිල්රුක්ෂි', null, 'pending'),
  ('කෙසෙල්', 'ගුණපාල', 2, 'received'),
  ('ඉඟුරු තේ', 'කමලා රත්නායක', 4, 'confirmed')
) as v (item, contributor, qty, status) on v.item = i.name
join public.contributor co on co.household_id = h.id and co.name = v.contributor;
