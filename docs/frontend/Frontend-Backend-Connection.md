# Frontend Backend Connection

AfraMedico OS Platform / ICOS  
Phase 2: Connect Frontend to Supabase Backend

## Purpose

This phase prepares the React frontend to connect safely to the Supabase Development backend without replacing all local JSON prototype data yet.

Supabase project:

```text
AfraMedico OS - Development
```

Project ID:

```text
sblaedmxxquiavmfdmwq
```

## Environment Variables

Create a local `.env` file from `.env.example`.

Required variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not commit real keys.

Only the anon key belongs in frontend environment variables. Never place the service role key in frontend code.

## Supabase Client

The frontend connection layer starts in:

```text
src/lib/supabaseClient.ts
```

It reads the Vite environment variables and exposes a small request wrapper for Supabase REST queries.

The package `@supabase/supabase-js` should be installed when npm registry access is available. The current wrapper keeps the project build-safe until the package can be installed in this environment.

## Service Layer

Initial service files:

```text
src/services/organizationService.ts
src/services/patientService.ts
src/services/caseService.ts
```

These files create a thin boundary between UI components and backend access.

The UI should call services later instead of querying Supabase directly from page components.

## Backend Health Check

The backend health check utility lives in:

```text
src/lib/backendHealthCheck.ts
```

It checks:

- client wrapper loads
- required environment variables exist
- `public.organizations` can be queried with `limit=1`

Because authentication and `app_metadata.organization_id` are not wired yet, RLS may block live queries until the auth flow exists. This is expected during early Phase 2.

## Why Mock Data Is Not Removed Yet

The current product is still a validated frontend prototype.

Mock JSON data remains in place so:

- existing screens do not break
- module UX can continue evolving
- backend connection can be tested gradually
- live data replacement can happen module by module
- authentication and organization context can be added safely

Do not replace all local JSON at once.

## Next Step

The next backend-connected workflow should be:

```text
Authentication and first live Organization / Patient / Case workflow
```

Recommended order:

1. configure local `.env`
2. install `@supabase/supabase-js`
3. add frontend authentication
4. set or verify `auth.jwt().app_metadata.organization_id`
5. load the current Organization
6. list Patients
7. list Cases
8. connect Case Workspace gradually

## Current Boundary

This phase does not:

- migrate frontend JSON data
- add production data
- redesign the UI
- add service role secrets
- create database migrations
- connect every dashboard
- remove mock data
