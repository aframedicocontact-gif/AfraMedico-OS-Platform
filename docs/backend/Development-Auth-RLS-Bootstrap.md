# Development Auth and RLS Bootstrap

Phase 2 Sprint 10 defines the safest development bootstrap flow for Supabase Auth, organization context, and Row Level Security.

This is a development-only process. It does not create production users, does not store passwords, and does not replace the future secure onboarding workflow.

## Goal

Make live Supabase reads and the first controlled timeline write testable in development.

The required chain is:

```text
Supabase Auth user -> user_profiles -> organization_users -> app_metadata.organization_id -> RLS access
```

## 1. Create First Supabase Auth User Manually

In the approved development project:

```text
AfraMedico OS - Development
Project ID: sblaedmxxquiavmfdmwq
```

Create the user manually:

1. Open Supabase Dashboard.
2. Go to Authentication.
3. Create a user with the development admin email.
4. Set the temporary development password outside the repository.
5. Copy the Auth user ID.

Never commit passwords, service role keys, or real secrets.

## 2. Create Or Get AfraMedico Organization Row

Use the development bootstrap SQL template:

```text
supabase/bootstrap/002_development_auth_rls_bootstrap.sql
```

Replace placeholders:

- `AUTH_USER_ID`
- `ORGANIZATION_ID`
- `ADMIN_EMAIL`
- `ADMIN_FULL_NAME`

The organization row represents AfraMedico as the first organization using ICOS.

## 3. Create Matching user_profiles Row

`user_profiles.id` must match `auth.users.id`.

This creates the trusted operational user profile:

```text
user_profiles.id = AUTH_USER_ID
user_profiles.organization_id = ORGANIZATION_ID
```

## 4. Create organization_users Row

`organization_users` connects the Auth user to the tenant organization.

The row should contain:

- `organization_id = ORGANIZATION_ID`
- `user_id = AUTH_USER_ID`
- `profile_id = AUTH_USER_ID`
- `access_status = active`

## 5. Assign Role If Roles Exist

The bootstrap template creates an `organization_administrator` role if it does not exist.

It then creates a `user_role_assignments` row if a matching organization user and role are available.

This is role assignment readiness only. Full frontend permission enforcement is future work.

## 6. Set app_metadata.organization_id

RLS depends on trusted app metadata:

```text
app_metadata.organization_id = ORGANIZATION_ID
```

The template updates:

```text
auth.users.raw_app_meta_data
```

Do not use `user_metadata` for authorization. User metadata can be user-editable and is not safe for tenant isolation.

After updating app metadata, sign out and sign in again so the JWT contains the fresh organization claim.

## 7. Why RLS Depends On app_metadata.organization_id

Backend Foundation v1.0 created:

```sql
public.current_organization_id()
```

That function reads:

```sql
auth.jwt() -> 'app_metadata' ->> 'organization_id'
```

RLS policies compare table `organization_id` against that value.

If the JWT does not include `app_metadata.organization_id`, live reads and writes can fail even when the user is authenticated.

## 8. How To Test timeline_events Insert

After bootstrap:

1. Create `.env.local`.
2. Set `VITE_SUPABASE_URL`.
3. Set `VITE_SUPABASE_ANON_KEY`.
4. Set `VITE_DEV_ORGANIZATION_ID`.
5. Open `/login`.
6. Sign in as the development admin user.
7. Open a live Case Detail Workspace.
8. Open Actions.
9. Click `Add Internal Timeline Note`.

The action writes only to:

```text
public.timeline_events
```

If RLS is configured correctly, the insert should succeed and the Timeline tab should show the new event after refresh.

If it fails, verify:

- Auth user exists.
- `user_profiles.id` matches Auth user ID.
- `organization_users.user_id` matches Auth user ID.
- `auth.users.raw_app_meta_data.organization_id` is set.
- User has signed out and back in after metadata update.
- The target row uses the same `organization_id`.

## Development Boundary

This bootstrap does not:

- create migrations
- modify schema
- create production data
- store passwords
- store service role keys
- enable broad write operations
- replace the future secure onboarding workflow
