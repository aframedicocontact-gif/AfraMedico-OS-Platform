# Patient Management Module

Phase 2 Sprint 6 introduces the Patient Management module for AfraMedico OS Platform / ICOS.

This module is built on Backend Foundation v1.0 without creating new migrations or changing the Supabase schema.

## Architecture

The module uses the same frontend-backend transition pattern as Organization Management:

- TypeScript model: `src/types/patient.ts`
- Service layer: `src/services/patientService.ts`
- Development fallback data: `src/data/developmentPatients.ts`
- Reusable UI: `src/components/patients/PatientCard.tsx`
- Status badge: `src/components/patients/PatientStatusBadge.tsx`
- Page: `src/components/pages/PatientsPage.tsx`

The route `/patients` opens Patient Management.

## Patient Service

`patientService.ts` exposes:

- `getPatients()`
- `getPatientById()`
- `createPatient()`
- `updatePatient()`
- `getPatientsByOrganization()`

Read functions attempt live Supabase access first and gracefully fall back to development data when:

- environment variables are missing
- RLS blocks access
- the backend is unavailable
- no live data is returned

Create and update functions are ready for future live Supabase use. They return readable errors when the backend cannot accept writes.

## Backend Foundation Mapping

Backend Foundation v1.0 currently stores core patient identity using `full_name` in the `patients` table. The frontend Patient model exposes `first_name` and `last_name` for future UX readiness.

The service maps live `full_name` values into frontend `first_name` / `last_name` fields without requiring a schema change.

## Mock Fallback

The development patient dataset contains realistic but fictional patient records connected to the AfraMedico development organization context.

No real patient data is included.

Mock data exists only to keep the UI usable while live authentication and tenant context are being connected.

## Live Supabase Readiness

Live mode reads from:

```text
public.patients
```

Live access depends on:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- authenticated session where RLS requires it
- future `app_metadata.organization_id` linkage
- organization-scoped policies from Backend Foundation v1.0

## organization_id Tenant Relationship

Every patient belongs to an organization through:

```text
organization_id
```

Future patient queries must remain organization-scoped. The frontend must not duplicate patient data across modules; modules should reference patient and case IDs.

## Future Patient Profile Page

Future work should add a Patient Profile page that shows:

- long-term patient identity
- contact information
- patient cases
- partner attribution
- timeline
- documents
- audit trail

The profile should remain distinct from Case Workspace because one patient may have multiple cases.

## Future Case Linkage

The next major step is linking Patient Management to Case Management:

- one Patient can have multiple Cases
- Case Workspace is the operational center
- Patient Management is the long-term identity layer
- future modules should preserve this relationship through stable IDs

## Boundary

This sprint does not:

- create migrations
- modify Supabase schema
- remove existing mock data
- add real patient data
- add production data
- redesign the app shell
