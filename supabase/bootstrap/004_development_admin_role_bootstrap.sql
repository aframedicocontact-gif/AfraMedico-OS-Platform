-- Development Admin Role Bootstrap
--
-- TEMPLATE ONLY.
-- Do not run this against production.
-- Do not create or modify schema.
--
-- Purpose:
-- Insert the minimum required active administrator role expected by
-- 003_development_admin_provisioning.sql.

begin;

insert into public.roles (
  organization_id,
  name,
  code,
  description,
  role_level,
  status,
  is_system_role
)
values (
  'e3b2dddc-9874-4911-b0f0-9dab1dd69248'::uuid,
  'Organization Administrator',
  'organization_administrator',
  'Development administrator role for AfraMedico OS Platform bootstrap.',
  100,
  'active',
  true
)
on conflict (organization_id, code) do nothing;

select
  id,
  organization_id,
  name,
  code,
  status,
  is_system_role
from public.roles
where organization_id = 'e3b2dddc-9874-4911-b0f0-9dab1dd69248'::uuid
  and code = 'organization_administrator';

commit;
