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
