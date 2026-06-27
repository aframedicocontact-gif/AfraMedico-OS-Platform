# Backend Foundation Hardening 1

Date: 2026-06-27  
Migration: `20260627220000_backend_foundation_hardening_1.sql`

## Purpose

Backend Hardening Sprint 1 addresses the highest-priority findings from Backend Architecture Review 1.0 before freezing the Backend Foundation as Version 1.0.

This sprint does not introduce frontend changes, APIs, Supabase client code, AI services, storage buckets, seed data, or external integrations.

It strengthens the existing foundation in six areas:

1. Unified event taxonomy
2. Stronger audit immutability
3. Permission-aware readiness
4. Finance relationship hardening
5. Composite index coverage
6. Data protection readiness

## Tables Created

### `event_categories`

Organization-scoped event category catalog.

Purpose:

- Groups event types by operational domain.
- Supports future timeline, audit, referral, travel, finance, and access event normalization.
- Includes sensitivity and retention classification.

### `event_types`

Organization-scoped canonical event type catalog.

Purpose:

- Defines normalized event types.
- Allows events to be marked as audit events or timeline events.
- Tracks whether reason or evidence should be required.
- Supports retention classes such as clinical, financial, legal, access, and permanent.

Existing text fields such as `timeline_events.event_type`, `audit_events.action`, and `financial_audit_events.action` remain in place for compatibility. This sprint adds optional `event_type_id` links without migrating existing data.

### `permission_scopes`

Future permission-aware RLS helper table.

Purpose:

- Defines access scopes for organization, module, department, team, case, and field.
- Supports future operational authorization without implementing full permission enforcement in this sprint.
- Includes sensitivity classification.

### `role_scope_assignments`

Future role-to-scope assignment table.

Purpose:

- Allows Roles and optional Permissions to be assigned to scoped operational areas.
- Supports future department, team, case, and field-level access control.
- Preserves assignment, expiration, and revocation history.

## Unified Event Taxonomy

The migration adds optional `event_type_id` columns to:

- `timeline_events`
- `audit_events`
- `access_audit_log`
- `financial_audit_events`
- `referral_status_history`
- `travel_milestones`

This creates a shared event strategy while avoiding a risky migration of existing text event fields.

Future application code should write both:

- the legacy text value for compatibility
- the normalized `event_type_id` for analytics, workflow automation, and AI readiness

## Stronger Audit Immutability

The migration adds trigger-level immutability for:

- `audit_events`
- `financial_audit_events`
- `access_audit_log`
- `referral_status_history`
- `hospital_quote_revisions`
- `travel_milestones`

These records cannot be updated or deleted through normal SQL once inserted.

Corrections must be made by inserting a new event that explains the correction. This supports the ICOS rule:

```text
Never overwrite history.
```

## Permission-Aware Readiness

This sprint does not fully implement permission-aware RLS.

It adds the minimum backend structure needed for future authorization:

- scoped permissions
- role-to-scope assignments
- module, department, team, case, and field scopes
- active/revoked assignment history

Future hardening should connect these tables to:

- RLS helper functions
- application-level authorization checks
- operational approval flows
- access audit records

## Finance Relationship Hardening

The migration tightens relationships between:

- accepted quotes
- `case_financials`
- `patient_invoices`
- `hospital_quotes`
- `partner_commissions`
- `hospital_referrals`

Added protections:

- accepted quote on `case_financials` must belong to the same Case and Organization.
- accepted quote on `patient_invoices` must belong to the same Case and Organization.
- commission-linked hospital referral must belong to the same Case and Organization.
- commission override records require an override reason.

This reduces the risk of a quote, invoice, financial baseline, or commission being accidentally linked to the wrong Case.

## Composite Indexes

The migration adds tenant-scoped composite indexes for common SaaS queries.

Examples:

- `cases (organization_id, status, priority)`
- `cases (organization_id, current_owner_id, status)`
- `timeline_events (organization_id, case_id, created_at desc)`
- `audit_events (organization_id, case_id, created_at desc)`
- `work_items (organization_id, owner_id, status, due_date)`
- `case_tasks (organization_id, assigned_to, status, due_date)`
- `clinical_reviews (organization_id, review_status, urgency)`
- `hospital_referrals (organization_id, case_id, referral_status)`
- `hospital_quotes (organization_id, case_id, quote_status)`
- `travel_plans (organization_id, case_id, travel_status)`
- `patient_invoices (organization_id, invoice_status, due_date)`
- `partner_commissions (organization_id, partner_id, commission_status)`
- `access_audit_log (organization_id, created_at desc)`

These indexes prepare the backend for dashboards, operational queues, timeline views, audit review, and case workspaces.

## Data Protection Readiness

This sprint does not create a full privacy or consent module.

It adds schema comments clarifying that future backend work must handle:

- patient consent
- PHI protection
- document privacy
- document sensitivity
- storage access policy
- retention policy
- patient access rights
- access audit

Future privacy foundations should include dedicated tables for consent, privacy classification, data retention, document access grants, and jurisdiction-specific compliance requirements.

## RLS

RLS is enabled on all new tables:

- `event_categories`
- `event_types`
- `permission_scopes`
- `role_scope_assignments`

Policies are organization-scoped using:

```sql
organization_id = public.current_organization_id()
```

No delete policies are created for the new tables.

## No Seed Data

This sprint intentionally adds no seed data.

Event categories, event types, scopes, and role scope assignments should be created intentionally during controlled setup or future administration workflows.

## What This Sprint Does Not Do

This sprint does not:

- implement frontend authentication
- enforce full role/permission authorization
- create APIs
- create storage buckets
- add AI services
- migrate existing event data
- create consent tables
- create privacy policy tables
- create production event types
- create production roles or permissions
- create seed data

## Remaining Warnings

The backend is stronger after this sprint, but still not fully production-ready until the following are completed:

- permission-aware RLS or service-layer authorization
- consent and PHI protection module
- document storage policies
- backup and disaster recovery runbooks
- migration CI validation against a fresh Supabase database
- duplicate review and attribution protection backend
- Healthcare Provider Network detail tables
- AI provenance tables before AI integration

## Freeze Recommendation

After Backend Hardening Sprint 1, the Backend Foundation can be frozen as:

```text
Backend Foundation v1.0 Candidate
```

It should become final Backend Foundation v1.0 only after:

1. the hardening migration is run successfully against a fresh Supabase project,
2. migration validation is added to the development workflow,
3. the team accepts that full permission enforcement, privacy/consent, storage, attribution, and AI provenance are Version 1.x follow-up foundations.

The conceptual foundation is ready to freeze. The production foundation still needs operational validation.
