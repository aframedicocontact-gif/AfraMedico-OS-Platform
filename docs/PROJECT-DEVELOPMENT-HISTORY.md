# Project Development History

AfraMedico Business Growth OS evolved into the AfraMedico OS Platform / ICOS: a case-centered operating system for medical tourism, referral protection, clinical decision workflows, provider knowledge, finance, travel coordination, and executive intelligence.

This document is the master development history. It records implemented phases and sprints from repository evidence. Items that could not be verified from files are marked `Needs verification`.

## Current Status

- Product name in current product strategy: AfraMedico Intelligent Care Operating System (ICOS).
- Earlier working name: AfraMedico Business Growth OS.
- Backend Foundation v1.0: Frozen.
- Frontend state: React/Vite prototype plus gradual Supabase connection and serverless Authority Discovery API.
- Data state: local JSON/mock fallback remains active for many modules.
- Production data: none confirmed in repository.
- Source of truth for backend schema: `supabase/migrations/`.

## Phase 1 - Frontend Operating System Prototype

### Sprint: Authority CRM Foundation

- Date: Needs verification.
- Purpose: Create the first frontend-only internal admin prototype for authority targets.
- What changed:
  - Added Dashboard, Organizations List, Organization Details, Add Organization, and CSV import placeholder.
  - Used local JSON data only.
  - Kept Supabase/backend/auth out of the first prototype.
- Files created/modified:
  - `src/components/pages/Dashboard.tsx`
  - `src/components/pages/OrganizationsList.tsx`
  - `src/components/pages/OrganizationDetails.tsx`
  - `src/components/pages/AddOrganization.tsx`
  - `src/components/pages/CsvImport.tsx`
  - `src/data/organizations.json`
- Environment variables: none.
- Database/Supabase changes: none.
- Deployment notes: frontend-only Vite app.
- Known limitations: local data only.
- Current status: implemented.
- Next recommended step: continue replacing mock-only flows with controlled live backend flows.

### Sprint: Mission Control and Core Modules

- Date: Needs verification.
- Purpose: Expand the frontend prototype into a multi-module operating system.
- What changed:
  - Added Mission Control as the home/CEO dashboard.
  - Added Referral Partner CRM, Lead Management, Referral Protection Engine, Case Workspace, Clinical Decision Center, Operations Center, Healthcare Provider Network, and Finance & Commission Center.
  - Added Unified Patient Context and shared operational components.
- Files created/modified:
  - `src/components/pages/MissionControl.tsx`
  - `src/components/pages/ReferralDashboard.tsx`
  - `src/components/pages/PartnerDirectory.tsx`
  - `src/components/pages/LeadDashboard.tsx`
  - `src/components/pages/ProtectionDashboard.tsx`
  - `src/components/pages/CaseProfile.tsx`
  - `src/components/pages/ClinicalDecisionCenter.tsx`
  - `src/components/pages/OperationsCenter.tsx`
  - `src/components/pages/HealthcareProviderNetwork.tsx`
  - `src/components/pages/FinanceCommissionCenter.tsx`
  - `src/components/context/UnifiedPatientContext.tsx`
  - `src/components/layout/AppShell.tsx`
- Environment variables: none.
- Database/Supabase changes: none.
- Deployment notes: Vite frontend.
- Known limitations: largely local data and UI workflows.
- Current status: implemented as frontend prototype.
- Next recommended step: connect operational workflows module by module.

## Phase 1.5 - Product and Architecture Documentation

### Sprint: Living Architecture and Product Documentation

- Date: Needs verification.
- Purpose: Capture business rules, system architecture, product philosophy, and long-term ICOS platform vision.
- What changed:
  - Created architecture docs, product strategy docs, backend docs, and living book manuscript files.
- Files created/modified:
  - `docs/Business-Rules.md`
  - `docs/Architecture.md`
  - `docs/Modules.md`
  - `docs/Roadmap.md`
  - `docs/System-Architecture.md`
  - `docs/ICOS-Platform-Charter.md`
  - `docs/Product/Product-Vision.md`
  - `docs/Product/Product-Roadmap.md`
  - `docs/Product/Competitive-Advantages.md`
  - `docs/book/`
- Environment variables: none.
- Database/Supabase changes: none.
- Deployment notes: documentation only.
- Known limitations: some dates and detailed sprint boundaries need verification from git history.
- Current status: implemented.
- Next recommended step: keep docs updated after each sprint.

## Backend Foundation

### Backend Sprint 1 - ICOS SaaS Foundation

- Date: 2026-06-27.
- Purpose: Create SaaS-ready tenant foundation with `organization_id` on core tables.
- What changed:
  - Added organizations, user profiles, patients, cases, work items, timeline events, audit events, providers, partners, and case-provider links.
- Files created/modified:
  - `supabase/migrations/20260627130000_icos_saas_foundation.sql`
  - `docs/backend/Supabase-Foundation.md`
- Environment variables: none in migration.
- Database/Supabase changes: new organization-scoped tables, RLS, indexes, triggers.
- Deployment notes: migration created for Supabase.
- Known limitations: RLS depends on `auth.jwt().app_metadata.organization_id`.
- Current status: executed successfully on development Supabase project per `docs/backend/Backend-Foundation-v1.0.md`.
- Next recommended step: keep future migrations additive.

### Backend Sprint 2 - Case Workspace Foundation

- Date: 2026-06-27.
- Purpose: Add backend tables for Case Workspace operations.
- What changed:
  - Added case notes, tasks, documents, and internal messages.
- Files created/modified:
  - `supabase/migrations/20260627143000_case_workspace_foundation.sql`
  - `docs/backend/Case-Workspace-Foundation.md`
- Environment variables: none.
- Database/Supabase changes: new case workspace tables with RLS.
- Deployment notes: migration included in Backend Foundation v1.0.
- Known limitations: frontend write actions are limited.
- Current status: executed in development.
- Next recommended step: connect controlled Case Workspace reads/writes.

### Backend Sprint 3 - Clinical Decision Foundation

- Date: 2026-06-27.
- Purpose: Add backend foundation for Clinical Decision Center.
- What changed:
  - Added clinical review backend structure.
- Files created/modified:
  - `supabase/migrations/20260627160000_clinical_decision_foundation.sql`
  - `docs/backend/Clinical-Decision-Foundation.md`
- Environment variables: none.
- Database/Supabase changes: clinical workflow tables.
- Deployment notes: migration included in Backend Foundation v1.0.
- Known limitations: no AI/OCR/storage integration yet.
- Current status: executed in development.
- Next recommended step: connect Clinical Decision Center after auth/RLS and case context are stable.

### Backend Sprint 4 - Hospital Referral Foundation

- Date: 2026-06-27.
- Purpose: Model referrals between cases and healthcare providers.
- What changed:
  - Added hospital referrals, referral providers, referral documents, referral messages, status history, hospital quotes, quote revisions, attachments, and approvals.
- Files created/modified:
  - `supabase/migrations/20260627180000_hospital_referral_foundation.sql`
  - `docs/backend/Hospital-Referral-Foundation.md`
- Environment variables: none.
- Database/Supabase changes: hospital referral and quote tables with history preservation.
- Deployment notes: migration included in Backend Foundation v1.0.
- Known limitations: frontend not fully connected.
- Current status: executed in development.
- Next recommended step: connect Referral Protection and Hospital Referral workflows to live cases.

### Backend Sprint 5 - Patient Travel Coordination Foundation

- Date: 2026-06-27.
- Purpose: Coordinate travel without becoming a booking platform.
- What changed:
  - Added travel plans, milestones, visa processes, companions, transfers, hotel/flight coordination, interpreters, escorts, and travel documents.
- Files created/modified:
  - `supabase/migrations/20260627190000_patient_travel_coordination_foundation.sql`
  - `docs/backend/Patient-Travel-Coordination-Foundation.md`
- Environment variables: none.
- Database/Supabase changes: travel coordination tables.
- Deployment notes: migration included in Backend Foundation v1.0.
- Known limitations: no travel API/affiliate integration.
- Current status: executed in development.
- Next recommended step: add travel workflow UI/backend connection later.

### Backend Sprint 6 - Finance & Commission Foundation

- Date: 2026-06-27.
- Purpose: Add case-based finance and commission backend foundation.
- What changed:
  - Added case financials, invoices, invoice items, payments, hospital payments, partner commissions, splits, disputes, settlements, and financial audit events.
- Files created/modified:
  - `supabase/migrations/20260627200000_finance_commission_foundation.sql`
  - `docs/backend/Finance-Commission-Foundation.md`
- Environment variables: none.
- Database/Supabase changes: finance tables with auditability.
- Deployment notes: migration included in Backend Foundation v1.0.
- Known limitations: no Stripe/Wise/bank integration.
- Current status: executed in development.
- Next recommended step: connect Finance Center only after auth and case ownership are stable.

### Backend Sprint 7 - Authentication & Operational Access Foundation

- Date: 2026-06-27.
- Purpose: Establish backend role, permission, department, team, session, and access audit foundation.
- What changed:
  - Added roles, permissions, role permissions, organization users, user role assignments, departments, teams, team members, sessions, and access audit log.
- Files created/modified:
  - `supabase/migrations/20260627210000_authentication_operational_access_foundation.sql`
  - `docs/backend/Authentication-Operational-Access-Foundation.md`
- Environment variables: none.
- Database/Supabase changes: operational access tables.
- Deployment notes: migration included in Backend Foundation v1.0.
- Known limitations: permission enforcement is structurally ready but not fully connected.
- Current status: executed in development.
- Next recommended step: implement permission-aware frontend/backend access.

### Backend Hardening Sprint 1

- Date: 2026-06-27.
- Purpose: Address architecture review findings before freezing Backend Foundation v1.0.
- What changed:
  - Added event taxonomy, permission scope readiness, audit immutability strengthening, finance relationship hardening, composite indexes, and schema comments.
- Files created/modified:
  - `supabase/migrations/20260627220000_backend_foundation_hardening_1.sql`
  - `docs/backend/Backend-Foundation-Hardening-1.md`
  - `docs/backend/Backend-Architecture-Review-1.0.md`
- Environment variables: none.
- Database/Supabase changes: hardening tables/indexes/comments/policies.
- Deployment notes: migration included in Backend Foundation v1.0.
- Known limitations: consent/PHI/storage remain future work.
- Current status: Backend Foundation v1.0 frozen.
- Next recommended step: create production readiness checklist before production data.

## Supabase Setup and Bootstrap

### Sprint: Migration Execution Plan and Backend Freeze

- Date: 2026-06-27.
- Purpose: Prepare and record successful migration execution on development Supabase project.
- What changed:
  - Created migration execution plan and Backend Foundation v1.0 freeze record.
- Files created/modified:
  - `docs/backend/Supabase-Migration-Execution-Plan.md`
  - `docs/backend/Backend-Foundation-v1.0.md`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_DEV_ORGANIZATION_ID`
- Database/Supabase changes: all 8 migrations executed on `AfraMedico OS - Development` per docs.
- Deployment notes: development backend only.
- Known limitations: no production data; storage/PHI modules incomplete.
- Current status: frozen backend foundation.
- Next recommended step: connect frontend gradually.

### Sprint: Auth/RLS Bootstrap and Development Admin Provisioning

- Date: Needs verification.
- Purpose: Prepare first development admin and organization/RLS linkage.
- What changed:
  - Added bootstrap templates for first organization/admin, auth/RLS, role bootstrap, and admin provisioning.
- Files created/modified:
  - `supabase/bootstrap/001_development_aframedico_admin.sql`
  - `supabase/bootstrap/002_development_auth_rls_bootstrap.sql`
  - `supabase/bootstrap/003_development_admin_provisioning.sql`
  - `supabase/bootstrap/004_development_admin_role_bootstrap.sql`
  - `docs/backend/First-Organization-Admin-Bootstrap.md`
  - `docs/backend/Development-Auth-RLS-Bootstrap.md`
  - `docs/backend/Development-Admin-Provisioning.md`
- Environment variables:
  - `VITE_DEV_ORGANIZATION_ID`
- Database/Supabase changes: bootstrap scripts are templates or development-only SQL; actual execution state needs verification.
- Deployment notes: development only.
- Known limitations: app metadata and role assignment must be verified per user.
- Current status: prepared; execution status needs verification.
- Next recommended step: document exact current development admin state from Supabase.

## Phase 2 - Frontend to Backend Connection

### Sprint 1 - Supabase Client and Service Layer

- Date: Needs verification.
- Purpose: Prepare frontend for Supabase without removing mock data.
- What changed:
  - Added Supabase client wrapper, backend health check, and service layer.
- Files created/modified:
  - `src/lib/supabaseClient.ts`
  - `src/lib/backendHealthCheck.ts`
  - `src/services/organizationService.ts`
  - `src/services/patientService.ts`
  - `src/services/caseService.ts`
  - `docs/frontend/Frontend-Backend-Connection.md`
  - `.env.example`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Database/Supabase changes: none.
- Deployment notes: no secrets committed.
- Known limitations: mock data remains.
- Current status: implemented.
- Next recommended step: continue live reads with fallback.

### Sprint 2 - Supabase Authentication Foundation

- Date: Needs verification.
- Purpose: Add frontend auth service/context and login page.
- What changed:
  - Added auth service, auth context, protected route component, login page, and auth health check.
- Files created/modified:
  - `src/services/authService.ts`
  - `src/contexts/AuthContext.tsx`
  - `src/components/auth/ProtectedRoute.tsx`
  - `src/components/pages/LoginPage.tsx`
  - `src/lib/authHealthCheck.ts`
  - `docs/frontend/Supabase-Authentication-Foundation.md`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_DEV_ORGANIZATION_ID`
- Database/Supabase changes: none.
- Deployment notes: no backend migrations.
- Known limitations: organization/role enforcement still future.
- Current status: implemented.
- Next recommended step: verify valid development admin login and metadata.

### Sprint 4 - Live Supabase Environment Connection

- Date: Needs verification.
- Purpose: Connect frontend config path to the development Supabase project.
- What changed:
  - Added backend connection status and local environment setup docs.
- Files created/modified:
  - `src/components/auth/BackendConnectionStatus.tsx`
  - `src/components/pages/LoginPage.tsx`
  - `src/lib/backendHealthCheck.ts`
  - `docs/frontend/Local-Environment-Setup.md`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_DEV_ORGANIZATION_ID`
- Database/Supabase changes: none.
- Deployment notes: `.env.local` must not be committed.
- Known limitations: live status depends on correct local env.
- Current status: implemented.
- Next recommended step: verify Vercel env variables.

### Sprints 5-9 - Organization, Patient, Case, Case Detail, Timeline Integration

- Date: Needs verification.
- Purpose: Connect the first production-ready data modules while preserving mock fallback.
- What changed:
  - Added Organization Management, Patient Management, Case Management, Case Detail Workspace, timeline service, and live-ready Case Workspace integration.
- Files created/modified:
  - `src/components/pages/OrganizationsPage.tsx`
  - `src/components/pages/PatientsPage.tsx`
  - `src/components/pages/CasesPage.tsx`
  - `src/components/pages/CaseDetailPage.tsx`
  - `src/components/cases/`
  - `src/components/organizations/`
  - `src/components/patients/`
  - `src/services/organizationService.ts`
  - `src/services/patientService.ts`
  - `src/services/caseService.ts`
  - `src/services/timelineService.ts`
  - `docs/frontend/Organization-Module.md`
  - `docs/frontend/Patient-Module.md`
  - `docs/frontend/Case-Module.md`
  - `docs/frontend/Case-Detail-Workspace.md`
  - `docs/frontend/Live-Case-Workspace-Integration.md`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_DEV_ORGANIZATION_ID`
- Database/Supabase changes: none.
- Deployment notes: routes include `/organizations`, `/patients`, `/cases`, and `/cases/:caseId`.
- Known limitations: fallback remains; write operations limited.
- Current status: implemented.
- Next recommended step: verify end-to-end persistence with authenticated user.

### Sprint 10-11 - RLS Health and First Operational Workflow

- Date: Needs verification.
- Purpose: Prepare and test auth/RLS and the first live workflow.
- What changed:
  - Added RLS health check and first operational workflow service/docs.
- Files created/modified:
  - `src/lib/rlsHealthCheck.ts`
  - `src/services/operationalWorkflowService.ts`
  - `docs/frontend/First-Operational-Workflow.md`
  - `docs/backend/Development-Auth-RLS-Bootstrap.md`
- Environment variables:
  - `VITE_DEV_ORGANIZATION_ID`
- Database/Supabase changes: none from app code.
- Deployment notes: requires valid Supabase Auth user and organization metadata.
- Known limitations: live execution depends on correct bootstrap state.
- Current status: implemented as workflow/service foundation; live test status needs verification.
- Next recommended step: run a controlled live workflow test and document result.

### Sprint: Auth Guard and Password Recovery

- Date: Needs verification.
- Purpose: Protect internal admin routes and support Supabase recovery links.
- What changed:
  - Added reset-password handling and route protection behavior in the app shell.
- Files created/modified:
  - `src/app/App.tsx`
  - `src/services/authService.ts`
  - `src/components/pages/ResetPasswordPage.tsx`
  - `src/components/layout/AppShell.tsx`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Database/Supabase changes: none.
- Deployment notes: Vercel should redirect unauthenticated users to `/login`; `/login`, `/reset-password`, and `/auth/callback` remain public.
- Known limitations: current deployed state needs verification after redeploy.
- Current status: implemented in source; deployment status needs verification.
- Next recommended step: verify live Vercel auth guard after deployment.

## Phase 3 - Authority Growth Intelligence

### Sprint 1 - Authority Discovery Engine

- Date: Needs verification.
- Purpose: Add discovery workflow feeding Authority CRM.
- What changed:
  - Added Authority Discovery screen and discovery/import/scoring services.
- Files created/modified:
  - `src/components/pages/AuthorityDiscovery.tsx`
  - `src/services/authorityDiscoveryService.ts`
  - `src/services/authorityScoringService.ts`
  - `src/services/authorityImportService.ts`
  - `src/types/authorityDiscovery.ts`
- Environment variables: none.
- Database/Supabase changes: none.
- Deployment notes: local storage used for imported records/history.
- Known limitations: initial discovery was placeholder-oriented and later corrected.
- Current status: implemented and evolved.
- Next recommended step: continue real provider hardening.

### Sprint 2 - Outreach & Relationship Center

- Date: Needs verification.
- Purpose: Manage relationship lifecycle after importing organizations.
- What changed:
  - Added Outreach Workspace with contacts, communications, tasks, meetings, documents, notes, and history.
- Files created/modified:
  - `src/components/pages/OutreachWorkspace.tsx`
  - `src/services/outreachService.ts`
  - `src/services/relationshipService.ts`
  - `src/services/communicationService.ts`
  - `src/types/outreach.ts`
- Environment variables: none.
- Database/Supabase changes: none.
- Deployment notes: local storage/development services.
- Known limitations: no Gmail/Calendar/WhatsApp integration yet.
- Current status: implemented.
- Next recommended step: connect outreach records to backend after schema/design review.

### Sprint 3 - Opportunity Intelligence Engine

- Date: Needs verification.
- Purpose: Generate business opportunity profiles for Authority CRM organizations.
- What changed:
  - Added Opportunity Intelligence workspace and recommendation/scoring services.
- Files created/modified:
  - `src/components/pages/OpportunityIntelligence.tsx`
  - `src/services/opportunityService.ts`
  - `src/services/opportunityScoringService.ts`
  - `src/services/opportunityRecommendationService.ts`
  - `src/types/opportunity.ts`
- Environment variables: none.
- Database/Supabase changes: none.
- Deployment notes: deterministic/local placeholder intelligence.
- Known limitations: external AI/data providers are not active in this module.
- Current status: implemented.
- Next recommended step: document when real AI should replace deterministic placeholders.

### Sprint 4 - Real Data Cleanup and Link Usability

- Date: Needs verification.
- Purpose: Remove misleading fake data and improve external fields.
- What changed:
  - Cleaned Authority CRM seed data.
  - Added clickable website, LinkedIn, and email fields.
  - Added Treatment / Keyword filter.
  - Added enterprise horizontal table scrolling.
- Files created/modified:
  - `src/data/organizations.json`
  - `src/components/common/ExternalFieldLink.tsx`
  - `src/components/pages/OrganizationsList.tsx`
  - `src/components/pages/OrganizationDetails.tsx`
  - `src/components/pages/OutreachWorkspace.tsx`
  - `src/components/ui/table.tsx`
- Environment variables: none.
- Database/Supabase changes: none.
- Deployment notes: frontend-only.
- Known limitations: seed verification still marked as curated/needs verification.
- Current status: implemented.
- Next recommended step: maintain real-only discovery sources.

## Phase 4 - Real Authority Discovery Engine

### Sprint 1 - Tavily Foundation

- Date: 2026-06-30.
- Purpose: Add secure real web discovery provider.
- What changed:
  - Added Vercel API route for Tavily Search.
  - Added Tavily Web Search provider mode.
  - Results include source URL, snippet, verification status, and raw search source.
  - No frontend secret exposure.
- Files created/modified:
  - `api/authority-discovery/search.js`
  - `src/components/pages/AuthorityDiscovery.tsx`
  - `src/services/authorityDiscoveryService.ts`
  - `src/types/authorityDiscovery.ts`
  - `docs/frontend/Authority-Discovery-Backend.md`
- Environment variables:
  - `SEARCH_PROVIDER=tavily`
  - `TAVILY_API_KEY`
- Database/Supabase changes: none.
- Deployment notes: set server-side Vercel env variables; do not use `VITE_`.
- Known limitations: raw Tavily result normalization is not the same as authoritative entity verification.
- Current status: implemented.
- Next recommended step: verify with a real Tavily key in Vercel.

### Sprint 2 - OpenAI Intelligence Layer

- Date: 2026-06-30.
- Purpose: Transform Tavily results into structured organization intelligence.
- What changed:
  - Added server-side OpenAI analysis service.
  - Added evidence-bound prompt strategy.
  - Added intelligence fields to Discovery Results and imported Authority CRM records.
- Files created/modified:
  - `api/authority-discovery/services/openaiOrganizationAnalysisService.js`
  - `api/authority-discovery/search.js`
  - `src/components/pages/AuthorityDiscovery.tsx`
  - `src/services/authorityDiscoveryService.ts`
  - `src/services/authorityImportService.ts`
  - `src/types/authorityDiscovery.ts`
  - `src/types/organization.ts`
  - `docs/frontend/Authority-Discovery-Backend.md`
- Environment variables:
  - `SEARCH_PROVIDER=tavily`
  - `TAVILY_API_KEY`
  - `AI_PROVIDER=openai`
  - `OPENAI_API_KEY`
- Database/Supabase changes: none.
- Deployment notes: OpenAI runs only inside Vercel API route; no browser key exposure.
- Known limitations:
  - Runtime behavior with real Tavily/OpenAI keys needs verification.
  - Cost estimates need verification against current OpenAI pricing.
  - Results still require human verification.
- Current status: implemented in source.
- Next recommended step: deploy, configure env vars, run controlled test searches, and document observed outputs.

## Current Recommended Next Step

1. Verify current Vercel deployment has the latest auth guard and Authority Discovery API route.
2. Add server-side Vercel variables for Tavily/OpenAI in the correct environment.
3. Test `/api/authority-discovery/search` with a low `maxResults` value.
4. Test Authority Discovery import into local Authority CRM.
5. Decide whether Authority CRM imported intelligence should be persisted to Supabase in a future backend sprint.
