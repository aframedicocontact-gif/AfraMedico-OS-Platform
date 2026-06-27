# Case Workspace Foundation

## Purpose

Backend Sprint 2 adds the first dedicated backend foundation for the ICOS Case Workspace.

The Case Workspace is the operational center of one patient case. It needs backend records for notes, tasks, documents, and internal communication while preserving the SaaS tenant boundary introduced in Backend Sprint 1.

## Tables Created

This sprint introduces:

- `case_notes`
- `case_tasks`
- `case_documents`
- `case_messages`

## Tenant Rule

Every table includes `organization_id`.

Every table links to `cases` through a same-organization foreign key:

`(case_id, organization_id) -> cases(id, organization_id)`

This prevents one organization from accidentally linking workspace records to another organization's Case.

## User Relationship Rule

User fields such as `author_id`, `assigned_to`, `created_by`, `uploaded_by`, `sender_id`, and `recipient_id` use same-organization foreign keys against `user_profiles`.

This keeps Case Workspace activity inside the same organization as the Case.

## RLS Model

All Case Workspace tables enable Row Level Security.

Policies restrict access with:

`organization_id = public.current_organization_id()`

This depends on the Backend Sprint 1 convention that authenticated users carry their organization id in:

`auth.jwt().app_metadata.organization_id`

## What This Sprint Does Not Add

This sprint does not add:

- React UI changes.
- Frontend JSON changes.
- Mock data.
- Supabase client code.
- Storage buckets.
- External messaging integrations.
- WhatsApp.
- Email.
- AI.
- OCR.
- PDF generation.
- Stripe or payment APIs.

`case_documents` stores document metadata only. Actual file storage policy and buckets should be created in a later Storage sprint.

`case_messages` is internal communication only. It is not an external communication integration.

## Future Migrations

Future Case Workspace backend migrations may add:

- Case status history.
- Case ownership handoff records.
- Document versioning.
- Storage bucket policies.
- Task dependencies.
- Message threads.
- Department-specific visibility rules.
- Audit event triggers for important workspace changes.
