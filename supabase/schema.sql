-- Arraigo
-- PostgreSQL / Supabase schema
-- Run this file in the Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_badge_tone as enum ('blue', 'green', 'red');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.community_chat_type as enum ('link', 'whatsapp', 'telegram');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum ('system', 'job', 'community');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_action_type as enum ('none', 'job', 'community', 'external');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  phone text,
  age integer check (age is null or age between 0 and 120),
  town text,
  region text,
  country text,
  status text,
  avatar text,
  role public.app_role not null default 'user',
  tracking_enabled boolean not null default true,
  additional_profile jsonb not null default '{}'::jsonb,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_email_not_blank check (btrim(email) <> ''),
  constraint profiles_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  badge_label text not null,
  badge_tone public.job_badge_tone not null default 'blue',
  company text not null,
  title text not null,
  salary text not null,
  location text not null,
  type text not null,
  schedule text not null,
  mode text not null,
  image text not null,
  summary text not null,
  description text not null,
  requirements text[] not null default '{}'::text[],
  benefits text[] not null default '{}'::text[],
  contact_url text not null,
  source text not null default 'admin',
  is_hidden boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_by_email text,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint jobs_category_not_blank check (btrim(category) <> ''),
  constraint jobs_badge_label_not_blank check (btrim(badge_label) <> ''),
  constraint jobs_company_not_blank check (btrim(company) <> ''),
  constraint jobs_title_not_blank check (btrim(title) <> ''),
  constraint jobs_salary_not_blank check (btrim(salary) <> ''),
  constraint jobs_location_not_blank check (btrim(location) <> ''),
  constraint jobs_type_not_blank check (btrim(type) <> ''),
  constraint jobs_schedule_not_blank check (btrim(schedule) <> ''),
  constraint jobs_mode_not_blank check (btrim(mode) <> ''),
  constraint jobs_image_not_blank check (btrim(image) <> ''),
  constraint jobs_summary_not_blank check (btrim(summary) <> ''),
  constraint jobs_description_not_blank check (btrim(description) <> ''),
  constraint jobs_contact_not_blank check (btrim(contact_url) <> ''),
  constraint jobs_requirements_not_empty check (cardinality(requirements) > 0),
  constraint jobs_benefits_not_empty check (cardinality(benefits) > 0),
  constraint jobs_source_allowed check (source in ('admin', 'seed', 'import'))
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image text not null,
  chat_link text not null,
  chat_type public.community_chat_type not null default 'link',
  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_by_email text,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint communities_title_not_blank check (btrim(title) <> ''),
  constraint communities_description_not_blank check (btrim(description) <> ''),
  constraint communities_image_not_blank check (btrim(image) <> ''),
  constraint communities_chat_link_not_blank check (btrim(chat_link) <> '')
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete cascade,
  external_job_id text,
  job_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint saved_jobs_one_reference check ((job_id is not null) <> (external_job_id is not null))
);

create table if not exists public.hidden_jobs (
  job_id text primary key,
  hidden_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint hidden_jobs_job_id_not_blank check (btrim(job_id) <> '')
);

create table if not exists public.saved_towns (
  user_id uuid not null references public.profiles (id) on delete cascade,
  town_id text not null,
  town_name text not null,
  region text,
  country text,
  town_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, town_id),
  constraint saved_towns_town_id_not_blank check (btrim(town_id) <> ''),
  constraint saved_towns_town_name_not_blank check (btrim(town_name) <> '')
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles (id) on delete cascade,
  type public.notification_type not null default 'system',
  title text not null,
  body text not null,
  action_type public.notification_action_type not null default 'none',
  action_target text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  constraint notifications_title_not_blank check (btrim(title) <> ''),
  constraint notifications_body_not_blank check (btrim(body) <> '')
);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  primary key (notification_id, user_id)
);

create table if not exists public.location_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_name text,
  user_email text,
  user_role public.app_role,
  user_town text,
  user_region text,
  lat double precision not null,
  lon double precision not null,
  accuracy_m double precision,
  source text not null default 'manual',
  nightly_date date,
  captured_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint location_events_lat_range check (lat between -90 and 90),
  constraint location_events_lon_range check (lon between -180 and 180),
  constraint location_events_accuracy_valid check (accuracy_m is null or accuracy_m >= 0),
  constraint location_events_source_not_blank check (btrim(source) <> '')
);

create unique index if not exists profiles_email_lower_uidx
  on public.profiles (lower(email));

create unique index if not exists saved_jobs_user_job_uidx
  on public.saved_jobs (user_id, job_id)
  where job_id is not null;

create unique index if not exists saved_jobs_user_external_uidx
  on public.saved_jobs (user_id, external_job_id)
  where external_job_id is not null;

create unique index if not exists location_events_user_nightly_uidx
  on public.location_events (user_id, nightly_date)
  where nightly_date is not null;

create index if not exists profiles_role_idx
  on public.profiles (role);

create index if not exists jobs_visible_created_idx
  on public.jobs (is_hidden, deleted_at, created_at desc);

create index if not exists jobs_created_by_idx
  on public.jobs (created_by, created_at desc);

create index if not exists jobs_search_idx
  on public.jobs
  using gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(location, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(description, '')
    )
  );

create index if not exists communities_visible_created_idx
  on public.communities (deleted_at, created_at desc);

create index if not exists communities_created_by_idx
  on public.communities (created_by, created_at desc);

create index if not exists communities_search_idx
  on public.communities
  using gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  );

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_broadcast_created_idx
  on public.notifications (created_at desc)
  where recipient_id is null;

create index if not exists hidden_jobs_created_idx
  on public.hidden_jobs (created_at desc);

create index if not exists notification_reads_user_idx
  on public.notification_reads (user_id, read_at desc);

create index if not exists location_events_user_captured_idx
  on public.location_events (user_id, captured_at desc);

create index if not exists location_events_captured_idx
  on public.location_events (captured_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_created_by_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_record public.profiles;
begin
  if new.created_by is null then
    return new;
  end if;

  select *
  into actor_record
  from public.profiles
  where id = new.created_by;

  if found then
    new.created_by_name := coalesce(actor_record.name, actor_record.email);
    new.created_by_email := actor_record.email;
  end if;

  return new;
end;
$$;

create or replace function public.set_location_event_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_record public.profiles;
begin
  select *
  into actor_record
  from public.profiles
  where id = new.user_id;

  if found then
    new.user_name := coalesce(actor_record.name, actor_record.email);
    new.user_email := actor_record.email;
    new.user_role := actor_record.role;
    new.user_town := actor_record.town;
    new.user_region := actor_record.region;
  end if;

  return new;
end;
$$;

create or replace function public.create_welcome_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    recipient_id,
    type,
    title,
    body,
    action_type,
    created_by
  )
  values (
    new.id,
    'system',
    'Bienvenido a Arraigo',
    'Tu cuenta ya está lista. Puedes guardar empleos, comunidades y municipios.',
    'none',
    new.id
  );

  return new;
end;
$$;

create or replace function public.create_job_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    recipient_id,
    type,
    title,
    body,
    action_type,
    action_target,
    created_by
  )
  values (
    null,
    'job',
    'Nueva oferta publicada',
    coalesce(new.title, 'Oferta') || ' · ' || coalesce(new.location, ''),
    'job',
    new.id::text,
    new.created_by
  );

  return new;
end;
$$;

create or replace function public.create_community_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    recipient_id,
    type,
    title,
    body,
    action_type,
    action_target,
    created_by
  )
  values (
    null,
    'community',
    'Nueva comunidad creada',
    coalesce(new.title, 'Comunidad'),
    'community',
    new.id::text,
    new.created_by
  );

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  insert into public.profiles (
    id,
    email,
    name,
    phone,
    age,
    town,
    region,
    country,
    status,
    avatar,
    tracking_enabled,
    additional_profile,
    privacy_accepted_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(meta->>'name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Usuario'),
    nullif(meta->>'phone', ''),
    case
      when nullif(meta->>'age', '') is null then null
      else (meta->>'age')::integer
    end,
    nullif(meta->>'town', ''),
    nullif(meta->>'region', ''),
    nullif(meta->>'country', ''),
    nullif(meta->>'status', ''),
    nullif(coalesce(meta->>'avatar', meta->>'avatar_url'), ''),
    case
      when meta ? 'tracking_enabled' then coalesce((meta->>'tracking_enabled')::boolean, true)
      else true
    end,
    coalesce(meta->'additional_profile', '{}'::jsonb),
    timezone('utc', now())
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email = coalesce(new.email, old.email),
         updated_at = timezone('utc', now())
   where id = new.id;

  return new;
end;
$$;

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
  );
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

drop trigger if exists communities_set_updated_at on public.communities;
create trigger communities_set_updated_at
before update on public.communities
for each row
execute function public.set_updated_at();

drop trigger if exists jobs_set_created_by_name on public.jobs;
create trigger jobs_set_created_by_name
before insert or update of created_by on public.jobs
for each row
execute function public.set_created_by_name();

drop trigger if exists communities_set_created_by_name on public.communities;
create trigger communities_set_created_by_name
before insert or update of created_by on public.communities
for each row
execute function public.set_created_by_name();

drop trigger if exists location_events_set_snapshot on public.location_events;
create trigger location_events_set_snapshot
before insert on public.location_events
for each row
execute function public.set_location_event_snapshot();

drop trigger if exists profiles_create_welcome_notification on public.profiles;
create trigger profiles_create_welcome_notification
after insert on public.profiles
for each row
execute function public.create_welcome_notification();

drop trigger if exists jobs_create_notification on public.jobs;
create trigger jobs_create_notification
after insert on public.jobs
for each row
execute function public.create_job_notification();

drop trigger if exists communities_create_notification on public.communities;
create trigger communities_create_notification
after insert on public.communities
for each row
execute function public.create_community_notification();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_profile_email();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.communities enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.hidden_jobs enable row level security;
alter table public.saved_towns enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.location_events enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists jobs_public_read_visible on public.jobs;
create policy jobs_public_read_visible
on public.jobs
for select
to anon, authenticated
using ((deleted_at is null and is_hidden = false) or public.is_admin());

drop policy if exists jobs_admin_insert on public.jobs;
create policy jobs_admin_insert
on public.jobs
for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

drop policy if exists jobs_admin_update on public.jobs;
create policy jobs_admin_update
on public.jobs
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists jobs_admin_delete on public.jobs;
create policy jobs_admin_delete
on public.jobs
for delete
to authenticated
using (public.is_admin());

drop policy if exists communities_public_read_active on public.communities;
create policy communities_public_read_active
on public.communities
for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists communities_insert_own on public.communities;
create policy communities_insert_own
on public.communities
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists communities_update_owner_or_admin on public.communities;
create policy communities_update_owner_or_admin
on public.communities
for update
to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists communities_delete_owner_or_admin on public.communities;
create policy communities_delete_owner_or_admin
on public.communities
for delete
to authenticated
using (created_by = auth.uid() or public.is_admin());

drop policy if exists saved_jobs_select_own on public.saved_jobs;
create policy saved_jobs_select_own
on public.saved_jobs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists saved_jobs_insert_own on public.saved_jobs;
create policy saved_jobs_insert_own
on public.saved_jobs
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists saved_jobs_delete_own on public.saved_jobs;
create policy saved_jobs_delete_own
on public.saved_jobs
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists saved_towns_select_own on public.saved_towns;
create policy saved_towns_select_own
on public.saved_towns
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists hidden_jobs_public_read on public.hidden_jobs;
create policy hidden_jobs_public_read
on public.hidden_jobs
for select
to anon, authenticated
using (true);

drop policy if exists hidden_jobs_admin_insert on public.hidden_jobs;
create policy hidden_jobs_admin_insert
on public.hidden_jobs
for insert
to authenticated
with check (public.is_admin());

drop policy if exists hidden_jobs_admin_delete on public.hidden_jobs;
create policy hidden_jobs_admin_delete
on public.hidden_jobs
for delete
to authenticated
using (public.is_admin());

drop policy if exists saved_towns_insert_own on public.saved_towns;
create policy saved_towns_insert_own
on public.saved_towns
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists saved_towns_update_own on public.saved_towns;
create policy saved_towns_update_own
on public.saved_towns
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists saved_towns_delete_own on public.saved_towns;
create policy saved_towns_delete_own
on public.saved_towns
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_select_visible_to_user on public.notifications;
create policy notifications_select_visible_to_user
on public.notifications
for select
to authenticated
using (
  public.is_admin()
  or recipient_id = auth.uid()
  or recipient_id is null
);

drop policy if exists notifications_admin_insert on public.notifications;
create policy notifications_admin_insert
on public.notifications
for insert
to authenticated
with check (public.is_admin());

drop policy if exists notifications_admin_update on public.notifications;
create policy notifications_admin_update
on public.notifications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists notifications_admin_delete on public.notifications;
create policy notifications_admin_delete
on public.notifications
for delete
to authenticated
using (public.is_admin());

drop policy if exists notification_reads_select_own on public.notification_reads;
create policy notification_reads_select_own
on public.notification_reads
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notification_reads_insert_own on public.notification_reads;
create policy notification_reads_insert_own
on public.notification_reads
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.notifications n
    where n.id = notification_id
      and (
        n.recipient_id = auth.uid()
        or n.recipient_id is null
        or public.is_admin()
      )
  )
);

drop policy if exists notification_reads_update_own on public.notification_reads;
create policy notification_reads_update_own
on public.notification_reads
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notification_reads_delete_own on public.notification_reads;
create policy notification_reads_delete_own
on public.notification_reads
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists location_events_select_own_or_admin on public.location_events;
create policy location_events_select_own_or_admin
on public.location_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists location_events_insert_own_when_tracking_enabled on public.location_events;
create policy location_events_insert_own_when_tracking_enabled
on public.location_events
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tracking_enabled = true
  )
);

drop policy if exists location_events_delete_own_or_admin on public.location_events;
create policy location_events_delete_own_or_admin
on public.location_events
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());
