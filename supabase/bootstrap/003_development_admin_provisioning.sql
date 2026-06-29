-- Development Admin Provisioning Template
--
-- TEMPLATE ONLY.
-- Do not commit real passwords, service role keys, access tokens, or secrets.
-- Do not run this against production.
--
-- Approved Development organization:
-- Organization ID: e3b2dddc-9874-4911-b0f0-9dab1dd69248
-- Slug: aframedico
-- Plan: cloud
--
-- Replace placeholders before running in the approved development Supabase project:
-- AUTH_USER_ID
-- ADMIN_EMAIL
-- ADMIN_NAME
--
-- Prerequisite:
-- Create the Supabase Auth user manually first, then copy auth.users.id into
-- AUTH_USER_ID. This template does not create an Auth user or password.
--
-- Role behavior:
-- This template assigns an existing active admin role if one is present.
-- It does not create roles or permissions.

begin;

with bootstrap_values as (
  select
    'e3b2dddc-9874-4911-b0f0-9dab1dd69248'::uuid as organization_id,
    'AUTH_USER_ID'::uuid as auth_user_id,
    'ADMIN_EMAIL'::text as admin_email,
    'ADMIN_NAME'::text as admin_name
),
target_organization as (
  select o.id
  from public.organizations o
  join bootstrap_values bv
    on o.id = bv.organization_id
   and o.slug = 'aframedico'
  limit 1
),
upsert_profile as (
  insert into public.user_profiles (
    id,
    organization_id,
    full_name,
    email,
    role,
    department,
    status
  )
  select
    bv.auth_user_id,
    org.id,
    bv.admin_name,
    bv.admin_email,
    'Organization Administrator',
    'Administration',
    'active'
  from bootstrap_values bv
  join target_organization org
    on org.id = bv.organization_id
  on conflict (id) do update
    set
      organization_id = excluded.organization_id,
      full_name = excluded.full_name,
      email = excluded.email,
      role = excluded.role,
      department = excluded.department,
      status = excluded.status,
      updated_at = now()
  returning id, organization_id
),
upsert_organization_user as (
  insert into public.organization_users (
    organization_id,
    user_id,
    profile_id,
    employment_status,
    access_status,
    joined_at
  )
  select
    up.organization_id,
    up.id,
    up.id,
    'active',
    'active',
    now()
  from upsert_profile up
  on conflict (organization_id, user_id) do update
    set
      profile_id = excluded.profile_id,
      employment_status = excluded.employment_status,
      access_status = excluded.access_status,
      joined_at = coalesce(public.organization_users.joined_at, excluded.joined_at),
      updated_at = now()
  returning id, organization_id
),
resolved_admin_role as (
  select r.id, r.organization_id
  from public.roles r
  join bootstrap_values bv
    on r.organization_id = bv.organization_id
  where r.status = 'active'
    and r.code in (
      'organization_administrator',
      'super_administrator',
      'org_admin',
      'admin'
    )
  order by case r.code
    when 'organization_administrator' then 1
    when 'super_administrator' then 2
    when 'org_admin' then 3
    when 'admin' then 4
    else 5
  end
  limit 1
),
insert_role_assignment as (
  insert into public.user_role_assignments (
    organization_id,
    organization_user_id,
    role_id,
    assignment_reason,
    starts_at
  )
  select
    ou.organization_id,
    ou.id,
    role.id,
    'Development admin provisioning assignment.',
    now()
  from upsert_organization_user ou
  join resolved_admin_role role
    on role.organization_id = ou.organization_id
  where not exists (
    select 1
    from public.user_role_assignments existing
    where existing.organization_id = ou.organization_id
      and existing.organization_user_id = ou.id
      and existing.role_id = role.id
      and existing.revoked_at is null
  )
  returning id
),
update_auth_app_metadata as (
  update auth.users au
  set raw_app_meta_data =
    coalesce(au.raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('organization_id', (select organization_id::text from bootstrap_values))
  from bootstrap_values bv
  where au.id = bv.auth_user_id
    and exists (select 1 from target_organization)
  returning au.id
)
select
  (select count(*) from target_organization) as organization_found,
  (select count(*) from upsert_profile) as user_profile_ready,
  (select count(*) from upsert_organization_user) as organization_user_ready,
  (select count(*) from resolved_admin_role) as admin_role_found,
  (select count(*) from insert_role_assignment) as role_assignment_inserted,
  (select count(*) from update_auth_app_metadata) as app_metadata_updated;

commit;

-- Validation query after signing out and signing in again:
--
-- select
--   au.id as auth_user_id,
--   au.raw_app_meta_data ->> 'organization_id' as app_metadata_organization_id,
--   up.organization_id as profile_organization_id,
--   ou.id as organization_user_id,
--   ou.access_status,
--   r.code as assigned_role_code
-- from auth.users au
-- left join public.user_profiles up
--   on up.id = au.id
-- left join public.organization_users ou
--   on ou.user_id = au.id
--  and ou.organization_id = up.organization_id
-- left join public.user_role_assignments ura
--   on ura.organization_user_id = ou.id
--  and ura.organization_id = ou.organization_id
--  and ura.revoked_at is null
-- left join public.roles r
--   on r.id = ura.role_id
--  and r.organization_id = ura.organization_id
-- where au.id = 'AUTH_USER_ID'::uuid;
