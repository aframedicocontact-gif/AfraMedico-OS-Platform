# Local Environment Setup

Phase 2 Sprint 4 connects the frontend to the Supabase Development project without committing secrets.

Supabase project:

```text
AfraMedico OS - Development
Project ID: sblaedmxxquiavmfdmwq
```

## Create `.env.local`

Create a local file at the project root:

```text
.env.local
```

Use `.env.example` as the template.

Required variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEV_ORGANIZATION_ID=
```

`VITE_DEV_ORGANIZATION_ID` is not a secret, but it should still be local to the development setup until the bootstrap flow is finalized.

## Do Not Commit Local Environment Files

Never commit:

```text
.env
.env.local
.env.*.local
```

The repository keeps `.env.example` only as a safe template.

## Where To Find Supabase Values

In the Supabase Dashboard:

1. Open the approved project: `AfraMedico OS - Development`.
2. Confirm the project ID is `sblaedmxxquiavmfdmwq`.
3. Open Project Settings.
4. Open API.
5. Copy the Project URL into `VITE_SUPABASE_URL`.
6. Copy the anon/public key into `VITE_SUPABASE_ANON_KEY`.

Never use the service role key in frontend code.

## Local Validation

After setting `.env.local`, restart the local dev server.

Open:

```text
/login
```

The development login page includes a small backend connection status panel. It checks:

- Supabase environment variables are present.
- the frontend client wrapper initializes.
- `public.organizations` can be queried with `limit=1`.

If the organization query fails, the most likely causes are:

- missing `.env.local` values
- incorrect Supabase project
- RLS requiring an authenticated user with `app_metadata.organization_id`
- Data API access/grants not available for the table

This is expected during the staged frontend-backend connection phase and should be resolved through the first admin/user profile linkage workflow.
