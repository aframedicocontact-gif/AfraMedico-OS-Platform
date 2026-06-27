# Supabase Migration Execution Plan

AfraMedico OS Platform / ICOS  
Date: 2026-06-27  
Purpose: prepare all backend migrations for execution on a fresh Supabase project.

## Scope

This document is an execution plan only.

It does not create migrations, backend feature tables, frontend code, seed data, Supabase client code, APIs, storage buckets, authentication UI, or external integrations.

The goal is to run the existing backend foundation migrations safely on a new Supabase project and verify that the database foundation is ready to be marked as Backend Foundation v1.0 Frozen.

## 1. Migration Execution Order

Run migrations in chronological filename order.

1. `20260627130000_icos_saas_foundation.sql`
2. `20260627143000_case_workspace_foundation.sql`
3. `20260627160000_clinical_decision_foundation.sql`
4. `20260627180000_hospital_referral_foundation.sql`
5. `20260627190000_patient_travel_coordination_foundation.sql`
6. `20260627200000_finance_commission_foundation.sql`
7. `20260627210000_authentication_operational_access_foundation.sql`
8. `20260627220000_backend_foundation_hardening_1.sql`

Current migration count: 8.

## 2. Dependency Map

### 1. SaaS Foundation

File:

`20260627130000_icos_saas_foundation.sql`

Creates the root platform tables:

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

Everything else depends on this migration.

Important dependencies created:

- `public.current_organization_id()`
- `public.set_updated_at()`
- core `organization_id` tenant boundary
- patient-case relationship
- provider and partner foundations
- base timeline and audit tables

### 2. Case Workspace Foundation

File:

`20260627143000_case_workspace_foundation.sql`

Depends on:

- `organizations`
- `cases`
- `user_profiles`

Creates:

- `case_notes`
- `case_tasks`
- `case_documents`
- `case_messages`

This migration must run before Hospital Referral Foundation because referral documents later reference `case_documents`.

### 3. Clinical Decision Foundation

File:

`20260627160000_clinical_decision_foundation.sql`

Depends on:

- `organizations`
- `patients`
- `cases`
- `providers`
- `user_profiles`

Creates:

- `clinical_reviews`
- `clinical_required_documents`
- `clinical_ai_drafts`
- `clinical_validations`
- `clinical_hospital_packages`
- `clinical_mso_requests`
- `clinical_recommendations`
- `clinical_patient_opinions`

This migration must run before Hospital Referral Foundation because referral providers can link to `clinical_mso_requests`.

### 4. Hospital Referral Foundation

File:

`20260627180000_hospital_referral_foundation.sql`

Depends on:

- SaaS Foundation
- Case Workspace Foundation
- Clinical Decision Foundation

Creates:

- `hospital_referrals`
- `referral_providers`
- `referral_documents`
- `referral_messages`
- `referral_status_history`
- `hospital_quotes`
- `hospital_quote_revisions`
- `hospital_quote_items`
- `hospital_quote_attachments`
- `hospital_quote_approvals`

This migration must run before Finance Foundation because finance records may link to `hospital_quotes` and `hospital_referrals`.

### 5. Patient Travel Coordination Foundation

File:

`20260627190000_patient_travel_coordination_foundation.sql`

Depends on:

- `organizations`
- `patients`
- `cases`
- `user_profiles`
- `case_documents`

Creates:

- `travel_plans`
- `travel_milestones`
- `visa_processes`
- `travel_companions`
- `airport_transfers`
- `hotel_coordination`
- `flight_coordination`
- `interpreter_services`
- `medical_escort_services`
- `travel_documents`

This migration can run after Case Workspace and SaaS Foundation. In the current sequence, it runs after Hospital Referral Foundation and before Finance Foundation.

### 6. Finance & Commission Foundation

File:

`20260627200000_finance_commission_foundation.sql`

Depends on:

- SaaS Foundation
- Hospital Referral Foundation

Creates:

- `case_financials`
- `patient_invoices`
- `invoice_items`
- `patient_payments`
- `hospital_payment_records`
- `partner_commissions`
- `commission_splits`
- `commission_disputes`
- `partner_settlements`
- `financial_audit_events`

Important dependencies:

- `hospital_quotes`
- `hospital_referrals`
- `partners`
- `providers`
- `cases`
- `patients`
- `user_profiles`

### 7. Authentication & Operational Access Foundation

File:

`20260627210000_authentication_operational_access_foundation.sql`

Depends on:

- `organizations`
- `user_profiles`
- `auth.users`

Creates:

- `roles`
- `permissions`
- `role_permissions`
- `organization_users`
- `user_role_assignments`
- `departments`
- `operational_teams`
- `team_members`
- `user_sessions`
- `access_audit_log`

This migration creates operational authorization structure, but full permission enforcement is not implemented yet.

### 8. Backend Foundation Hardening 1

File:

`20260627220000_backend_foundation_hardening_1.sql`

Depends on:

- all earlier migrations

Creates:

- `event_categories`
- `event_types`
- `permission_scopes`
- `role_scope_assignments`

Hardens:

- event taxonomy readiness
- audit/history immutability
- finance quote-to-case relationships
- permission-aware readiness
- composite indexes
- data protection comments

This migration must run last.

## 3. Pre-Run Checklist

Before running migrations, confirm:

- Fresh Supabase project has been created.
- Correct database password is saved securely.
- Project URL is noted.
- Anon key is noted.
- Service role key is secured and not placed in frontend code.
- Supabase SQL Editor access is confirmed.
- No manual tables have been created in the project.
- No production data exists in the project.
- Backup/export plan is understood.
- The operator understands that the first run is a fresh test, not a production data migration.
- The operator understands that `auth.jwt().app_metadata.organization_id` is required for tenant-scoped RLS.

## 4. Execution Method Options

### Option A: Supabase SQL Editor Manual Execution

Use the Supabase dashboard SQL Editor.

Process:

- open one migration file
- copy the full SQL
- paste into SQL Editor
- run it
- verify success
- continue to the next migration

Advantages:

- easiest for first fresh test
- visible error feedback
- no local CLI setup required
- simple manual control

Disadvantages:

- manual process
- no migration history table management through CLI
- more room for copy/paste mistakes

### Option B: Supabase CLI Later

Use Supabase CLI once the project is ready for repeatable local or CI workflows.

Advantages:

- repeatable
- better for teams
- supports local development workflows
- better long-term migration discipline

Disadvantages:

- requires CLI setup
- requires project linking
- requires secure handling of credentials
- should be validated carefully on Windows

### Option C: GitHub CI/CD Future

Use CI/CD to validate and apply migrations in controlled environments.

Advantages:

- strongest long-term discipline
- repeatable migration validation
- reviewable deployment process
- can block unsafe schema changes before production

Disadvantages:

- not needed for the first fresh manual test
- requires environment secrets
- requires branch/deployment strategy
- requires rollback and approval process

## 5. Recommended Current Method

Recommended method for the first fresh test:

```text
Option A: Supabase SQL Editor manual execution
```

Reason:

This is the first full execution of the backend foundation on a fresh Supabase project. The SQL Editor gives immediate feedback, does not require CLI setup, and allows careful validation after each migration.

After the first successful full run, the project should move toward Supabase CLI or CI/CD validation.

## 6. How To Run Manually

1. Open the Supabase dashboard.
2. Select the fresh Supabase project.
3. Open SQL Editor.
4. Open the first migration file locally.
5. Copy the full SQL from the file.
6. Paste it into the SQL Editor.
7. Run the SQL.
8. Confirm the query completed successfully.
9. Verify that the expected tables and policies exist.
10. Save any error message if execution fails.
11. Do not continue to the next migration until the current migration succeeds.
12. Repeat for each migration in chronological order.

Do not skip migrations.

Do not run migrations out of order.

Do not manually edit SQL inside the Supabase SQL Editor unless the edit is also committed back to the repository.

## 7. Post-Run Validation Checklist

After all migrations run successfully, verify:

- Tables exist.
- RLS is enabled on every public table.
- Policies exist.
- Triggers exist.
- Indexes exist.
- Foreign keys exist.
- No seed data was inserted.
- No frontend JSON data was migrated.
- No storage buckets were created by these migrations.
- Audit/history immutability triggers exist.
- Composite indexes from Hardening Sprint 1 exist.
- Event taxonomy tables exist.
- Permission scope helper tables exist.
- A sample organization can be inserted manually later.
- Auth `app_metadata.organization_id` requirement is understood.

Suggested validation queries:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

```sql
select event_object_table, trigger_name
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```

```sql
select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```

No seed data check:

```sql
select 'organizations' as table_name, count(*) from public.organizations
union all
select 'patients', count(*) from public.patients
union all
select 'cases', count(*) from public.cases;
```

Expected result on a fresh migration-only database:

- `0` organizations
- `0` patients
- `0` cases

## 8. Known Risks

### RLS Depends On JWT App Metadata

RLS policies depend on:

```text
auth.jwt().app_metadata.organization_id
```

This must be placed in trusted app metadata, not user-editable metadata.

JWT values may be stale until token refresh. Production access revocation must account for this.

### Permissions Are Structurally Ready But Not Fully Enforced

The backend includes:

- roles
- permissions
- role permissions
- permission scopes
- role scope assignments

However, full permission-aware RLS and service-layer authorization are not implemented yet.

### Storage Buckets Are Not Configured Yet

Document tables store metadata only.

Supabase Storage buckets, storage policies, file upload workflows, file privacy, and document access grants are future work.

### Consent / PHI Module Is Future

The backend does not yet include a full privacy and consent module.

Future work must address:

- patient consent
- PHI protection
- document privacy classification
- retention policy
- jurisdiction-specific healthcare compliance

### No Frontend Is Connected Yet

The current React prototype still uses local JSON.

No frontend code is connected to Supabase yet.

### Manual Execution Can Drift

If SQL is edited manually inside the SQL Editor and not committed back to the repository, the live database can drift from source control.

The repository must remain the source of truth.

## 9. Freeze Condition

Backend Foundation can be marked:

```text
Backend Foundation v1.0 Frozen
```

only after:

1. all eight migrations run successfully on a fresh Supabase project,
2. post-run validation confirms tables, RLS, policies, triggers, indexes, and constraints,
3. no seed data is present unless intentionally inserted after migration validation,
4. the team accepts known Version 1.x follow-up work,
5. the successful run is documented in `docs/backend/Backend-Foundation-v1.0.md`.

Until then, the correct status is:

```text
Backend Foundation v1.0 Candidate
```

## 10. Next Step After Successful Migration

After all migrations run successfully and validation is complete, create:

```text
docs/backend/Backend-Foundation-v1.0.md
```

That document should record:

- Supabase project name
- migration execution date
- migration list
- validation results
- known warnings accepted
- Backend Foundation v1.0 freeze decision
- next backend sprint priorities

## Summary

The recommended first execution path is manual SQL Editor execution, one migration at a time, on a fresh Supabase project.

This is the safest first real test because it keeps the process visible, avoids CLI setup complexity, and allows immediate validation after each migration.

Once the first full run succeeds, ICOS should move toward Supabase CLI and later CI/CD migration validation.
