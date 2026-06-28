# Organization Management Module

Phase 2 Sprint 5 introduces the first production-ready Organization Management module for AfraMedico OS Platform / ICOS.

This module is built on Backend Foundation v1.0 and does not create new migrations or schema changes.

## Architecture

The module is intentionally layered:

- TypeScript model: `src/types/organization.ts`
- Service layer: `src/services/organizationService.ts`
- Development fallback provider: `src/data/developmentOrganizations.ts`
- Reusable card: `src/components/organizations/OrganizationCard.tsx`
- Page: `src/components/pages/OrganizationsPage.tsx`

The route `/organizations` opens the tenant Organization Management page.

## Service Layer

`organizationService.ts` exposes:

- `getOrganizations()`
- `getOrganizationById()`
- `createOrganization()`
- `updateOrganization()`
- `getCurrentOrganization()`

Read functions try Supabase first and fall back to development data if the backend is unavailable, RLS blocks access, or local environment variables are missing.

Create and update functions are typed for future live Supabase operations. They return readable errors if the backend is unavailable instead of silently writing mock data.

## Mock Mode

Mock mode exists so the UI remains usable before local Supabase authentication and tenant context are fully connected.

The development fallback data represents AfraMedico as the first ICOS organization. It does not replace real tenant data and should not be treated as production data.

## Live Mode

Live mode reads from:

```text
public.organizations
```

Live access depends on:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- authenticated session when required by RLS
- future `app_metadata.organization_id` linkage

## Future CRUD

The service already includes create/update function boundaries. Future UI work can add:

- create organization form
- organization settings page
- plan/status management
- logo management
- organization user management
- role and permission setup

Those features should use the service layer rather than calling Supabase directly from page components.

## Tenant Isolation

Backend Foundation v1.0 is organization-scoped.

Future organization reads and writes must respect:

```text
organization_id
```

Authorization must use trusted app metadata and database membership records, not user-editable metadata.

## Boundary

This sprint does not:

- create migrations
- change Supabase schema
- remove mock JSON data
- protect the whole app
- add production data
- redesign the app shell
