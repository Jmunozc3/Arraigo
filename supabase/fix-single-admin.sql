-- Fix rápido para dejar un único administrador real
-- Ejecuta este archivo en Supabase SQL Editor

create or replace function public.primary_admin_email()
returns text
language sql
immutable
as $$
  select 'admin@arraigo.local'::text;
$$;

create or replace function public.normalize_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.role := case
    when lower(coalesce(new.email, '')) = lower(public.primary_admin_email())
      then 'admin'::public.app_role
    else 'user'::public.app_role
  end;

  return new;
end;
$$;

drop trigger if exists profiles_normalize_role on public.profiles;
create trigger profiles_normalize_role
before insert or update of email, role on public.profiles
for each row
execute function public.normalize_profile_role();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and lower(email) = lower(public.primary_admin_email())
  );
$$;

update public.profiles
set role = case
  when lower(email) = lower(public.primary_admin_email()) then 'admin'::public.app_role
  else 'user'::public.app_role
end;

drop index if exists public.profiles_single_admin_uidx;
create unique index profiles_single_admin_uidx
  on public.profiles (role)
  where role = 'admin';

select id, email, role
from public.profiles
order by created_at asc nulls last, email asc;
