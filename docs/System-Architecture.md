# AfraMedico Business Growth OS — System Architecture v1.0

This is the master system architecture document for AfraMedico Business Growth OS. It organizes the platform into architectural layers and defines how future modules should connect to the operating system.

## 1. Layer Architecture

AfraMedico Business Growth OS should be designed in five layers.

### Layer 1: Business Principles

Business Principles define why the system exists and how decisions should be made.

Examples:

- Never lose a patient.
- Never lose a commission.
- Protect partner trust.
- Protect hospital relationships.
- Never overwrite history.
- Every important action requires audit trail.
- Duplicate detection should flag and review, not block.
- Automation must not remove managerial control in sensitive decisions.

This layer should guide every module, workflow, data model, and future automation.

### Layer 2: Domain Model

The Domain Model defines the core business entities and stable relationships.

Examples:

- Patient
- Case
- Referral Partner
- Hospital
- Medical Review
- Hospital Referral
- Quote
- Commission
- Travel Plan
- Treatment Episode

This layer should prevent duplicated data and unclear ownership between modules.

### Layer 3: Workflow Engine

The Workflow Engine defines how work moves through the business.

Examples:

- Lead workflow
- Referral protection workflow
- Clinical decision workflow
- Hospital communication workflow
- Travel workflow
- Finance workflow
- Follow-up workflow

Workflows should move Cases forward while preserving evidence, status, tasks, and audit history.

### Layer 4: Business Modules

Business Modules are user-facing operational areas built on top of the domain model and workflows.

Examples:

- Mission Control
- Authority CRM
- Referral Partner CRM
- Lead Management
- Case Workspace
- Referral Protection Engine
- Clinical Decision Center
- Operations Center
- Hospital Relations
- Finance Center
- Travel Center
- Follow-up Center

Modules should not invent isolated data models. They should connect to the shared domain model through stable IDs.

### Layer 5: User Interface

The User Interface exposes workflows to staff and executives.

Examples:

- Dashboard cards
- Tables
- Case workspace
- Timelines
- Audit trails
- Kanban pipelines
- Forms
- Alerts
- Quick actions

The UI should remain operational, clear, and enterprise-grade. It should help users decide what needs attention and what action to take next.

## 2. Core Architecture Rule

Every module must connect through stable IDs:

- `patient_id`
- `case_id`
- `partner_id`
- `hospital_id`
- `hospital_referral_id`
- `medical_review_id`
- `quote_id`
- `task_id`
- `department_id`
- `owner_id`
- `handoff_id`
- `audit_event_id`

Do not duplicate patient data across modules.

For example:

- Medical Review should reference `case_id`.
- Hospital Quote should reference `case_id`, `hospital_id`, and `hospital_referral_id`.
- Commission should reference `partner_id`, `case_id`, and relevant attribution or referral records.
- Mission Control should summarize records, not become the source of truth.

## 3. Case-Centered Design

The Case is the operational center.

The Patient is the long-term identity.

Rules:

- A Patient may have multiple Cases.
- A Case belongs to one Patient.
- A Case may have multiple Hospital Referrals.
- A Case may have multiple Medical Reviews.
- A Case may have multiple Quotes.
- A Case may have many documents, communications, tasks, timeline events, and audit records.

This means future modules should ask:

- Which Case is this work connected to?
- Which Patient owns the long-term identity?
- Which related records should appear inside the Case Workspace?

The Case Workspace should become the operational single source of truth for one treatment journey.

## 4. Relationship Protection

The system protects business relationships, not only patient records.

It protects:

- AfraMedico commission rights
- Partner attribution rights
- Hospital relationships
- Patient trust

Key concepts:

- Referral Protection Engine
- Lifetime Partner Owner
- Commission Owner
- Duplicate Review
- Attribution Protection Layer as a future module

Referral Protection Engine preserves evidence around partner attempts, hospital registration, duplicate reviews, commission ownership, and manager decisions.

Lifetime Partner Owner protects valid long-term partner rights across future Cases unless changed by admin with reason.

Commission Owner defines who owns commercial rights for a specific commission-sensitive situation.

Duplicate Review ensures possible duplicates are reviewed by a manager and never used to block valid registration.

Attribution Protection Layer will later track first touch, last touch, declared referral, verified referral, campaigns, UTM data, referral links, QR codes, and partner promotion evidence.

## 5. Clinical Architecture

Clinical Decision Center is not just document review.

It produces:

- Document completeness review
- AI-assisted preliminary medical opinion
- Internal clinical validation
- Patient-facing preliminary opinion
- Hospital-ready medical package
- Hospital MSO request
- Final recommendation package

Medical Review belongs to the Case, not directly to the Patient.

The Preliminary Medical Opinion is patient-facing and must include proper disclaimers. It does not replace evaluation by the treating specialist or hospital medical team.

Hospital MSO is the specialist opinion from the Hospital.

AfraMedico's hospital-facing package should use terms like:

- Medical Summary
- Clinical Case Summary
- Case Brief
- Hospital Submission Package

It should not call the AfraMedico AI-assisted document a hospital Medical Second Opinion.

## 6. Early Hospital Registration vs Medical Review

Early Hospital Registration may happen before Medical Review to protect commission rights.

Medical Review is required before full clinical package submission or detailed quote request.

Early Hospital Registration:

- Belongs to Referral Protection and Hospital Referrals.
- Protects AfraMedico and partner commission rights.
- Can happen when enough minimum patient data exists.
- Must preserve registration evidence and audit trail.
- Must not be blocked by Medical Review.

Medical Review:

- Belongs to the Case.
- Prepares the hospital-ready clinical package.
- Supports patient-facing preliminary opinion.
- Supports hospital specialist review and detailed quote requests.
- Must be internally validated when AI is used.

These workflows are related but separate.

## 7. Permission and Department Architecture

Future departments:

- CEO / Executive
- Lead Coordination
- Referral Partner Management
- Medical Review Team
- Hospital Relations
- Finance
- Travel & Visa
- Patient Support
- Marketing
- Admin

Each department should have different permissions in the future.

Operations Center is the frontend prototype for this ownership layer. It defines how Cases, Work Items, Departments, Owners, Handoffs, and visual role permissions should behave before backend authentication and role-based access control are implemented.

Operational ownership rules:

- Every Case must have a Responsible Department.
- Every Case must have a Responsible User.
- Every Work Item must have an Owner.
- Every transfer between departments must create a Handoff record.
- Ownership history must never be overwritten.
- Audit Trail must record every ownership change.

Examples:

- CEO / Executive can view Mission Control, revenue, risk, and performance summaries.
- Lead Coordination can manage leads, documents, tasks, and patient follow-ups.
- Referral Partner Management can manage partners and attribution status.
- Medical Review Team can review documents and approve preliminary clinical outputs.
- Hospital Relations can manage hospital referrals, MSO requests, and quote follow-up.
- Finance can manage invoices, proformas, commissions, and payment status.
- Travel & Visa can manage travel plans, visa status, flights, and accommodation.
- Patient Support can manage communications and follow-ups.
- Marketing can view acquisition and campaign performance.
- Admin can manage roles, permissions, overrides, and audit-sensitive settings.

Sensitive actions should require appropriate permissions, especially:

- Commission Owner changes
- Lifetime Partner Owner changes
- Medical opinion approval
- Financial approvals
- Admin overrides

## 8. Future Integration Architecture

Future integrations may include:

- Supabase
- AI OCR
- AI Medical Analysis
- Email
- WhatsApp
- SMS
- Google Ads
- Meta Ads
- Google Analytics
- Hospital portals
- Payment systems

Integration rule:

External systems should feed structured records into the domain model. They should not bypass audit trail, ownership rules, or stable IDs.

Examples:

- WhatsApp messages should become Communications linked to `patient_id` and `case_id`.
- AI OCR should extract data into Medical Documents but preserve original files.
- Google Ads and Meta Ads should support Patient Acquisition and Attribution Protection.
- Hospital portals should update Hospital Referrals, Hospital MSOs, and Hospital Quotes.
- Payment systems should connect to Invoices, Commissions, and Finance workflows.

## 9. AI Architecture

Future AI should support:

- Document extraction
- Medical summarization
- Missing document detection
- Risk flags
- Hospital recommendation
- Executive recommendations
- Revenue risk alerts
- Partner performance insights

AI must never remove human approval in clinical, financial, or commission-sensitive decisions.

Human approval is required for:

- Patient-facing preliminary medical opinions
- Hospital-ready clinical package approval
- Emergency or not-recommended-for-travel decisions
- Commission Owner changes
- Lifetime Partner Owner changes
- Partner attribution decisions
- Financial approval decisions

AI should assist, summarize, detect, recommend, and flag risk. It should not silently decide.

## 10. Development Rule

Before building any new module, ask:

- Which layer does this module belong to?
- Which core entity does it use?
- Which stable ID connects it?
- Which workflow does it advance?
- What business risk does it reduce?
- What revenue opportunity does it create or protect?

If a module does not connect to the domain model through stable IDs, it should not be built yet.

If a module creates a new workflow, the workflow should define:

- Start condition
- Required fields
- Statuses
- Owner department
- Related entities
- Audit events
- Completion condition

This keeps AfraMedico Business Growth OS coherent as it grows from prototype into a real operating system.
