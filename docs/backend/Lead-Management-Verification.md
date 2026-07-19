# Lead Management Verification

Commit reviewed: `f3ab58fcc9fd83e623381d5388859cc9d6c9dfae`
Branch: `feature/supabase-leads-backend`
Verification date: 2026-07-19
Status: Verification complete with local dependency-install blocker

## Summary

The Lead Management Foundation implementation was reviewed after the approved Technical Design Review was saved to `docs/backend/Lead-Management-Technical-Design.md`.

The implementation is architecturally ready for PR review, but the local validation suite could not be completed because dependency installation is blocked by the Windows/npm environment. The repository correctly declares and locks `react-router-dom`; the failure is local dependency materialization, not a missing dependency declaration.

## Dependency Verification

Repository package manager: npm

Lockfile found: `package-lock.json`

`react-router-dom` declaration:

- `package.json`: `react-router-dom` declared under dependencies as `^6.28.2`
- `package-lock.json`: `node_modules/react-router-dom` locked at `6.28.2`

Commands run:

```powershell
npm ci
```

Result: failed because PowerShell blocked the `npm.ps1` shim.

```powershell
npm.cmd ci
```

Result: failed with `EPERM` reading the global npm cache at `C:\Users\user\AppData\Local\npm-cache`.

```powershell
npm.cmd ci --cache .\.npm-cache
```

Result: failed with npm internal error `Exit handler never called!`.

```powershell
npm.cmd install --cache .\.npm-cache
```

Result: failed with npm internal error `Exit handler never called!`.

Post-install state:

- `node_modules/react-router-dom` exists.
- `node_modules/react` exists.
- `node_modules/.bin` is missing.
- `node_modules/typescript/bin/tsc` is missing.
- `node_modules/eslint/bin/eslint.js` is missing.
- `.npm-cache/` is ignored by `.gitignore`.

Conclusion: dependency metadata is correct, but the local install is incomplete because npm cannot complete in this environment.

## Validation Results

### Git Diff Check

Command:

```powershell
git diff --check
```

Result: passed.

### TypeScript Type Check

Command:

```powershell
npx.cmd tsc -b
```

Result: blocked. `npx` attempted to fetch `tsc` from the npm registry and failed with `EACCES`.

### Production Build

Command:

```powershell
npm.cmd run build
```

Result: blocked because the local install is incomplete:

```text
'tsc' is not recognized as an internal or external command
```

### Lint

Command:

```powershell
npm.cmd run lint
```

Result: blocked because the local install is incomplete:

```text
'eslint' is not recognized as an internal or external command
```

### Tests

No test script or dedicated Lead Management test suite is currently configured in `package.json`.

## Migration Review

Migration reviewed:

`supabase/migrations/20260719100000_lead_management_foundation.sql`

### Additive Safety

The migration is additive:

- creates `public.leads`
- creates `public.lead_notes`
- creates `public.lead_activities`
- creates `public.lead_documents`
- creates lead code helper functions
- creates insert/update triggers
- creates indexes
- creates RLS policies
- adds composite unique constraints on existing `partners` and `partner_patient_referrals`

No existing data is deleted or updated. No destructive `drop`, `truncate`, or table rewrite is present.

Warning: the added composite unique constraints on `public.partners(id, organization_id)` and `public.partner_patient_referrals(id, organization_id)` are required for composite foreign keys. They should be safe because `id` is already unique, but the migration should still be run first in the development database before production.

### RLS

RLS is enabled on all four new tables:

- `public.leads`
- `public.lead_notes`
- `public.lead_activities`
- `public.lead_documents`

Policies are scoped to `authenticated` and use:

```sql
organization_id = public.current_organization_id()
```

No `anon` policies are created.

### Partner Portal Direct Access

Partner Portal users have no direct access to the new internal Lead tables as long as partner sessions do not receive the staff organization claim in `app_metadata.organization_id`.

The migration comment explicitly states that partner users keep no `organization_id` app metadata claim and receive no direct RLS access to internal Lead tables.

### Organization Isolation

Organization isolation is enforced through:

- `organization_id` on all new tables
- RLS policies using `public.current_organization_id()`
- composite foreign keys pairing child records with the same `organization_id`

### Composite Foreign Keys

Composite foreign keys are valid against existing unique constraints:

- `patients(id, organization_id)` exists in the SaaS foundation.
- `cases(id, organization_id)` exists in the SaaS foundation.
- `user_profiles(id, organization_id)` exists in the SaaS foundation.
- `partners(id, organization_id)` is added by this migration.
- `partner_patient_referrals(id, organization_id)` is added by this migration.
- `leads(id, organization_id)` is added by this migration.

### Referral Uniqueness

`source_referral_id` is nullable and unique:

```sql
constraint leads_source_referral_unique unique (source_referral_id)
```

PostgreSQL allows multiple `null` values in a unique constraint, so manual/non-referral Leads may coexist. Any non-null referral ID may appear only once, enforcing One Referral -> Maximum One Lead.

### Lead Code Generation

`generate_lead_code()` and `generate_patient_reference_code()` use a year prefix plus 8 uppercase hex characters from `gen_random_uuid()`.

Collision risk is negligible in normal operation and additionally protected by:

- `unique (organization_id, lead_code)`

For very high future volume, this can be hardened with retry-on-unique-violation logic or a sequence-backed code generator.

### Triggers

Triggers reviewed:

- `leads_prepare_insert`: before insert only; normalizes contact fields and assigns generated codes.
- `leads_set_updated_at`: before update only; calls existing `public.set_updated_at()`.
- `lead_notes_set_updated_at`: before update only; calls existing `public.set_updated_at()`.

No trigger updates the same table from inside the trigger body, so no recursion is introduced.

### Check Constraints

Check constraints generally match current frontend mappings:

- `lead_status`: `open`, `on_hold`, `converted`, `closed`
- `pipeline_stage`: backend normalized values for current Lead workflow
- `qualification_status`: review readiness states
- `urgency`: `routine`, `priority`, `urgent`, `unknown`
- `priority`: `Low`, `Medium`, `High`, `Urgent`

Known limitation: frontend has more display statuses than the backend `lead_status`; detailed workflow state is stored in `pipeline_stage`.

### Index Coverage

Indexes support current usage:

- dashboard counts by organization/status/stage/priority
- directory list ordered by created date
- pipeline grouping by stage
- profile lookup by lead ID
- duplicate checks by email, phone, WhatsApp
- referral linkage by `source_referral_id`
- note/activity profile loading by lead ID and timestamp

## Frontend Compatibility Review

Reviewed pages:

- Add Lead
- Lead Dashboard
- Lead Directory
- Lead Pipeline
- Lead Profile

Findings:

- Existing seed/demo Leads remain available only when Supabase is missing in non-production development.
- Production localStorage fallback is disabled by `!import.meta.env.PROD && !supabaseConfig.isConfigured`.
- Loading states are visible on Dashboard, Directory, and Pipeline.
- Supabase errors are surfaced through page-level state banners.
- Empty states are handled in the Directory table.
- Add Lead uses controlled form state and disables the save button while saving.
- Duplicate warnings are shown but do not block save.
- Lead updates call Supabase in live mode and refresh mapped records.
- Normalized `lead_activities` are mapped into the existing activity timeline shape.
- Normalized `lead_notes` are written separately while `internal_summary` remains as a compatibility summary field.
- The Open Case Workspace action is now disabled when no linked Case exists, avoiding the implication that a Case has already been created.

## Transitional Fields Review

The following transitional columns remain in `public.leads`:

- `assigned_coordinator_name`
- `assigned_hospital_name`
- `referral_partner_name`

They are currently required to keep the existing Lead UI operational without introducing new assignment tables, hospital selectors, or partner assignment workflows in this sprint.

The TDR labels these as transitional in the `Implementation Deviations` section and describes the future replacement plan:

- coordinator display name -> `assigned_coordinator_id` joined to `user_profiles`
- hospital display name -> future provider/hospital referral relationship
- referral partner display name -> `partner_id` joined to `partners`

No additional denormalized compatibility columns were added during verification.

## Security Review

Confirmed:

- No service-role key is exposed in frontend code.
- No new frontend secret variables were introduced.
- `organization_id` is not taken from editable Lead form input.
- Staff organization context is resolved from the authenticated session's `app_metadata.organization_id`.
- Internal Lead RLS policies are organization-scoped.
- Partner Portal users should not be able to query Lead tables directly because they should not receive the staff organization claim.
- No public document-storage policy was added.
- No document storage bucket was added.
- No sensitive medical payload is intentionally logged to the browser console by the Lead service.

Security notes:

- RLS depends on correct auth bootstrap and fresh JWTs after `app_metadata.organization_id` changes.
- Future permission-aware RLS should narrow Lead access by department/role once operational roles are enforced.
- Lead document rows are metadata only; storage bucket privacy remains future work.

## Known Limitations

- Local dependency installation is incomplete because npm fails in this environment.
- Build, type-check, and lint must be rerun in a clean dependency environment or CI.
- Partner Referral -> Lead ingestion is not implemented in this sprint.
- Patient and Case conversion are not implemented in this sprint.
- Lead document upload/storage is metadata-only.
- Assignment fields are transitional display fields.
- Live writes require a properly authenticated staff session with `app_metadata.organization_id`.
- No automated tests exist yet for Lead Management.

## Development Supabase Validation

Project name: AfraMedico OS - Development
Project reference: `sblaedmxxquiavmfdmwq`
Supabase organization ID: `hycdpopcwpeogvqyxboh`
Region: `us-east-1`
Validation date: 2026-07-19

### Migration Result

Applied to Development only.

Local migration file:

`supabase/migrations/20260719100000_lead_management_foundation.sql`

Remote migration history entry created by the Supabase connector:

`20260719141159_lead_management_foundation`

Pre-apply check confirmed no existing remote migration conflict with local version `20260719100000`.

Issue found before apply:

- Development already had `partners_id_organization_unique` on `public.partners(id, organization_id)`.

Fix applied before first Development migration run:

- wrapped `partners_id_organization_unique` creation in a catalog existence check
- wrapped `partner_patient_referrals_id_organization_unique` creation in a catalog existence check

This was not a data-model change. It made the migration safe for environments where one support constraint already exists.

### Table Verification

Verified these tables exist:

- `public.leads`
- `public.lead_notes`
- `public.lead_activities`
- `public.lead_documents`

Verified RLS is enabled on all four tables.

Verified functions exist:

- `public.generate_lead_code()`
- `public.generate_patient_reference_code()`
- `public.prepare_lead_insert()`

Verified designed triggers exist:

- `leads_prepare_insert`
- `leads_set_updated_at`
- `lead_notes_set_updated_at`

Verified indexes exist for organization, status/stage, priority, referral linkage, contact duplicate checks, notes, activities, and documents.

Verified constraints exist:

- primary keys on all four new tables
- `leads_id_organization_unique`
- `leads_lead_code_unique`
- `leads_source_referral_unique`
- composite organization-safe foreign keys to patients, partners, partner referrals, user profiles, cases, and child Lead tables
- check constraints for Lead status, pipeline stage, priority, urgency, qualification status, contact method, document status, and file size

`source_referral_id` is unique when present while still allowing multiple `null` values, matching PostgreSQL unique constraint behavior.

### RLS and Security Verification

Verified expected organization-scoped policies exist:

- Leads: select, insert, update
- Lead notes: select, insert, update
- Lead activities: select, insert
- Lead documents: select, insert, update

Verified no Partner Portal direct-access policy exists on the four internal Lead tables.

Controlled authenticated-role validation confirmed:

- a user context with `app_metadata.organization_id = e3b2dddc-9874-4911-b0f0-9dab1dd69248` can create and read its Lead
- a different organization context cannot read the validation Lead
- a Partner Portal-style context without `app_metadata.organization_id` cannot read the validation Lead
- normal authenticated update cannot change the Lead `organization_id` to another organization

No storage policy was added:

- storage bucket count remained available for inspection
- storage policy count was `0`
- Lead-related storage policy count was `0`

No Edge Functions were deployed or modified.

### Functional Test Results

Created one clearly marked Development validation Lead:

- Patient name: `DEV VALIDATION TEST LEAD`
- Email: `dev.validation.lead@example.test`

Verified:

- Lead creation succeeded
- `lead_code` was generated
- `patient_reference_code` was generated
- Lead could be read after creation
- `pipeline_stage` update persisted as `medical_records_pending`
- `lead_status` update persisted as `on_hold`
- `priority` update persisted as `High`
- `next_follow_up_at` persisted
- one Lead note was inserted and read
- one Lead activity was inserted and read

### Existing Data and Integration Safety

Pre/post counts confirmed no unexpected row-count changes to:

- `partner_patient_referrals`: remained `2`
- `partners`: remained `2`
- `partner_agreements`: remained `2`

No existing patient or case data was modified by the validation script.

No Partner Portal Edge Function was deployed or changed.

No storage bucket or storage policy was added.

### Cleanup Result

Removed only the clearly identified validation records:

- deleted Leads: `1`
- deleted Lead notes: `1`
- deleted Lead activities: `1`
- deleted Lead documents: `0`

Fresh post-cleanup verification confirmed:

- remaining validation Leads: `0`
- remaining validation notes: `0`
- remaining validation activities: `0`

### Development Readiness Decision

Development Supabase validation passed after the pre-apply idempotency fix to the support constraints.

Status: Ready for PR review and Development-environment acceptance.

Remaining merge caveat:

- rerun dependency install/build/lint in CI or a clean local environment because this local workstation's npm install remains unreliable.

## Independent CI Validation

Workflow name: PR Validation
Workflow file: `.github/workflows/pr-validation.yml`
Node version: 22
Trigger: pull requests targeting `main`

The repository did not have an existing GitHub Actions workflow directory, so a new PR validation workflow was added.

Expected CI steps:

- `npm ci`
- TypeScript check: no separate `type-check` script is configured; `npm run build` runs `tsc -b`
- `npm run build`
- `npm run lint`
- Tests: no `test` script is configured, so the workflow reports tests as not configured

CI result for PR #1:

- `npm ci`: pending GitHub Actions run
- TypeScript: pending GitHub Actions run
- build: pending GitHub Actions run
- lint: pending GitHub Actions run
- tests: not configured

Final merge readiness:

- Pending independent GitHub Actions result after workflow push.

## Ready for PR Review

Status: Ready for PR review with one validation caveat.

The implementation and migration are ready for reviewer inspection. The blocking item before merge is to rerun:

```powershell
npm ci
npm.cmd run build
npm.cmd run lint
```

in an environment where npm can complete dependency installation.
