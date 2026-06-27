-- Development Bootstrap Template: AfraMedico Organization and First Admin
--
-- This file is a TEMPLATE ONLY.
-- Do not commit real passwords, service role keys, or secrets.
-- Replace these placeholders before running in the approved development project:
--
-- ORGANIZATION_ID
-- AUTH_USER_ID
-- ADMIN_EMAIL
-- ADMIN_FULL_NAME
--
-- Prerequisite:
-- Create the Supabase Auth user manually first, then copy auth.users.id into
-- AUTH_USER_ID. This template does not create an auth user or password.

begin;

with bootstrap_values as (
  select
    'ORGANIZATION_ID'::uuid as organization_id,
    'AUTH_USER_ID'::uuid as auth_user_id,
    'ADMIN_EMAIL'::text as admin_email,
    'ADMIN_FULL_NAME'::text as admin_full_name
),
insert_organization as (
  insert into public.organizations (
    id,
    name,
    slug,
    country,
    timezone,
    currency,
    plan,
    status
  )
  select
    organization_id,
    'AfraMedico',
    'aframedico',
    'Canada',
    'America/Toronto',
    'CAD',
    'internal',
    'active'
  from bootstrap_values
  on conflict (id) do nothing
  returning id
),
insert_profile as (
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
    auth_user_id,
    organization_id,
    admin_full_name,
    admin_email,
    'Organization Administrator',
    'Administration',
    'active'
  from bootstrap_values
  on conflict (id) do nothing
  returning id, organization_id
),
insert_organization_user as (
  insert into public.organization_users (
    organization_id,
    user_id,
    profile_id,
    employment_status,
    access_status,
    joined_at
  )
  select
    organization_id,
    auth_user_id,
    auth_user_id,
    'active',
    'active',
    now()
  from bootstrap_values
  on conflict (organization_id, user_id) do nothing
  returning id, organization_id
),
insert_admin_role as (
  insert into public.roles (
    organization_id,
    name,
    code,
    description,
    role_level,
    status,
    is_system_role
  )
  select
    organization_id,
    'Organization Administrator',
    'organization_administrator',
    'Initial development administrator role for AfraMedico OS Platform bootstrap.',
    100,
    'active',
    true
  from bootstrap_values
  on conflict (organization_id, code) do nothing
  returning id, organization_id
),
resolved_organization_user as (
  select ou.id, ou.organization_id
  from public.organization_users ou
  join bootstrap_values bv
    on ou.organization_id = bv.organization_id
   and ou.user_id = bv.auth_user_id
  limit 1
),
resolved_admin_role as (
  select r.id, r.organization_id
  from public.roles r
  join bootstrap_values bv
    on r.organization_id = bv.organization_id
   and r.code = 'organization_administrator'
  limit 1
)
insert into public.user_role_assignments (
  organization_id,
  organization_user_id,
  role_id,
  assignment_reason,
  starts_at
)
select
  rou.organization_id,
  rou.id,
  rar.id,
  'Development bootstrap initial administrator assignment.',
  now()
from resolved_organization_user rou
join resolved_admin_role rar
  on rar.organization_id = rou.organization_id
where not exists (
  select 1
  from public.user_role_assignments ura
  where ura.organization_id = rou.organization_id
    and ura.organization_user_id = rou.id
    and ura.role_id = rar.id
    and ura.revoked_at is null
);

commit;
