-- ICOS Backend Sprint 7: Authentication & Operational Access Foundation
-- Authentication identifies users.
-- Authorization determines what operational responsibilities they may perform.
--
-- This migration creates the SaaS-ready security and operational access layer
-- for AfraMedico OS Platform / ICOS. All records are scoped by organization_id
-- so access evaluation remains tenant-isolated.
--
-- Boundary:
-- No SSO, MFA, OAuth, Azure AD, Google Workspace, hospital identity federation,
-- API authentication, or frontend authentication flow is created here.

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  parent_role_id uuid,
  name text not null,
  code text not null,
  description text,
  role_level integer not null default 0,
  status text not null default 'active',
  is_system_role boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_id_organization_unique unique (id, organization_id),
  constraint roles_code_unique unique (organization_id, code),
  constraint roles_parent_same_organization_fk foreign key (parent_role_id, organization_id) references public.roles(id, organization_id) on delete restrict,
  constraint roles_status_check check (status in ('active', 'inactive', 'archived')),
  constraint roles_level_check check (role_level >= 0)
);

comment on table public.roles is
  'Organization-scoped operational roles. Role inheritance is supported through parent_role_id while keeping evaluation tenant-scoped.';

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  parent_permission_id uuid,
  permission_key text not null,
  name text not null,
  description text,
  domain text not null,
  operation text not null,
  scope text not null default 'organization',
  supports_field_level_security boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permissions_id_organization_unique unique (id, organization_id),
  constraint permissions_key_unique unique (organization_id, permission_key),
  constraint permissions_parent_same_organization_fk foreign key (parent_permission_id, organization_id) references public.permissions(id, organization_id) on delete restrict,
  constraint permissions_status_check check (status in ('active', 'inactive', 'archived')),
  constraint permissions_scope_check check (scope in ('organization', 'department', 'team', 'case', 'field'))
);

comment on table public.permissions is
  'Organization-scoped permission catalog. Permissions define operations across Patient, Case, Clinical Decision, Referral, Hospital, Travel, Finance, Commission, Provider Network, Mission Control, Knowledge Base, Administration, Audit, and future field-level security.';

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  role_id uuid not null,
  permission_id uuid not null,
  grant_type text not null default 'allow',
  conditions jsonb,
  granted_by uuid,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_permissions_role_same_organization_fk foreign key (role_id, organization_id) references public.roles(id, organization_id) on delete cascade,
  constraint role_permissions_permission_same_organization_fk foreign key (permission_id, organization_id) references public.permissions(id, organization_id) on delete cascade,
  constraint role_permissions_granted_by_same_organization_fk foreign key (granted_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint role_permissions_unique unique (organization_id, role_id, permission_id),
  constraint role_permissions_grant_type_check check (grant_type in ('allow', 'deny')),
  constraint role_permissions_revoked_after_granted_check check (revoked_at is null or revoked_at >= granted_at)
);

comment on table public.role_permissions is
  'Maps Roles to Permissions. Permission changes must be mirrored into access_audit_log by application workflow or future database automation.';

create table public.organization_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  profile_id uuid,
  department_id uuid,
  employment_status text not null default 'active',
  access_status text not null default 'active',
  invited_by uuid,
  invited_at timestamptz,
  joined_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_users_id_organization_unique unique (id, organization_id),
  constraint organization_users_user_unique unique (organization_id, user_id),
  constraint organization_users_profile_same_organization_fk foreign key (profile_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint organization_users_invited_by_same_organization_fk foreign key (invited_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint organization_users_employment_status_check check (employment_status in ('active', 'inactive', 'contractor', 'external', 'archived')),
  constraint organization_users_access_status_check check (access_status in ('invited', 'active', 'suspended', 'revoked', 'archived'))
);

comment on table public.organization_users is
  'Organization membership records for authenticated users. Users belong to Organizations and access evaluation must always remain organization-scoped.';

create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  organization_user_id uuid not null,
  role_id uuid not null,
  assigned_by uuid,
  assignment_reason text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_role_assignments_org_user_same_organization_fk foreign key (organization_user_id, organization_id) references public.organization_users(id, organization_id) on delete cascade,
  constraint user_role_assignments_role_same_organization_fk foreign key (role_id, organization_id) references public.roles(id, organization_id) on delete restrict,
  constraint user_role_assignments_assigned_by_same_organization_fk foreign key (assigned_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint user_role_assignments_revoked_by_same_organization_fk foreign key (revoked_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint user_role_assignments_unique_active unique (organization_id, organization_user_id, role_id, starts_at),
  constraint user_role_assignments_expiry_check check (expires_at is null or expires_at >= starts_at),
  constraint user_role_assignments_revoked_after_start_check check (revoked_at is null or revoked_at >= starts_at)
);

comment on table public.user_role_assignments is
  'Assigns one or more Roles to organization users. Assignment and revocation history is preserved rather than overwritten.';

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  parent_department_id uuid,
  name text not null,
  code text not null,
  description text,
  department_type text not null default 'operational',
  lead_user_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_id_organization_unique unique (id, organization_id),
  constraint departments_code_unique unique (organization_id, code),
  constraint departments_parent_same_organization_fk foreign key (parent_department_id, organization_id) references public.departments(id, organization_id) on delete restrict,
  constraint departments_lead_same_organization_fk foreign key (lead_user_id, organization_id) references public.organization_users(id, organization_id) on delete set null,
  constraint departments_status_check check (status in ('active', 'inactive', 'archived')),
  constraint departments_type_check check (department_type in ('executive', 'clinical', 'operations', 'finance', 'travel', 'marketing', 'partner_management', 'hospital_relations', 'support', 'administration', 'audit', 'other'))
);

comment on table public.departments is
  'Optional organization departments for operational ownership, handoffs, and future departmental permissions.';

alter table public.organization_users
  add constraint organization_users_department_same_organization_fk foreign key (department_id, organization_id) references public.departments(id, organization_id) on delete set null;

create table public.operational_teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  department_id uuid,
  name text not null,
  code text not null,
  description text,
  team_type text not null default 'case_operations',
  lead_user_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operational_teams_id_organization_unique unique (id, organization_id),
  constraint operational_teams_code_unique unique (organization_id, code),
  constraint operational_teams_department_same_organization_fk foreign key (department_id, organization_id) references public.departments(id, organization_id) on delete set null,
  constraint operational_teams_lead_same_organization_fk foreign key (lead_user_id, organization_id) references public.organization_users(id, organization_id) on delete set null,
  constraint operational_teams_status_check check (status in ('active', 'inactive', 'archived')),
  constraint operational_teams_type_check check (team_type in ('case_operations', 'clinical_review', 'hospital_relations', 'finance', 'travel', 'partner_management', 'marketing', 'audit', 'temporary', 'other'))
);

comment on table public.operational_teams is
  'Operational teams inside an organization. Users may belong to multiple teams across departments and workflows.';

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  team_id uuid not null,
  organization_user_id uuid not null,
  team_role text,
  membership_status text not null default 'active',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  added_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_team_same_organization_fk foreign key (team_id, organization_id) references public.operational_teams(id, organization_id) on delete cascade,
  constraint team_members_org_user_same_organization_fk foreign key (organization_user_id, organization_id) references public.organization_users(id, organization_id) on delete cascade,
  constraint team_members_added_by_same_organization_fk foreign key (added_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint team_members_unique unique (organization_id, team_id, organization_user_id, joined_at),
  constraint team_members_status_check check (membership_status in ('active', 'inactive', 'left', 'removed')),
  constraint team_members_left_after_join_check check (left_at is null or left_at >= joined_at)
);

comment on table public.team_members is
  'Preserves operational team membership history. A user may belong to multiple Teams.';

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  organization_user_id uuid not null,
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  session_identifier text,
  ip_address inet,
  user_agent text,
  device_label text,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz,
  ended_at timestamptz,
  session_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_sessions_org_user_same_organization_fk foreign key (organization_user_id, organization_id) references public.organization_users(id, organization_id) on delete restrict,
  constraint user_sessions_status_check check (session_status in ('active', 'expired', 'revoked', 'signed_out')),
  constraint user_sessions_end_after_start_check check (ended_at is null or ended_at >= started_at)
);

comment on table public.user_sessions is
  'Preserved user session history for operational security review. Deleting access history is not supported by RLS policy.';

create table public.access_audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid,
  target_organization_user_id uuid,
  role_id uuid,
  permission_id uuid,
  team_id uuid,
  department_id uuid,
  action text not null,
  old_value text,
  new_value text,
  reason text,
  evidence text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint access_audit_log_actor_same_organization_fk foreign key (actor_user_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint access_audit_log_target_same_organization_fk foreign key (target_organization_user_id, organization_id) references public.organization_users(id, organization_id) on delete restrict,
  constraint access_audit_log_role_same_organization_fk foreign key (role_id, organization_id) references public.roles(id, organization_id) on delete restrict,
  constraint access_audit_log_permission_same_organization_fk foreign key (permission_id, organization_id) references public.permissions(id, organization_id) on delete restrict,
  constraint access_audit_log_team_same_organization_fk foreign key (team_id, organization_id) references public.operational_teams(id, organization_id) on delete restrict,
  constraint access_audit_log_department_same_organization_fk foreign key (department_id, organization_id) references public.departments(id, organization_id) on delete restrict
);

comment on table public.access_audit_log is
  'Append-only operational access audit trail for role, permission, team, department, session, and authorization-sensitive changes.';

create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

create trigger permissions_set_updated_at
before update on public.permissions
for each row execute function public.set_updated_at();

create trigger role_permissions_set_updated_at
before update on public.role_permissions
for each row execute function public.set_updated_at();

create trigger organization_users_set_updated_at
before update on public.organization_users
for each row execute function public.set_updated_at();

create trigger user_role_assignments_set_updated_at
before update on public.user_role_assignments
for each row execute function public.set_updated_at();

create trigger departments_set_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

create trigger operational_teams_set_updated_at
before update on public.operational_teams
for each row execute function public.set_updated_at();

create trigger team_members_set_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();

create trigger user_sessions_set_updated_at
before update on public.user_sessions
for each row execute function public.set_updated_at();

create index roles_organization_id_idx on public.roles (organization_id);
create index roles_parent_role_id_idx on public.roles (parent_role_id);
create index roles_status_idx on public.roles (status);

create index permissions_organization_id_idx on public.permissions (organization_id);
create index permissions_parent_permission_id_idx on public.permissions (parent_permission_id);
create index permissions_domain_idx on public.permissions (domain);
create index permissions_operation_idx on public.permissions (operation);
create index permissions_status_idx on public.permissions (status);

create index role_permissions_organization_id_idx on public.role_permissions (organization_id);
create index role_permissions_role_id_idx on public.role_permissions (role_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);
create index role_permissions_granted_by_idx on public.role_permissions (granted_by);
create index role_permissions_revoked_at_idx on public.role_permissions (revoked_at);

create index organization_users_organization_id_idx on public.organization_users (organization_id);
create index organization_users_user_id_idx on public.organization_users (user_id);
create index organization_users_profile_id_idx on public.organization_users (profile_id);
create index organization_users_department_id_idx on public.organization_users (department_id);
create index organization_users_access_status_idx on public.organization_users (access_status);

create index user_role_assignments_organization_id_idx on public.user_role_assignments (organization_id);
create index user_role_assignments_org_user_id_idx on public.user_role_assignments (organization_user_id);
create index user_role_assignments_role_id_idx on public.user_role_assignments (role_id);
create index user_role_assignments_assigned_by_idx on public.user_role_assignments (assigned_by);
create index user_role_assignments_revoked_at_idx on public.user_role_assignments (revoked_at);

create index departments_organization_id_idx on public.departments (organization_id);
create index departments_parent_department_id_idx on public.departments (parent_department_id);
create index departments_lead_user_id_idx on public.departments (lead_user_id);
create index departments_status_idx on public.departments (status);

create index operational_teams_organization_id_idx on public.operational_teams (organization_id);
create index operational_teams_department_id_idx on public.operational_teams (department_id);
create index operational_teams_lead_user_id_idx on public.operational_teams (lead_user_id);
create index operational_teams_status_idx on public.operational_teams (status);

create index team_members_organization_id_idx on public.team_members (organization_id);
create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_org_user_id_idx on public.team_members (organization_user_id);
create index team_members_status_idx on public.team_members (membership_status);

create index user_sessions_organization_id_idx on public.user_sessions (organization_id);
create index user_sessions_org_user_id_idx on public.user_sessions (organization_user_id);
create index user_sessions_auth_user_id_idx on public.user_sessions (auth_user_id);
create index user_sessions_status_idx on public.user_sessions (session_status);
create index user_sessions_started_at_idx on public.user_sessions (started_at);

create index access_audit_log_organization_id_idx on public.access_audit_log (organization_id);
create index access_audit_log_actor_user_id_idx on public.access_audit_log (actor_user_id);
create index access_audit_log_target_user_id_idx on public.access_audit_log (target_organization_user_id);
create index access_audit_log_role_id_idx on public.access_audit_log (role_id);
create index access_audit_log_permission_id_idx on public.access_audit_log (permission_id);
create index access_audit_log_team_id_idx on public.access_audit_log (team_id);
create index access_audit_log_department_id_idx on public.access_audit_log (department_id);
create index access_audit_log_action_idx on public.access_audit_log (action);
create index access_audit_log_created_at_idx on public.access_audit_log (created_at);

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organization_users enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.departments enable row level security;
alter table public.operational_teams enable row level security;
alter table public.team_members enable row level security;
alter table public.user_sessions enable row level security;
alter table public.access_audit_log enable row level security;

create policy "organization members can view roles"
on public.roles
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert roles"
on public.roles
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update roles"
on public.roles
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view permissions"
on public.permissions
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert permissions"
on public.permissions
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update permissions"
on public.permissions
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view role permissions"
on public.role_permissions
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert role permissions"
on public.role_permissions
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update role permissions"
on public.role_permissions
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view organization users"
on public.organization_users
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert organization users"
on public.organization_users
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update organization users"
on public.organization_users
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view user role assignments"
on public.user_role_assignments
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert user role assignments"
on public.user_role_assignments
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update user role assignments"
on public.user_role_assignments
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view departments"
on public.departments
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert departments"
on public.departments
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update departments"
on public.departments
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view operational teams"
on public.operational_teams
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert operational teams"
on public.operational_teams
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update operational teams"
on public.operational_teams
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view team members"
on public.team_members
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert team members"
on public.team_members
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update team members"
on public.team_members
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view user sessions"
on public.user_sessions
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert user sessions"
on public.user_sessions
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update user sessions"
on public.user_sessions
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view access audit log"
on public.access_audit_log
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert access audit log"
on public.access_audit_log
for insert
to authenticated
with check (organization_id = public.current_organization_id());
