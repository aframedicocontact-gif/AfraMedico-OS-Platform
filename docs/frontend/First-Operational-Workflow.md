# First Operational Workflow

Phase 2 Sprint 11 creates the first end-to-end operational workflow in the frontend while preserving mock fallback and avoiding schema changes.

## Goal

The workflow proves that ICOS can move through the first operational chain:

```text
Login
-> Resolve current organization
-> Create Patient
-> Create Case
-> Open Case Workspace
-> Create first Timeline Event
-> Reload and verify persistence
```

## Architecture

The workflow is implemented through existing service boundaries:

- Authentication: `src/services/authService.ts`
- Current organization: `src/services/organizationService.ts`
- Patient creation: `src/services/patientService.ts`
- Case creation: `src/services/caseService.ts`
- Timeline creation: `src/services/timelineService.ts`
- Orchestration: `src/services/operationalWorkflowService.ts`
- Development fallback persistence: `src/lib/developmentOperationalStore.ts`

No new backend tables, migrations, or modules are created.

## Execution Order

1. Check the current Supabase session.
2. Resolve the current organization.
3. Create a Patient.
4. Create a Case linked to the Patient.
5. Create the first Timeline Event linked to the Case and Patient.
6. Re-read the Patient, Case, and Timeline through the service layer.
7. Open the created Case Workspace automatically.

## Live Mode

When Supabase environment variables are configured, the user is signed in, and RLS organization context is valid, the workflow writes to:

- `public.patients`
- `public.cases`
- `public.timeline_events`

The frontend sends the authenticated access token for Supabase REST requests so RLS can evaluate `app_metadata.organization_id`.

## Fallback Behavior

If Supabase is unavailable, the user is not signed in, or RLS blocks the write, the workflow creates development fallback records in browser local storage.

Fallback records are clearly marked as `mock` source by the service layer and survive page reloads in the same browser.

This preserves UX testing without pretending development fallback data is production data.

## Persistence Verification

After creating records, the workflow verifies persistence by reading back:

- Patient by ID
- Case by ID
- Timeline events by Case ID

In live mode this verifies Supabase persistence.

In fallback mode this verifies local development persistence.

## Operational Entry Point

The Case Management page includes a small `Run First Workflow` action. It runs the workflow and opens the created Case Workspace automatically.

The Case Workspace Actions panel also supports `Add Internal Timeline Note` in both live and fallback mode.

## Future Improvements

- Replace the development workflow button with a proper Patient intake form.
- Add production-safe create patient and create case screens.
- Enforce role and permission checks before writes.
- Add visible organization and RLS readiness checks before workflow execution.
- Add server-side audit event creation for patient and case creation.
- Replace browser fallback persistence with real Supabase workflows after auth bootstrap is complete.
- Add automated integration tests against a Supabase development branch.

## Boundaries

This sprint does not:

- create migrations
- modify Supabase schema
- remove mock data
- add destructive writes
- add production patient data
- redesign the application
- create new modules
