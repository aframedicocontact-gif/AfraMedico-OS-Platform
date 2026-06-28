# Case Management Module

Phase 2 Sprint 7 introduces the Case Management module for AfraMedico OS Platform / ICOS.

This module is built on Backend Foundation v1.0 without creating migrations or changing the Supabase schema.

## Architecture

The module follows the frontend-backend transition pattern:

- TypeScript model: `src/types/case.ts`
- Service layer: `src/services/caseService.ts`
- Development fallback data: `src/data/developmentCases.ts`
- Reusable card: `src/components/cases/CaseCard.tsx`
- Status badge: `src/components/cases/CaseStatusBadge.tsx`
- Priority badge: `src/components/cases/CasePriorityBadge.tsx`
- Page: `src/components/pages/CasesPage.tsx`

The route `/cases` opens Case Management.

## Case Service

`caseService.ts` exposes:

- `getCases()`
- `getCaseById()`
- `getCasesByPatientId()`
- `getCasesByOrganization()`
- `createCase()`
- `updateCase()`

Read functions try live Supabase access first and fall back to development cases when:

- environment variables are missing
- RLS blocks access
- backend access is unavailable
- live data has not been created yet

Create and update functions are typed and live-ready. They return readable errors when Supabase is unavailable instead of writing fake local data.

## Mock Fallback

Development case data is fictional and linked to:

- AfraMedico development organization context
- development patient records

No real patient or production data is included.

## Live Supabase Readiness

Live mode reads from:

```text
public.cases
```

Live access depends on:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- authenticated session where RLS requires it
- future `app_metadata.organization_id` linkage
- organization-scoped policies from Backend Foundation v1.0

## Relationship To Patient

The Patient is the long-term identity.

The Case is the operational treatment record.

One Patient may have multiple Cases over time. Case Management must preserve that relationship through:

```text
patient_id
```

## Relationship To Clinical Decision Center

Clinical Decision Center belongs to the Case workflow.

Future clinical reviews should be linked to `case_id` so that document completeness, AI draft review, internal validation, hospital package readiness, and MSO tracking remain connected to one operational case.

## Relationship To Hospital Referral

Hospital Referrals are also case-scoped.

One Case may have multiple Hospital Referrals. Case Management should become the list-level entry point, while Case Workspace remains the single source of truth for deeper hospital referral, quote, timeline, and audit details.

## Future Case Detail Workspace

The existing Case Workspace is the future detailed operational screen.

Future work should connect Case Management cards to Case Workspace by `case_id`, then gradually replace local JSON detail records with live case-linked backend data.

## Boundary

This sprint does not:

- create migrations
- modify Supabase schema
- remove existing mock data
- add real patient data
- add production data
- redesign the app shell
