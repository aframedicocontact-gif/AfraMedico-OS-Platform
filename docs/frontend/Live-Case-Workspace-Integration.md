# Live Case Workspace Integration

Phase 2 Sprint 9 connects the first operational Case Workspace flow to the live Supabase backend while preserving mock fallback.

Scope:

```text
Organization -> Patient -> Case -> Case Detail -> Timeline
```

## What Is Now Live-Ready

The following service reads are live-ready:

- `getCases()`
- `getCaseById()`
- `getCasesByPatientId()`
- `getCasesByOrganization()`
- `getPatients()`
- `getPatientById()`
- `getPatientsByOrganization()`
- `getTimelineEventsByCaseId()`
- `getTimelineEventsByPatientId()`
- `getTimelineEventsByOrganization()`

The Case Detail Workspace now loads:

- Case by route `caseId`
- related Patient
- related Timeline events

Live reads are attempted first. Development fallback is used when Supabase is unavailable, blocked by RLS, or returns no usable data.

## What Still Uses Fallback

Fallback remains available for:

- development patients
- development cases
- development timeline events

This protects the frontend workflow while the first live organization, admin profile, patients, cases, and timeline data are still being connected.

No mock fallback has been removed.

## organization_id Dependency

Backend Foundation v1.0 is organization-scoped.

Live reads and writes depend on:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- authenticated Supabase session
- trusted `app_metadata.organization_id`
- `VITE_DEV_ORGANIZATION_ID` during development setup

RLS policies use organization context. If that context is missing, live queries may fail and the UI should fall back safely.

## Timeline Event Creation Rule

Sprint 9 adds one controlled write action:

```text
Add Internal Timeline Note
```

This action may write only to:

```text
public.timeline_events
```

The write is allowed only when:

- Supabase is configured
- the user is signed in
- organization context exists
- the loaded case came from live backend data

Fallback/mock cases do not attempt backend writes.

## Why Write Actions Are Limited

Case Workspace will eventually coordinate clinical review, hospital referrals, travel, finance, documents, and audit trail.

Those workflows require:

- permissions
- audit events
- validation
- department ownership
- safer transaction boundaries

Sprint 9 limits writes to timeline notes so the first operational write path can be tested without creating clinical, referral, finance, or travel records prematurely.

## Next Operational Sprint

Recommended next sprint:

```text
Live Case Notes and Tasks Integration
```

That sprint should connect:

- `case_notes`
- `case_tasks`
- ownership fields
- task status updates
- timeline event creation on important task actions

No broader workflow writes should be added until authentication, organization membership, and permission readiness are verified.
