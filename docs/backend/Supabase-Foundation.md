# Supabase Foundation

## Purpose

Backend Sprint 1 creates the first database foundation for AfraMedico Intelligent Care Operating System (ICOS).

This is the beginning of the SaaS-ready backend architecture. It does not migrate the current frontend JSON prototype into production tables yet. It only creates the core database foundation that future backend work can build upon.

## Why `organization_id` Exists

ICOS is designed as a multi-organization platform.

AfraMedico is the first organization using ICOS, but AfraMedico is not the whole platform.

Every operational table includes `organization_id` so that:

- Each organization owns its own patients, cases, partners, providers, work items, timelines, and audit records.
- Future organizations can use the same ICOS platform without sharing operational data.
- Row Level Security can restrict records by organization.
- Organizational knowledge can grow independently for each tenant.

The `organizations` table itself is the root tenant table. Other core tables point back to it.

## Why ICOS Is SaaS-Ready

ICOS is SaaS-ready because the foundation separates platform technology from organizational knowledge.

The platform can be shared.

The operational knowledge remains organization-specific.

This supports:

- AfraMedico as the first organization.
- Future healthcare organizations with their own branding and workflows.
- Cloud subscription deployments.
- Future independent enterprise deployments.
- Future migration paths where an organization can keep its accumulated operational knowledge.

## AfraMedico Is First, Not Everything

The prototype began as AfraMedico Business Growth OS and evolved into AfraMedico Intelligent Care Operating System (ICOS).

AfraMedico remains the first blossom of ICOS.

The database is intentionally not hard-coded around AfraMedico. The architecture allows new organizations to be added later with their own patients, cases, providers, partners, finances, timelines, and audit trails.

## Tables Created

Backend Sprint 1 creates these foundation tables:

- `organizations`
- `user_profiles`
- `patients`
- `cases`
- `work_items`
- `timeline_events`
- `audit_events`
- `providers`
- `partners`
- `case_provider_links`

## Row Level Security

All foundation tables enable Row Level Security.

Operational tables are restricted by `organization_id`.

The first policy model expects the authenticated user's organization to be available in:

`auth.jwt().app_metadata.organization_id`

This keeps authorization data out of user-editable metadata and prepares the system for future role and access-control work.

The migration also uses same-organization foreign key constraints for core relationships where tenant consistency is critical. This prevents records such as a Case, Work Item, Timeline Event, Audit Event, or Provider Link from pointing to a Patient, Case, or Provider that belongs to another organization.

## Data Seeding

This sprint does not insert production data.

No frontend JSON data was migrated.

No production AfraMedico records were inserted.

An AfraMedico seed organization may be added later when the backend environment, deployment model, and organization onboarding process are confirmed.

## Future Migrations Will Add

Future backend migrations should add:

- Role and permission model.
- Department ownership and handoff rules.
- Lead Management tables.
- Referral Partner CRM tables.
- Referral Protection Engine tables.
- Case Workspace detail tables.
- Clinical Decision Center tables.
- Medical document metadata.
- Healthcare Provider Network detail tables.
- Hospital referrals, MSO requests, and quotes.
- Finance and Commission Center tables.
- Travel and Patient Journey tables.
- Follow-up tables.
- File storage metadata.
- Audit event categories and immutable event rules.
- Organization settings and branding.
- Enterprise deployment configuration.

## Backend Boundary For This Sprint

This sprint creates SQL migration files only.

It does not add:

- React UI changes.
- Supabase client code.
- Authentication UI.
- External APIs.
- AI services.
- OCR.
- PDF generation.
- WhatsApp integration.
- Stripe or payment integration.

The result is a database foundation ready for Supabase review and execution.
