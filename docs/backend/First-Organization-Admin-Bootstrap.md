# First Organization and Admin Bootstrap

Phase 2 Sprint 3 defines the first safe development bootstrap path for AfraMedico OS Platform.

This document is for development setup only. It does not create production users, does not store passwords, and does not replace the future controlled onboarding workflow.

## Purpose

The backend foundation is SaaS-ready. Every operational record belongs to an organization. Before the frontend can safely read live data, the development Supabase project needs:

- One AfraMedico organization.
- One Supabase Auth user.
- One matching `user_profiles` row.
- One `organization_users` membership record.
- Initial role assignment readiness.

## Manual Supabase Auth User Creation

Create the first user manually in the Supabase Dashboard:

1. Open the approved development project.
2. Go to Authentication.
3. Create a new user with the development admin email.
4. Set a temporary development password outside the repository.
5. Copy the created Auth user ID.

Never store the password, service role key, or any real secret in this repository.

## Insert AfraMedico Organization

Use the template:

```text
supabase/bootstrap/001_development_aframedico_admin.sql
```

Before running it, replace:

- `ORGANIZATION_ID` with a development UUID for AfraMedico.
- `AUTH_USER_ID` with the Supabase Auth user ID.
- `ADMIN_EMAIL` with the development admin email.
- `ADMIN_FULL_NAME` with the development admin full name.

The organization should represent AfraMedico as the first tenant using ICOS, not the whole ICOS platform.

## Connect auth.users.id to user_profiles.id

`user_profiles.id` is a foreign key to `auth.users(id)`.

That means the Supabase Auth user must exist first. The bootstrap template then inserts:

- `user_profiles.id = AUTH_USER_ID`
- `user_profiles.organization_id = ORGANIZATION_ID`

This links the authenticated identity to the organization-scoped operational profile.

## Set organization_id

The same `ORGANIZATION_ID` must be used for:

- `organizations.id`
- `user_profiles.organization_id`
- `organization_users.organization_id`
- `roles.organization_id`
- `user_role_assignments.organization_id`

This is what keeps the SaaS tenant boundary consistent.

## Future app_metadata.organization_id Configuration

The current RLS foundation uses:

```sql
auth.jwt() -> 'app_metadata' ->> 'organization_id'
```

Future production onboarding must set the user's Supabase `app_metadata.organization_id` to the correct organization UUID.

Authorization must not rely on `user_metadata`, because user metadata can be user-editable. Organization and permission-sensitive claims belong in `app_metadata` or database-controlled records.

## Why This Is Development Bootstrap Only

This process is intentionally manual because the platform is still in frontend-backend transition.

Future production onboarding should be handled through:

- A secure admin workflow.
- Service-role-only backend operations.
- Audit logging.
- Role and permission assignment checks.
- Organization membership validation.

The development bootstrap exists only to create the first safe user-to-organization link for testing live Organization, Patient, and Case workflows.

## Verification Checklist

After running the template in a development project:

- `organizations` contains AfraMedico.
- `user_profiles.id` matches the Supabase Auth user ID.
- `user_profiles.organization_id` matches AfraMedico.
- `organization_users.user_id` matches the Supabase Auth user ID.
- `organization_users.profile_id` matches `user_profiles.id`.
- Initial organization administrator role exists.
- Initial role assignment exists.
- No production data or real secrets were inserted.

## Next Step

After bootstrap, verify login through `/login`, then test the first live Organization / Patient / Case read path while keeping mock data in place.
