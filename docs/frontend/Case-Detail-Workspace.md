# Case Detail Workspace

Phase 2 Sprint 8 introduces a read-only Case Detail Workspace for AfraMedico OS Platform / ICOS.

The workspace is available at:

```text
/cases/:caseId
```

## Purpose

Case Detail Workspace is the operational center for one patient case.

It shows the case identity, patient summary, current operational stage, clinical readiness context, referral placeholders, travel coordination context, finance context, and action placeholders.

This sprint does not enable backend writes.

## Relationship To Case Management

Case Management is the list-level operational view.

Case Detail Workspace is the individual case view.

Case cards link into the detail workspace by `case_id`. The list remains useful for search and filtering, while the detail workspace becomes the place where future operational work will happen.

## Relationship To Clinical Decision Center

Clinical Decision Center belongs to the Case workflow.

Future clinical review records should connect to the Case Detail Workspace through:

```text
case_id
```

The Clinical Review section currently explains the future connection for document completeness, AI draft review, internal validation, hospital package readiness, and MSO preparation.

## Relationship To Hospital Referral

Hospital Referral is case-scoped.

One case may have multiple hospital referrals. The Hospital Referral panel is a placeholder for future referral records, quote status, provider communication, and referral protection evidence.

## Future Live Backend Integration

The workspace currently reads case data through `caseService.ts`.

When Supabase access is unavailable, it falls back to development case data. Future integration should connect:

- case notes
- case tasks
- case documents
- timeline events
- clinical reviews
- hospital referrals
- hospital quotes
- travel plans
- finance records
- audit trail

All records should remain organization-scoped and case-linked.

## Future Write Actions

The Actions panel includes placeholders for:

- Request Missing Documents
- Start Clinical Review
- Prepare Hospital Package
- Send Hospital Referral
- Create Travel Plan
- Review Financials

These buttons intentionally do not perform backend writes in Sprint 8.

Future write actions must include:

- authentication
- organization-aware RLS
- permission checks
- audit trail
- timeline event creation where appropriate

## Boundary

This sprint does not:

- create migrations
- modify Supabase schema
- remove mock data
- add real patient data
- add production data
- enable write operations
- replace the existing legacy Case Workspace module
