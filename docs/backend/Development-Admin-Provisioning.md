# Development Admin Provisioning

Phase 2 Sprint 10 defines the first safe provisioning path for a development administrator in the frozen Backend Foundation v1.0.

This document is based on inspection of the repository migration files that define the frozen backend schema. No SQL was executed against Supabase while preparing this plan.

## Live Verification Status

The Supabase connector was discovered during this sprint, but the approved Development project ID was not visible in the accessible project list for this session. A direct table-list request against the approved project ID returned a connector permission error.

Because the user explicitly required that SQL must not be executed, RLS policy details and role row availability were verified from migration files rather than by querying `pg_policies` or live table data.

Before running the template, confirm in the Supabase Dashboard that the approved project is selected:

```text
Project: AfraMedico OS - Development
Project ID: sblaedmxxquiavmfdmwq
```

## Target Organization

```text
Organization ID: e3b2dddc-9874-4911-b0f0-9dab1dd69248
Slug: aframedico
Plan: cloud
```

This organization already exists in the Development project and should not be re-created by this provisioning template.

## Required Tables

The following required tables are defined in the backend migrations:

- `auth.users`
- `public.organizations`
- `public.user_profiles`
- `public.organization_users`
- `public.roles`
- `public.user_role_assignments`
- `public.permissions`

The provisioning chain is:

```text
Supabase Auth User
-> user_profiles
-> organization_users
-> user_role_assignments
```

## Verified Table Shape

### user_profiles

`user_profiles.id` is the same UUID as `auth.users.id`.

Required provisioning fields:

- `id`
- `organization_id`
- `full_name`
- `email`
- `role`
- `department`
- `status`

Important constraints:

- `id` references `auth.users(id)` with cascade delete.
- `organization_id` references `organizations(id)`.
- `(id, organization_id)` is unique.
- `status` must be one of `active`, `inactive`, `invited`, or `suspended`.

### organization_users

`organization_users` creates the organization membership record for an authenticated user.

Required provisioning fields:

- `organization_id`
- `user_id`
- `profile_id`
- `employment_status`
- `access_status`
- `joined_at`

Important constraints:

- `user_id` references `auth.users(id)`.
- `(organization_id, user_id)` is unique.
- `(profile_id, organization_id)` references `user_profiles(id, organization_id)`.
- `access_status` must be one of `invited`, `active`, `suspended`, `revoked`, or `archived`.
- `employment_status` must be one of `active`, `inactive`, `contractor`, `external`, or `archived`.

### roles

`roles` is organization-scoped.

Important constraints:

- `organization_id` references `organizations(id)`.
- `(id, organization_id)` is unique.
- `(organization_id, code)` is unique.
- `status` must be one of `active`, `inactive`, or `archived`.

The migrations define the `roles` table but intentionally do not seed role rows. Because this sprint must not modify schema or create new role data automatically, the template resolves an existing active role and assigns it if available.

Preferred role code:

```text
organization_administrator
```

Fallback role codes checked by the template:

```text
super_administrator
org_admin
admin
```

### user_role_assignments

`user_role_assignments` connects organization membership to roles.

Required provisioning fields:

- `organization_id`
- `organization_user_id`
- `role_id`
- `assignment_reason`
- `starts_at`

Important constraints:

- `(organization_user_id, organization_id)` references `organization_users(id, organization_id)`.
- `(role_id, organization_id)` references `roles(id, organization_id)`.
- `assigned_by` is optional and references `user_profiles(id, organization_id)` when provided.
- Assignment and revocation history is preserved.

### permissions

`permissions` is already available for future authorization, but it is not required to connect the first development admin user unless role permissions are also being configured.

The provisioning template does not create permissions.

## Verified RLS Model

The backend foundation defines:

```sql
public.current_organization_id()
```

This function reads:

```sql
auth.jwt() -> 'app_metadata' ->> 'organization_id'
```

The inspected RLS policies use:

```sql
organization_id = public.current_organization_id()
```

RLS is enabled on the required operational access tables:

- `user_profiles`
- `roles`
- `permissions`
- `organization_users`
- `user_role_assignments`

Relevant policies exist for authenticated users to select, insert, and update organization-scoped rows when the row `organization_id` matches `app_metadata.organization_id`.

## RLS Considerations

The development admin user will not pass organization-scoped RLS until Supabase Auth `raw_app_meta_data` contains:

```json
{
  "organization_id": "e3b2dddc-9874-4911-b0f0-9dab1dd69248"
}
```

After updating `raw_app_meta_data`, the user must sign out and sign in again so the JWT includes the fresh organization claim.

Do not use `user_metadata` for authorization. User metadata may be user-editable. Tenant identity and operational authorization belong in `app_metadata` and database-controlled tables.

## Required Insert Order

1. Confirm the Supabase Auth user exists.
2. Confirm the organization exists:
   - `organizations.id = e3b2dddc-9874-4911-b0f0-9dab1dd69248`
   - `organizations.slug = aframedico`
3. Insert or update `user_profiles`.
4. Insert or update `organization_users`.
5. Resolve an existing active role in `roles`.
6. Insert `user_role_assignments` only if a role exists and no active assignment already exists.
7. Update `auth.users.raw_app_meta_data.organization_id`.
8. Sign out and sign in again.
9. Validate RLS reads.

## Required Inserts

The provisioning template creates or updates:

- One `user_profiles` row for the Auth user.
- One `organization_users` row for organization membership.
- One `user_role_assignments` row only if an active admin role already exists.
- One `auth.users.raw_app_meta_data` update for the organization claim.

The provisioning template does not:

- create a Supabase Auth user
- create an organization
- create roles
- create permissions
- create migrations
- modify schema
- insert production data
- store passwords or service role keys

## Template SQL

Use:

```text
supabase/bootstrap/003_development_admin_provisioning.sql
```

Replace placeholders before running:

- `AUTH_USER_ID`
- `ADMIN_EMAIL`
- `ADMIN_NAME`

The Organization ID is intentionally hardcoded to the approved Development organization:

```text
e3b2dddc-9874-4911-b0f0-9dab1dd69248
```

## Validation Checklist

After running the template in the approved Development Supabase project:

- The Auth user exists in `auth.users`.
- `auth.users.raw_app_meta_data.organization_id` equals `e3b2dddc-9874-4911-b0f0-9dab1dd69248`.
- `user_profiles.id` equals the Auth user ID.
- `user_profiles.organization_id` equals the AfraMedico organization ID.
- `organization_users.user_id` equals the Auth user ID.
- `organization_users.profile_id` equals `user_profiles.id`.
- `organization_users.access_status` is `active`.
- If an active admin role exists, `user_role_assignments` contains one active assignment.
- If no admin role exists, role assignment is intentionally skipped and should be handled through a controlled role bootstrap.
- The user signs out and signs in again.
- Authenticated reads against `organizations`, `user_profiles`, `organization_users`, and `cases` work under RLS.

## Warnings

- Role rows were not seeded by the frozen migrations.
- If no active admin role exists, the user can still have a profile and organization membership, but no role assignment will be created by this template.
- RLS depends on JWT app metadata, so stale sessions may fail until the user signs in again.
- This is a development bootstrap process only. Production onboarding must use a secure backend workflow, strict audit logging, and controlled role assignment.
