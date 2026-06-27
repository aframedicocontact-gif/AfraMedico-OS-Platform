# Authentication & Operational Access Foundation

Backend Sprint 7 establishes the first security and operational access foundation for AfraMedico OS Platform / ICOS.

This sprint is not only about login. Authentication identifies a user. Authorization determines what that user is allowed to do inside the operating system.

## Architecture

ICOS is a SaaS-ready platform. Every access record is scoped by `organization_id`.

AfraMedico is the first organization using ICOS, but the platform must support future independent organizations. For that reason, roles, permissions, teams, departments, sessions, and access audit records all belong to an organization.

The migration creates:

- `roles`
- `permissions`
- `role_permissions`
- `organization_users`
- `user_role_assignments`
- `departments`
- `operational_teams`
- `team_members`
- `user_sessions`
- `access_audit_log`

Each table uses UUID primary keys, tenant-scoped foreign keys, row level security, and organization-based RLS policies.

## Authentication Model

Supabase Auth identifies the user through `auth.users`.

ICOS stores operational identity separately:

- `user_profiles` stores profile-level user details from the SaaS foundation.
- `organization_users` stores membership in an organization.
- `user_sessions` stores preserved session history for security review.

This separation allows one platform identity to participate in organization-scoped operational models without duplicating patient or case data.

## Authorization Model

Authorization is role-based and permission-driven.

The core chain is:

```text
Organization
|
v
Organization User
|
v
User Role Assignment
|
v
Role
|
v
Role Permission
|
v
Permission
```

Roles grant permissions. Permissions define operations.

Examples of permission domains:

- Patient
- Case
- Clinical Decision
- Referral
- Hospital
- Travel
- Finance
- Commission
- Provider Network
- Mission Control
- Knowledge Base
- Administration
- Audit

Permission evaluation must always remain organization-scoped.

## Role Hierarchy

Roles support inheritance through `parent_role_id`.

Future operational roles may include:

- Super Administrator
- Organization Administrator
- Clinical Director
- Referral Coordinator
- Hospital Coordinator
- International Office
- Patient Coordinator
- Finance Manager
- Partner Manager
- Travel Coordinator
- Interpreter Coordinator
- Medical Reviewer
- Case Manager
- Read Only Auditor

No seed roles are inserted in this sprint. Production roles should be created intentionally during implementation or deployment setup.

## Permission Hierarchy

Permissions support inheritance through `parent_permission_id`.

Permissions include:

- `domain`
- `operation`
- `scope`
- `supports_field_level_security`

Supported scopes are:

- organization
- department
- team
- case
- field

This prepares ICOS for future field-level security without implementing field-level enforcement in this sprint.

## Departments and Teams

Departments represent operational ownership areas such as:

- Executive
- Clinical
- Operations
- Finance
- Travel
- Marketing
- Partner Management
- Hospital Relations
- Support
- Administration
- Audit

Teams allow users to belong to multiple working groups across departments.

Department membership is optional. Team membership is also optional. This keeps the model flexible for small teams while supporting future enterprise operations.

## Operational Workflow

The security model supports daily operational ownership:

1. A user authenticates through Supabase Auth.
2. ICOS identifies the user's `organization_users` record.
3. The system evaluates assigned roles.
4. Roles grant organization-scoped permissions.
5. Permissions determine which operational actions the user may perform.
6. Important access changes are recorded in `access_audit_log`.

The access model is designed to support ownership-sensitive workflows such as:

- approving clinical drafts
- sending hospital packages
- approving hospital submissions
- starting travel coordination
- issuing invoices
- approving commissions
- overriding partner ownership
- overriding commission owner
- reviewing audit history

## Audit and History Rules

Access history must never be deleted.

The migration preserves:

- role assignment history
- team membership history
- session history
- access audit history
- permission grant and revocation history

`access_audit_log` is append-only through RLS policy. Organization members may view and insert access audit records, but no update or delete policy is created.

Future application workflows should write audit records whenever:

- a role is created or changed
- a permission is granted or revoked
- a user is assigned to a role
- a user is removed from a role
- a department or team assignment changes
- access is suspended or revoked
- sensitive operational permissions are used

## RLS Model

Every table has RLS enabled.

Policies use:

```sql
organization_id = public.current_organization_id()
```

`public.current_organization_id()` reads the organization from `auth.jwt().app_metadata.organization_id`.

This means Supabase authentication must place the trusted organization identifier in `app_metadata`, not user-editable metadata.

## Future SSO

Future SSO can map external identities into `auth.users`, then connect those identities to `organization_users`.

Potential integrations:

- enterprise SAML
- OpenID Connect
- identity provider groups
- organization invitation flows

## Future MFA

Future MFA should protect sensitive roles and actions.

Examples:

- commission override
- partner ownership override
- clinical governance approval
- financial settlement approval
- access administration

## Future OAuth

OAuth providers may be used for user sign-in, but OAuth identity should not replace organization-scoped authorization.

Authorization still belongs to ICOS through roles, permissions, teams, and departments.

## Future Azure AD

Azure AD / Microsoft Entra ID may support enterprise organization onboarding.

Future mapping may include:

- Azure groups to ICOS roles
- Azure departments to ICOS departments
- conditional access signals
- enterprise audit synchronization

## Future Google Workspace

Google Workspace may support smaller organizations and operational teams.

Future mapping may include:

- domain-based onboarding
- Google groups to ICOS teams
- calendar and communication integrations

## Future Hospital Identity Federation

Hospital identity federation may allow external hospital users to access restricted workflows.

Hospital users should never receive broad organization access by default. They should receive limited scoped permissions tied to:

- provider
- hospital branch
- case
- referral
- hospital package
- MSO response

## Future API Authentication

Future API authentication should support:

- service accounts
- scoped API keys
- partner integrations
- hospital portal integrations
- audit-visible machine actions

Machine access should still be organization-scoped and audit-visible.

## Warnings

This sprint creates the schema foundation only.

It does not create:

- frontend authentication
- login pages
- invitation flows
- SSO
- MFA
- OAuth
- API keys
- production roles
- production permissions
- seed data

Permission enforcement beyond RLS must be implemented in future application and service layers.
