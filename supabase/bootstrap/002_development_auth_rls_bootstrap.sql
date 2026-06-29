-- Development Auth and RLS Bootstrap Template
--
-- TEMPLATE ONLY.
-- Do not commit real passwords, service role keys, access tokens, or secrets.
--
-- Replace placeholders before running in the approved development Supabase project:
-- AUTH_USER_ID
-- ORGANIZATION_ID
-- ADMIN_EMAIL
-- ADMIN_FULL_NAME
--
-- Prerequisite:
-- Create the Supabase Auth user manually first.

begin;

with bootstrap_values as (
  select
    'AUTH_USER_ID'::uuid as auth_user_id,
    'ORGANIZATION_ID'::uuid as organization_id,
    'ADMIN_EMAIL'::text as admin_email,
    'ADMIN_FULL_NAME'::text as admin_full_name
),
upsert_organization as (
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
  on conflict (slug) do update
    set
      name = excluded.name,
      country = excluded.country,
      timezone = excluded.timezone,
      currency = excluded.currency,
      plan = excluded.plan,
      status = excluded.status,
      updated_at = now()
  returning id
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
    auth_user_id,
    organization_id,
    admin_full_name,
    admin_email,
    'Organization Administrator',
    'Administration',
    'active'
  from bootstrap_values
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
    organization_id,
    auth_user_id,
    auth_user_id,
    'active',
    'active',
    now()
  from bootstrap_values
  on conflict (organization_id, user_id) do update
    set
      profile_id = excluded.profile_id,
      employment_status = excluded.employment_status,
      access_status = excluded.access_status,
      updated_at = now()
  returning id, organization_id
),
upsert_admin_role as (
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
    'Development administrator role for AfraMedico OS Platform bootstrap.',
    100,
    'active',
    true
  from bootstrap_values
  on conflict (organization_id, code) do update
    set
      name = excluded.name,
      description = excluded.description,
      role_level = excluded.role_level,
      status = excluded.status,
      is_system_role = excluded.is_system_role,
      updated_at = now()
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
  'Development Auth/RLS bootstrap administrator assignment.',
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

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('organization_id', (select organization_id::text from bootstrap_values))
where id = (select auth_user_id from bootstrap_values);

commit;
