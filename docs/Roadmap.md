# AfraMedico Business Growth OS - Roadmap

This roadmap reflects the current prototype direction. It is a living plan and should change as the UX is validated.

## Current Stage: Frontend Prototype

Goal:

Validate internal business workflows before building backend systems.

Current constraints:

- Frontend only
- Local JSON only
- No Supabase
- No authentication
- No APIs
- No SQL
- No migrations

Implemented prototype modules:

- Authority CRM
- Referral Partner CRM
- Lead Management
- Referral Protection Engine
- Case Profile
- Clinical Decision Center
- Unified Patient Context
- Operations Center

## Phase 1: Authority CRM

Status: Complete for prototype validation.

Purpose:

Validate authority target tracking, backlink opportunity management, outreach statuses, and Africa-focused growth visibility.

Remaining future improvements:

- Better import validation
- Outreach activity logging
- Contact enrichment
- Authority scoring
- Report generation

## Phase 2: Referral Partner CRM

Status: Complete for prototype validation.

Purpose:

Validate referral partner tracking, partner profiles, agreement stages, and referral pipeline workflow.

Remaining future improvements:

- Partner agreements
- Commission terms
- Referral submission intake
- Partner performance reporting
- Partner portal concept

## Phase 3: Lead Management

Status: Complete for prototype validation.

Purpose:

Validate patient lead intake, coordinator workflow, lead pipeline, patient-case relationship, and medical tourism-specific statuses.

Remaining future improvements:

- Coordinator assignment workflow
- Medical document checklist
- Treatment inquiry intake forms
- Lead deduplication review flow
- Lead-to-case conversion flow

## Phase 4: Referral Protection Engine

Status: Complete for prototype validation.

Purpose:

Validate legal and operational protection for referral history, duplicate review, hospital registration, commission ownership, evidence, and audit trail.

Remaining future improvements:

- Evidence upload workflow
- Decision approval workflow
- Conflict resolution reports
- Partner notification logs
- Hospital confirmation tracking

## Phase 5: Case Profile

Status: Complete for prototype validation.

Purpose:

Validate the Master Patient Case as the central operational screen.

Remaining future improvements:

- More complete case journey timeline
- Case-linked tasks
- Case-linked document management
- Case-linked medical review requests
- Case-linked quote comparison
- Case-linked visa and travel workflow

## Phase 6: Clinical Decision Center

Status: Complete for prototype validation.

Purpose:

Validate the clinical workflow hub that transforms raw documents into document completeness decisions, AI-assisted preliminary opinions, internal clinical validation, hospital-ready case packages, hospital MSO requests, and final patient recommendation packages.

Implemented prototype pages:

- Clinical Decision Dashboard
- Review Queue
- Clinical Review Workspace
- Document Completeness Review
- Preliminary Medical Opinion
- Hospital Case Package
- Hospital MSO Tracker

Remaining future improvements:

- Real document upload and OCR
- AI medical model integration
- Clinical lead approval workflow
- MDT / tumor board workflow
- Hospital portal submission tracking
- Patient-facing PDF recommendation package

## Phase 7: Operations Center

Status: Complete for prototype validation.

Purpose:

Validate operational ownership, department workload, role permissions, case handoffs, and the Work Item Engine before backend roles and access control are introduced.

Implemented prototype pages:

- Operations Dashboard
- Department Workboard
- Case Ownership
- Role Matrix
- Work Item Engine
- Handoff Center
- Department Dashboard

Remaining future improvements:

- Real role-based access control
- Persistent work item state
- Handoff approval workflow
- SLA escalation automation
- Department queue notifications
- Audit-ready ownership history

## Locked Future Module: Attribution Protection Layer

Status: Not implemented. Locked architecture only.

This should be implemented after Case Profile and Clinical Decision Center.

Purpose:

Protect commercial attribution across partners, campaigns, referral codes, UTMs, QR codes, direct website leads, WhatsApp, phone calls, and patient declarations.

Important:

- Do not implement tracking integrations during frontend prototype unless explicitly approved.
- The concept should remain documented and ready for later architecture.

## Future Backend Phase

Status: Not started.

Backend should begin only after the frontend workflows are validated.

Likely work:

- Supabase schema
- Authentication
- Roles and permissions
- Row-level security
- File storage
- Audit trail persistence
- Import jobs
- Notifications
- Backend validation
- API contracts if needed

## Future Reporting Phase

Status: Not started.

Possible reports:

- Authority growth report
- Partner referral performance
- Lead conversion report
- Case pipeline report
- Hospital referral performance
- Commission ownership decisions
- Duplicate review outcomes
- Country growth coverage

## Future Automation Phase

Status: Not started.

Possible automations:

- Follow-up reminders
- Missing document reminders
- Quote request reminders
- Partner notification reminders
- Duplicate review escalations
- Hospital response SLA alerts
- Case status reminders

## Roadmap Rule

Do not build backend infrastructure before the product workflows are validated. The prototype should remain lightweight until the business operating model is stable.
