# Hospital Referral Foundation

## Purpose

Backend Sprint 4 creates the Hospital Referral Foundation for AfraMedico OS Platform.

This backend layer models the workflow between Cases and Healthcare Providers. It supports early hospital registration, clinical package referral, quote requests, hospital responses, quote revisions, and quote approvals while preserving history.

## Architecture

The Hospital Referral Foundation is organization-scoped and case-centered.

Core tables:

- `hospital_referrals`
- `referral_providers`
- `referral_documents`
- `referral_messages`
- `referral_status_history`
- `hospital_quotes`
- `hospital_quote_items`
- `hospital_quote_revisions`
- `hospital_quote_attachments`
- `hospital_quote_approvals`

Every table includes `organization_id`.

All tables enable Row Level Security.

RLS uses:

`organization_id = public.current_organization_id()`

Same-organization foreign keys connect referrals to Cases, Patients, Providers, Users, Clinical MSO Requests, Case Documents, Quotes, and Quote Revisions.

## Workflow

The referral workflow is:

1. A Case creates one or more `hospital_referrals`.
2. Each Referral targets one or more Providers through `referral_providers`.
3. Documents and evidence are linked through `referral_documents`.
4. Communication history and internal/external message records are stored in `referral_messages`.
5. Status changes are appended to `referral_status_history`.
6. Providers issue quotes in `hospital_quotes`.
7. Each quote may have multiple immutable `hospital_quote_revisions`.
8. Quote costs are stored as `hospital_quote_items`.
9. Quote evidence is stored as `hospital_quote_attachments`.
10. Quote decisions are stored as `hospital_quote_approvals`.

## Entity Relationships

One Case may have many Hospital Referrals.

One Hospital Referral may target many Providers.

One Referral Provider may issue many Hospital Quotes.

One Hospital Quote may have many Quote Revisions.

One Quote Revision may have many Quote Items and Attachments.

One Quote Revision may have approval decisions.

Status history is timeline-compatible through:

- `case_id`
- `patient_id`
- `event_type`
- `event_title`
- `event_description`
- `changed_by`
- `occurred_at`

## Business Rules

- One Case may have multiple Referrals.
- One Referral may target multiple Providers.
- One Provider may issue multiple Quote revisions.
- Full referral history must be preserved.
- Quote history must be preserved.
- Previous quote versions must never be overwritten.
- Status history is append-only by RLS policy.
- Quote revisions are append-only by RLS policy.
- Referral documents store metadata only and do not create storage buckets.
- Referral messages store communication history only and do not send external messages.

## RLS Policies

Most operational tables use a tenant-scoped manage policy for authenticated organization members.

Append-only history tables use restricted policies:

- `referral_status_history`: select and insert only.
- `hospital_quote_revisions`: select and insert only.

This protects historical referral and quote versions from normal update/delete operations.

## Indexes

Indexes are created for:

- `organization_id`
- `case_id`
- `patient_id`
- `referral_id`
- `referral_provider_id`
- `provider_id`
- `clinical_mso_request_id`
- `hospital_quote_id`
- `quote_revision_id`
- user references
- status fields
- timeline timestamps

## Future Integrations

Future migrations and services may add:

- Hospital portal integrations.
- Email sending.
- WhatsApp integration.
- Provider portal responses.
- Quote comparison engine.
- Clinical package export.
- Storage bucket policies.
- Automated timeline event creation.
- Audit triggers for referral and quote decisions.
- Finance linkage to accepted quotes.
- Patient-facing quote decision workflow.

## Sprint Boundary

This sprint does not add:

- React UI changes.
- Frontend JSON changes.
- Seed data.
- Storage buckets.
- External APIs.
- Email sending.
- WhatsApp sending.
- AI services.
- Payment integrations.
