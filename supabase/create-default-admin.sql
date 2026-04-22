-- Crea o actualiza el administrador por defecto.
-- Ejecuta este archivo en Supabase SQL Editor después de schema.sql.
--
-- Credenciales:
--   email: admin@arraigo.local
--   password: ArraigoAdmin2026!
--
-- Si tu proyecto bloquea escrituras directas sobre auth.users, crea el usuario
-- desde Supabase Auth > Users con estas mismas credenciales. El trigger de
-- profiles le asignará el rol admin por el email.

create extension if not exists pgcrypto;

do $$
declare
  admin_id uuid;
  admin_email text := public.primary_admin_email();
  admin_password text := 'ArraigoAdmin2026!';
begin
  select id
  into admin_id
  from auth.users
  where lower(email) = lower(admin_email)
  limit 1;

  if admin_id is null then
    admin_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000'::uuid,
      admin_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'name', 'Administrador Arraigo',
        'additional_profile', '{}'::jsonb,
        'tracking_enabled', false
      ),
      timezone('utc', now()),
      timezone('utc', now())
    );
  else
    update auth.users
    set encrypted_password = crypt(admin_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
          || jsonb_build_object(
            'name', 'Administrador Arraigo',
            'tracking_enabled', false
          ),
        updated_at = timezone('utc', now())
    where id = admin_id;
  end if;

  insert into public.profiles (
    id,
    email,
    name,
    role,
    tracking_enabled,
    additional_profile,
    privacy_accepted_at
  )
  values (
    admin_id,
    admin_email,
    'Administrador Arraigo',
    'admin'::public.app_role,
    false,
    '{}'::jsonb,
    timezone('utc', now())
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(public.profiles.name, ''), excluded.name),
        role = 'admin'::public.app_role,
        tracking_enabled = false,
        updated_at = timezone('utc', now());
end $$;

select id, email, role
from public.profiles
where lower(email) = lower(public.primary_admin_email());
