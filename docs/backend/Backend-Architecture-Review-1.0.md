# Backend Architecture Review 1.0

AfraMedico OS Platform / ICOS  
Date: 2026-06-27  
Scope: Supabase migrations, backend documentation, product architecture documentation, and current backend foundation through Backend Sprint 7.

## Executive Summary

The backend foundation is strategically strong. It correctly treats ICOS as a SaaS-ready, case-centered operating system rather than a generic CRM. The architecture consistently uses `organization_id`, stable IDs, same-organization foreign keys, RLS, audit/timeline concepts, and module-specific operational tables.

The current foundation is suitable as a Version 1.0 conceptual backend baseline, but it should not be considered production-ready until a hardening sprint addresses authorization depth, immutability, event strategy, relationship constraints, composite indexes, backup/DR, storage governance, and operational test coverage.

The most important architectural strength is that the Case is already the central operational object. The most important architectural risk is that RLS currently restricts tenants but does not yet enforce true role/permission-based authorization.

## Repository Scope Reviewed

Reviewed migration files:

- `20260627130000_icos_saas_foundation.sql`
- `20260627143000_case_workspace_foundation.sql`
- `20260627160000_clinical_decision_foundation.sql`
- `20260627180000_hospital_referral_foundation.sql`
- `20260627190000_patient_travel_coordination_foundation.sql`
- `20260627200000_finance_commission_foundation.sql`
- `20260627210000_authentication_operational_access_foundation.sql`

Reviewed backend documentation:

- `Supabase-Foundation.md`
- `Case-Workspace-Foundation.md`
- `Clinical-Decision-Foundation.md`
- `Hospital-Referral-Foundation.md`
- `Patient-Travel-Coordination-Foundation.md`
- `Finance-Commission-Foundation.md`
- `Authentication-Operational-Access-Foundation.md`

Reviewed architecture/product documentation themes:

- System architecture
- Domain model
- clinical workflow
- patient journey
- healthcare provider network
- business rules
- decision log
- product roadmap
- platform charter

Note: this review was performed from repository files. It did not apply migrations to a live Supabase database.

## Current Backend Inventory

The backend foundation currently defines 62 public tables across seven migrations.

| Area | Tables | RLS | Policy Pattern |
| --- | ---: | ---: | --- |
| SaaS Foundation | 10 | 10/10 | Organization-scoped |
| Case Workspace | 4 | 4/4 | Organization-scoped |
| Clinical Decision | 8 | 8/8 | Organization-scoped |
| Hospital Referral | 10 | 10/10 | Organization-scoped, append-only status/revision tables |
| Patient Travel Coordination | 10 | 10/10 | Organization-scoped, append-only milestones |
| Finance & Commission | 10 | 10/10 | Organization-scoped, append-only financial audit |
| Authentication & Operational Access | 10 | 10/10 | Organization-scoped, append-only access audit |

No seed data is present in the reviewed migrations.

## Review Perspectives

### 1. Enterprise Software Architect

ICOS has a coherent enterprise domain model. The system is organized around durable business concepts: Organization, Patient, Case, Provider, Partner, Referral, Quote, Clinical Review, Travel Plan, Invoice, Commission, Role, Permission, and Audit.

The strongest enterprise choice is the separation between Patient and Case. This supports long-term patient identity while allowing multiple treatment journeys over time.

The main enterprise gap is that workflow orchestration is implied but not yet formally modeled. There are work items, timelines, status fields, and module-specific records, but no canonical workflow state machine, transition model, or handoff ledger in the backend foundation.

### 2. PostgreSQL Architect

The schema uses UUID primary keys, foreign keys, check constraints, uniqueness constraints, and indexes broadly. Same-organization foreign keys are used in many critical relationships, which is a strong tenant-isolation design.

The schema is generally normalized enough for a foundation. However, status/type values are mostly stored as text with check constraints. This is acceptable early, but production will need a deliberate choice between check constraints, enum types, or organization-configurable lookup tables.

Several important relationships should be tightened before production. For example, finance tables link accepted quotes by `(quote_id, organization_id)` but should also enforce that accepted quotes belong to the same Case when used as a case financial baseline or invoice baseline.

### 3. Supabase Architect

All public tables enable RLS, and policies avoid deprecated `auth.role()` usage. Policies use `TO authenticated` with `organization_id = public.current_organization_id()`, which is the right first tenant boundary.

The key Supabase risk is that `public.current_organization_id()` depends on `auth.jwt().app_metadata.organization_id`. That is correct because app metadata is trusted, but JWT claims can become stale until token refresh. The documentation correctly mentions this dependency, but future production design should decide how membership status, revoked access, and active session state will be enforced beyond JWT claims.

The current RLS model is tenant-safe but not yet permission-aware. Once roles and permissions exist, RLS or service-layer policies must enforce operational permissions, not only organization membership.

### 4. SaaS Architect

The platform is SaaS-ready in its foundation because every core table includes `organization_id`, and the documentation clearly positions AfraMedico as the first organization, not the whole platform.

The missing SaaS pieces are operational provisioning, plan limits, data retention policies, organization-level settings, subscription/account lifecycle, tenant export, tenant deletion/archive policy, and environment promotion strategy.

The architecture should continue to treat organizational knowledge as tenant-owned. This principle is already well represented in the docs.

### 5. Healthcare Information Systems Architect

The architecture reflects real medical tourism operations better than a generic healthcare CRM. It recognizes patient identity, multiple cases, medical review, hospital referrals, MSO/quote workflow, travel coordination, documents, finance, partner commissions, and audit needs.

However, the healthcare layer is not yet a regulated clinical record system. Missing production concerns include consent, privacy classification, medical document provenance, clinical sign-off semantics, data retention, patient access rights, PHI handling, emergency contact handling, DOB/gender/national ID fields, and jurisdiction-specific compliance mapping.

Clinical AI is correctly treated as future-assisted decision support rather than autonomous decision-making.

### 6. Security Architect

The security posture is directionally strong: RLS is enabled, no service role is exposed, no auth UI is added, no seed users are inserted, and access audit tables are introduced.

The main security weakness is broad organization-member access. Current policies allow any authenticated user with the correct organization claim to manage many records. This is acceptable for a schema foundation, but it is not acceptable for production.

The second security weakness is that some foundational tables still have delete policies. This conflicts with the business principle of never overwriting or losing history.

### 7. Performance Engineer

The schema has many indexes, which is good for early query flexibility. But most indexes are single-column indexes. In a tenant-scoped SaaS system, common access patterns will usually filter by `organization_id` plus another dimension such as `case_id`, `status`, `owner_id`, `due_date`, or `created_at`.

Future production performance should add composite indexes based on real queries:

- `(organization_id, case_id)`
- `(organization_id, patient_id)`
- `(organization_id, status)`
- `(organization_id, due_date)`
- `(organization_id, created_at desc)`
- `(organization_id, owner_id, status)`
- `(organization_id, provider_id, status)`
- `(organization_id, partner_id, commission_status)`

Append-only timeline/audit tables may grow quickly and should eventually receive partitioning or archive strategy.

### 8. DevOps Architect

Migration structure is readable and sprint-based. It is easy to understand product evolution from the migration filenames and backend docs.

The DevOps gap is lack of executable verification in the repo. There is no migration test harness, no CI validation of SQL syntax, no local Supabase reset check, no generated schema snapshot, and no documented backup/restore playbook.

Before production, migrations should be validated in CI against a fresh Supabase/Postgres instance.

### 9. AI Systems Architect

The architecture is AI-ready without being AI-dependent. Clinical AI draft records, document metadata, provider performance history, timeline events, and audit logs create future AI surfaces.

Good future AI opportunities include:

- document extraction
- missing document detection
- clinical summarization
- hospital recommendation
- provider performance ranking
- quote comparison
- revenue risk alerts
- executive recommendations
- patient journey risk detection

The main AI gap is absence of a formal AI artifact model covering prompt version, model version, source documents, reviewer correction, confidence, evidence, human approval, and final decision linkage.

### 10. CTO

The backend foundation is commercially promising. It captures the hard operational truths that differentiate ICOS: case-centered care, partner protection, early hospital registration, healthcare provider knowledge, clinical decision workflow, finance/commission traceability, and operational access.

The CTO recommendation is to freeze the conceptual foundation as Backend Foundation v1.0 only after a hardening sprint. Do not start production data migration until the highest-risk schema issues are resolved.

## Overall Architecture

The architecture has five strong layers:

1. SaaS tenancy through `organizations`.
2. Patient and Case domain foundation.
3. Operational modules connected by Case.
4. Timeline and audit history.
5. Future intelligence surfaces.

The model is appropriately modular. Each sprint adds a bounded operational area while preserving the Case as the central connection point.

## Multi-Tenant Design

Strengths:

- Every reviewed table includes `organization_id`.
- RLS is enabled on every table.
- Most key relationships include same-organization foreign keys.
- Documentation consistently explains AfraMedico as the first tenant, not the whole platform.

Risks:

- RLS depends on JWT app metadata.
- Active organization membership is not yet validated in RLS.
- Suspended users may retain access until token refresh unless future controls are added.
- There is no organization settings or tenant configuration table yet.

## Table Normalization

The schema is generally normalized across major domains. Case, Patient, Provider, Partner, Quote, Review, Invoice, Payment, Commission, Role, and Permission are separated.

Potential over-duplication:

- `work_items` and `case_tasks` overlap.
- `timeline_events`, module status history tables, and audit tables are related but not unified.
- provider knowledge is still shallow in backend tables compared with the Healthcare Provider Network architecture document.

Potential under-normalization:

- Many status/type fields are free text constrained by check constraints.
- evidence is often stored as text instead of a structured evidence/document reference.
- external contact identities are not yet normalized.

## Relationships and Foreign Keys

Strengths:

- Strong use of same-organization FKs.
- Case-to-patient relationship is enforced.
- Clinical reviews, referrals, finance, travel, and access records mostly preserve tenant scope.

Weaknesses:

- Some accepted quote links should include `case_id` in the FK to ensure the quote belongs to the same Case.
- Some user references point to `user_profiles`, while newer access architecture introduces `organization_users`; future consistency is needed.
- Partner attribution and referral protection concepts are not yet fully represented in backend relationships.

## Index Strategy

Strengths:

- Core foreign keys and statuses are indexed.
- Large operational modules have broad index coverage.

Weaknesses:

- Many indexes are single-column and may not match tenant-scoped query patterns.
- High-volume tables need composite indexes.
- Append-only audit/timeline/status tables need growth planning.
- No partial indexes for active role assignments, open tasks, pending reviews, overdue deadlines, or unresolved disputes yet.

## RLS Strategy

Strengths:

- RLS is consistently enabled.
- Policies use `TO authenticated`.
- Policies scope by `organization_id`.
- No seed data weakens tenant isolation.

Weaknesses:

- RLS is not yet permission-aware.
- Several older tables allow deletes by organization members.
- service role bypass behavior is not addressed in audit strategy.
- No policy checks active user membership, access status, department, team, or role.

## Audit Strategy

Strengths:

- `audit_events`
- `financial_audit_events`
- `access_audit_log`
- referral status history
- quote revisions
- travel milestones
- timeline events

Weaknesses:

- Audit is not automatic.
- Audit taxonomy is not unified.
- Some tables allow update/delete even where history should be immutable.
- Evidence references are not standardized.

## Timeline Strategy

The presence of `timeline_events` is excellent. It gives the Case a chronological operating memory.

The next step should be a unified event model that connects all operational domains:

- clinical
- hospital referral
- finance
- travel
- access
- documents
- communications
- partner attribution
- patient journey

## Knowledge Accumulation

ICOS is already designed around knowledge accumulation. The best examples are:

- provider knowledge grows from Cases
- clinical decisions produce reusable patterns
- finance and commission events preserve commercial memory
- audit records preserve decisions
- timeline events preserve operational chronology

The missing backend piece is a structured knowledge layer that can connect insights, evidence, outcomes, and recommendations back to source events.

## Provider Network

The Provider foundation currently includes `providers` and `case_provider_links`. The documentation describes a richer Healthcare Provider Network than the backend currently implements.

Missing provider entities:

- provider organization hierarchy
- hospital branches
- departments
- treatment programs
- physicians
- coordinators
- regional contacts
- provider performance records
- provider relationship notes

Recommendation: keep the current lightweight provider model, but add HPN detail tables before production use of provider intelligence.

## Referral Workflow

The referral foundation is strong. It supports:

- multiple referrals per Case
- multiple providers per referral
- referral documents
- referral messages
- status history
- hospital quotes
- quote revisions
- quote approvals

This is one of the strongest modules in the backend.

Main gaps:

- duplicate review center is not fully modeled.
- commission ownership decision workflow is only partially connected.
- referral protection evidence should be standardized.

## Clinical Workflow

The Clinical Decision foundation is well aligned with the product strategy. It includes:

- reviews
- required documents
- AI drafts
- validations
- hospital packages
- MSO requests
- recommendations
- patient opinions

The key strength is that Medical Review belongs to the Case, not directly to the Patient.

Main gaps:

- no clinical consent model
- no clinical governance versioning
- no structured medical terminology layer
- no document-to-review evidence bridge beyond planned future work
- no AI provenance model yet

## Finance Workflow

The Finance foundation is strong and case-centered. It supports:

- case financials
- invoices
- invoice items
- patient payments
- hospital payments
- partner commissions
- commission splits
- disputes
- settlements
- financial audit events

Important gap:

- accepted quote relationships should enforce same-case linkage.

Commercially, this module is important and should be hardened before production because errors here directly affect revenue, partner trust, and disputes.

## Travel Workflow

The Travel foundation correctly treats ICOS as a coordination platform, not a booking platform.

Strengths:

- visa process
- companions
- transfers
- hotel coordination
- flight coordination
- interpreter services
- medical escort services
- travel documents
- append-only milestones

Main gaps:

- travel risk assessment
- medical fitness-to-fly approval link
- external provider relationship model
- travel consent and liability boundaries

## Authentication Model

The Authentication & Operational Access foundation introduces the right primitives:

- roles
- permissions
- role permissions
- organization users
- role assignments
- departments
- teams
- sessions
- access audit

The model correctly separates authentication from authorization.

Main gap:

- RLS does not yet evaluate roles or permissions.

## Permission Model

The permission model is promising because it supports:

- role hierarchy
- permission hierarchy
- domains
- operations
- scopes
- future field-level security

Important redesign consideration:

- `role_permissions` currently uses one unique row per role/permission. If revoked grants must remain historical and later be re-granted, use an active-period model or partial unique index for active assignments instead of a permanent unique pair.

## Extensibility

The platform is highly extensible because modules connect through stable IDs and the Case.

Future extensions can be added for:

- Attribution Protection Layer
- Patient Journey backend
- Provider Network detail
- communications
- document storage
- analytics
- AI artifacts
- portals
- workflow engine

## API Readiness

The schema is almost API-ready for internal modules. Supabase Data API can expose the tables, but production API readiness needs:

- explicit grants strategy
- service-layer authorization
- endpoint-level audit behavior
- validation layer
- rate limits
- idempotency keys for external integrations
- stable API naming conventions
- pagination and filtering standards

## AI Readiness

AI readiness is good conceptually and moderate structurally.

Strong foundations:

- clinical AI draft records
- document metadata
- timeline history
- provider performance potential
- case-centered context

Missing AI foundations:

- embedding/vector tables
- model run records
- prompt templates
- AI provenance
- reviewer correction dataset
- red flag classification
- hallucination/quality review
- human approval checkpoints across every AI-sensitive flow

## Scalability

The architecture can scale to many organizations and many cases if indexes and event retention are improved.

Near-term bottlenecks:

- audit and timeline table growth
- single-column indexes
- wide operational tables queried by dashboards
- RLS policy evaluation at scale
- document metadata and storage access
- future real-time subscriptions

Long-term scale may require:

- table partitioning
- read replicas
- analytics warehouse
- event streaming
- search/vector infrastructure
- background job workers

## Backup Strategy

Backup strategy is not yet documented at backend level.

Production needs:

- Supabase PITR policy
- daily backup verification
- organization-level export strategy
- document storage backup
- audit log retention
- restore drill schedule
- separate disaster recovery environment

## Disaster Recovery Readiness

DR readiness is currently conceptual, not operational.

Needed before production:

- RPO/RTO targets
- recovery runbook
- tested restore process
- incident response plan
- tenant restore process
- secrets rotation process
- storage recovery plan

## Migration Quality

Strengths:

- clear sprint-based filenames
- readable comments
- no production seed data
- consistent tenant scoping
- RLS on all tables
- updated_at triggers where needed

Weaknesses:

- later migrations add constraints to earlier tables, which is acceptable before data but risky after production data starts.
- no automated migration validation.
- no generated schema snapshot.
- no rollback notes.
- no migration dependency test.

## Technical Debt

Current technical debt:

- delete policies conflict with "never overwrite history"
- permission model exists but is not enforced
- duplicated task concepts
- multiple audit/event models without unified taxonomy
- missing storage/evidence model
- missing composite indexes
- shallow provider network backend compared with product architecture
- no production auth/session enforcement
- no backup/DR documentation

## Future Risks

Primary future risks:

- tenant data leakage if app metadata or RLS assumptions are wrong
- over-permissive internal users
- audit incompleteness
- quote/finance relationship mismatch
- document security gaps
- AI outputs used without provenance or approval controls
- provider intelligence becoming inconsistent without normalization
- high-volume audit/timeline queries slowing dashboards

## Strengths

- Case-centered architecture is excellent.
- Patient and Case are correctly separated.
- `organization_id` is consistently present.
- RLS is enabled on all backend tables.
- Same-organization FKs are used widely.
- No seed production data.
- Referral and finance models reflect real commercial risk.
- Clinical workflow respects human validation.
- Travel workflow avoids becoming a booking platform.
- Product documentation and backend documentation are unusually aligned.

## Weaknesses

- Tenant RLS does not yet enforce role/permission authorization.
- Delete policies exist in important operational tables.
- Audit is not automatic or unified.
- Some quote/finance links are not strict enough.
- Indexes are broad but not always query-optimized.
- Healthcare compliance details are not yet modeled.
- Provider Network backend is incomplete relative to its architecture.
- No live migration verification evidence in the repo.

## Potential Redesigns

1. Replace broad delete policies with soft archive fields and immutable history.
2. Introduce unified `event_log` or formal event taxonomy.
3. Introduce `evidence_items` to standardize documents, screenshots, emails, WhatsApp, portal confirmations, and notes.
4. Move status values to configurable lookup tables where organizations need customization.
5. Introduce a workflow transition table for Case stage movement.
6. Add active-period assignment patterns for roles, teams, ownership, and commission changes.
7. Add composite indexes based on module dashboards and operational queues.
8. Add dedicated HPN hierarchy tables.
9. Add AI artifact/provenance tables.
10. Add storage metadata and document access policies.

## Missing Entities

Important missing entities before production:

- consent records
- emergency contacts
- patient demographics beyond current basics
- patient identifiers/passport metadata
- duplicate review cases
- referral attribution records
- lifetime partner ownership history
- commission ownership decision history
- provider branches/departments/programs/physicians/coordinators
- document versions
- evidence records
- communication channels and external message logs
- workflow transitions
- handoffs
- data retention policies
- organization settings
- audit event taxonomy
- AI runs and AI provenance
- notification preferences

## Missing Indexes

Recommended priority indexes:

- `cases (organization_id, status, priority)`
- `cases (organization_id, current_owner_id, status)`
- `work_items (organization_id, owner_id, status, due_date)`
- `timeline_events (organization_id, case_id, created_at desc)`
- `audit_events (organization_id, case_id, created_at desc)`
- `case_tasks (organization_id, assigned_to, status, due_date)`
- `clinical_reviews (organization_id, review_status, urgency)`
- `clinical_reviews (organization_id, assigned_reviewer_id, review_status)`
- `hospital_referrals (organization_id, case_id, referral_status)`
- `hospital_quotes (organization_id, case_id, quote_status)`
- `travel_plans (organization_id, case_id, travel_status)`
- `patient_invoices (organization_id, invoice_status, due_date)`
- `partner_commissions (organization_id, partner_id, commission_status)`
- `access_audit_log (organization_id, created_at desc)`

## Potential Bottlenecks

- dashboard queries over large operational tables
- timeline and audit event growth
- RLS policy checks at high volume
- document metadata joins
- quote revision/history retrieval
- work item queues by department and owner
- clinical queue filtering
- finance queue filtering

## Future Microservice Boundaries

If ICOS later outgrows a single Supabase-backed modular monolith, natural service boundaries are:

- Identity and Access
- Patient and Case Core
- Clinical Decision
- Hospital Referral and Provider Network
- Finance and Commission
- Travel Coordination
- Communications
- Documents and Evidence
- Analytics and Intelligence
- AI Processing

Do not split early. The current monolithic schema is appropriate for foundation speed.

## Future API Gateways

Future API gateway responsibilities:

- tenant identification
- role/permission enforcement
- rate limiting
- audit injection
- request validation
- idempotency
- partner portal access
- hospital portal access
- patient portal access
- external integration isolation

## Future Event Architecture

ICOS should eventually introduce an event architecture for:

- CaseCreated
- CaseStageChanged
- DocumentReceived
- ClinicalReviewStarted
- ClinicalReviewApproved
- HospitalReferralSent
- MSOReceived
- QuoteReceived
- InvoiceIssued
- PaymentReceived
- CommissionApproved
- TravelConfirmed
- TreatmentStarted
- DischargeCompleted

The current timeline/audit tables are a good precursor, but a formal event model would improve analytics, automation, and AI recommendations.

## Future CQRS Possibilities

CQRS may be useful later for:

- Mission Control dashboards
- executive analytics
- clinical queues
- finance queues
- provider performance ranking
- partner performance ranking

Initial implementation should stay relational and simple. CQRS should be added only after query patterns are proven.

## Future Vector Database Opportunities

Future vector opportunities:

- clinical document semantic search
- similar case retrieval
- provider recommendation support
- hospital response pattern matching
- patient journey risk prediction
- internal knowledge base search
- audit/evidence search

Vectors should store embeddings and references, not replace source records.

## Future Analytics Warehouse

A warehouse will eventually be useful for:

- revenue analytics
- country growth
- partner performance
- provider performance
- clinical throughput
- operational SLA
- marketing attribution
- executive forecasts

Do not use production transactional tables directly as the long-term analytics layer.

## Architecture Scores

| Dimension | Score | Notes |
| --- | ---: | --- |
| Overall Architecture | 8.4 / 10 | Strong domain architecture, needs hardening |
| Scalability | 7.6 / 10 | Good foundations, needs composite indexes and event strategy |
| Security | 7.2 / 10 | Strong tenant RLS, weak operational permission enforcement |
| Maintainability | 8.0 / 10 | Clear migrations/docs, some duplicated concepts |
| Healthcare Readiness | 7.4 / 10 | Strong workflow fit, compliance details missing |
| SaaS Readiness | 8.2 / 10 | Excellent tenant pattern, needs provisioning and lifecycle |
| Enterprise Readiness | 7.8 / 10 | Strong modules, needs permissions/workflow/audit hardening |
| Commercial Product Readiness | 7.5 / 10 | Differentiated product, not production hardened yet |

## Top 20 Recommendations Before Production

1. Freeze the conceptual Backend Foundation as v1.0 only after a hardening sprint.
2. Remove or replace delete policies on operational tables with archive/status workflows.
3. Add permission-aware authorization beyond organization-level RLS.
4. Enforce active organization membership and access status in authorization decisions.
5. Tighten finance quote relationships so accepted quotes must belong to the same Case.
6. Create a unified audit/event taxonomy.
7. Add automatic audit triggers or service-layer audit guarantees for sensitive actions.
8. Standardize evidence with a dedicated evidence/document reference model.
9. Add composite indexes for tenant-scoped operational queues.
10. Add migration CI validation against a fresh Supabase/Postgres database.
11. Add backup, restore, and disaster recovery documentation.
12. Add data retention and privacy policy tables or configuration.
13. Add consent and patient privacy foundations.
14. Add duplicate review and attribution protection backend tables.
15. Expand Healthcare Provider Network backend tables.
16. Decide whether status/type fields remain check constraints or become configurable lookup tables.
17. Add AI artifact/provenance tables before any AI service integration.
18. Define API gateway and service-layer authorization rules.
19. Create a production schema snapshot and migration dependency test.
20. Document operational runbooks for tenant onboarding, user revocation, incident response, and restore drills.

## Should Backend Foundation Be Frozen As Version 1.0?

Recommendation: freeze as **Backend Foundation v1.0 Candidate**, not final production v1.0.

Reason:

The conceptual architecture is strong enough to become the baseline. However, production freeze should wait until the hardening sprint resolves the main technical risks:

- permission-aware authorization
- immutable operational history
- stronger quote/finance constraints
- composite indexes
- unified event/audit model
- backup/DR plan
- migration validation

Once those are addressed, the Backend Foundation should be frozen as Version 1.0 and future backend work should be additive rather than structural.
