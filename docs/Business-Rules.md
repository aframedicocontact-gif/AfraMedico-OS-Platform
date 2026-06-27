# AfraMedico Business Growth OS - Business Rules

This document captures the current operating rules behind the AfraMedico Business Growth OS prototype. It is a living document and should be updated whenever the product model, module scope, or workflow assumptions change.

## Product Boundary

- AfraMedico Business Growth OS is a standalone internal business operations prototype.
- It is separate from the public AfraMedico website.
- Sprint work is frontend-only until backend implementation is explicitly approved.
- Current source of truth is local JSON data inside `src/data`.
- Do not add Supabase, authentication, backend APIs, SQL, or migrations during prototype validation.
- The system should feel like an enterprise internal operations tool, not a public marketing site.

## Core Operating Model

- A Lead is not permanently equal to a Patient.
- A Patient can have multiple Cases over time.
- A Case represents one treatment journey or medical service request.
- Every operational workflow should eventually connect back to a Case ID.
- The Case Profile is the central record and single source of truth for one treatment journey.

## Patient Rules

- Each Patient must have a Patient ID.
- A Patient may have multiple Cases.
- Patient identity can include full name, date of birth, country, phone, WhatsApp, email, and attribution fields.
- Patient ownership must preserve:
  - Primary Partner Attribution
  - First Referral Date
  - Lifetime Partner Owner
  - Ownership Status
  - Admin Override Reason
  - Audit Trail
- Later Cases inherit the Lifetime Partner Owner by default.
- Admins may change Lifetime Partner Owner only with a reason.
- Every ownership change must be visible in the Audit Trail.

## Case Rules

- Each Case must have a Case ID and Patient ID.
- A Case can be Active, Closed, Reopened, Future, or Lost.
- A closed Case can be reopened.
- A Patient can open a new Case later for another treatment.
- Duplicate alerts must not block new Case creation.
- If a similar Patient exists, the system should allow creation but flag it for review.
- Each Case may connect to:
  - Medical Review
  - Hospital Referrals
  - Hospital Quotes
  - Referral Protection
  - Patient Journey
  - Timeline
  - Audit Trail
  - Files
  - Notes
  - Tasks

## Authority CRM Rules

- Authority CRM tracks African authority targets for growth, credibility, backlinks, and partnerships.
- Authority targets may include:
  - Universities
  - Teaching Hospitals
  - Medical Associations
  - NGOs
  - Health Blogs
  - News Media
  - Business Directories
- Priority, status, opportunity type, contact details, domain authority or domain rating, next step, and follow-up context should be visible.
- Country-level growth should be trackable across Nigeria, Ghana, Kenya, Uganda, Tanzania, and South Africa.
- CSV Import remains a placeholder only in the prototype.
- Expected CSV columns are:
  - `organization_name`
  - `country`
  - `category`
  - `website`
  - `contact_email`
  - `priority`
  - `status`
  - `opportunity_type`
  - `notes`

## Referral Partner CRM Rules

- Referral Partner CRM manages organizations that can refer patients to AfraMedico.
- Partner types include:
  - Physicians
  - Specialist Clinics
  - Diagnostic Centers
  - NGOs
  - HMOs / Insurance
  - Travel Agencies
  - Medical Facilitators
  - Corporate Organizations
- Partner records should include organization, contact person, location, specialties, treatments referred, phone, email, website, WhatsApp, referral status, agreement status, commission model, patient count, estimated revenue, notes, last contact, next follow-up, and activity timeline.
- Referral pipeline stages are:
  - Prospect
  - Contacted
  - Meeting Scheduled
  - Negotiation
  - Agreement Signed
  - Active Referrer
  - Inactive
- Pipeline boards must use readable fixed-width columns with horizontal scrolling.

## Lead Management Rules

- Lead Management handles potential patients from first contact until they become active patients or are lost.
- Lead sources include Website, WhatsApp, Facebook, Instagram, Google Search, Google Ads, YouTube, Referral Partner, Hospital, Doctor, NGO, Conference, University, Phone Call, Email, Walk-in, and Other.
- Lead statuses include:
  - New
  - Contacted
  - Medical Documents Requested
  - Documents Received
  - Medical Review
  - Hospital Quotes Requested
  - Hospital Quotes Received
  - Patient Decision Pending
  - Accepted
  - Lost
- Lead pipeline stages include:
  - New Lead
  - Initial Contact
  - Documents Requested
  - Documents Received
  - Medical Review
  - Hospital Selection
  - Quotation Sent
  - Decision Pending
  - Confirmed
  - Lost
- Lead Profile must show Patient ID and Case ID when available.
- Lead Profile should show Patient Cases and Lifetime Partner Owner.
- Duplicate warnings should be visible but must not block progress.
- Pipeline boards must use readable fixed-width columns with horizontal scrolling.

## Referral Protection Engine Rules

- Referral Protection Engine protects:
  - AfraMedico commission rights
  - Referral Partner rights
  - Hospital registration history
  - Complete audit trail
- A Patient may be referred to multiple hospitals.
- Each hospital referral must preserve its own registration date, registration status, hospital case ID, quote, contact person, documents sent, evidence, and timeline.
- A Patient may be referred by multiple partners.
- All referral attempts must be preserved.
- Referral history must never be overwritten.
- Duplicate detection must never block registration.
- Early Hospital Registration must not be blocked by Medical Review.
- Early Hospital Registration can happen as soon as minimum patient data exists.
- The purpose of Early Hospital Registration is to protect referral and commission rights.
- Medical Review is required before sending a full hospital-ready clinical package or requesting a detailed treatment quote.
- If a possible duplicate exists:
  - Allow registration.
  - Display a duplicate warning.
  - Create a Duplicate Review case.
  - Let a manager decide ownership later.

## Early Hospital Registration vs Medical Review

These are separate actions with separate business purposes.

Early Hospital Registration:

- Purpose: protect AfraMedico and Referral Partner commission rights.
- Can happen before Medical Review.
- Requires only enough minimum patient data to identify and register the patient with the hospital.
- Must create evidence and audit trail.
- Must preserve hospital registration date, registration status, hospital case ID when available, and confirmation evidence.
- Must not request a detailed treatment quote unless the clinical package is ready.

Medical Review:

- Purpose: transform raw medical documents into a hospital-ready clinical package.
- Belongs to the Case, not directly to the Patient.
- Is required before sending a full clinical package or requesting a detailed treatment quote.
- Should identify missing documents, red flags, destination recommendations, hospital recommendations, and clinical readiness.
- Must not be treated as a prerequisite for early commission-protection registration.

## Clinical Decision Center Rules

- Clinical Decision Center is the clinical workflow hub.
- Medical Review is part of Clinical Decision Center.
- It belongs to the Case, not directly to the Patient.
- It transforms raw patient documents into Document Completeness Review, AI-assisted Preliminary Medical Opinion, Internal Clinical Validation, Patient-facing Preliminary Opinion, Hospital-ready Case Package, Hospital MSO request, and Final Recommendation Package.
- Preliminary Medical Opinion is not a final specialist opinion.
- AI-generated clinical content must be internally reviewed before being sent to the patient.
- Partner should be informed when relevant, but AfraMedico remains the main operational communication center.
- Missing document requests may go to patient/family and copy the partner when relevant.
- Emergency cases must be flagged and escalated.
- Low-benefit travel cases must support ethical recommendations such as local treatment first, palliative care, or continuing only if the patient/family still requests.
- Every clinical decision action must create audit trail.

## Commission Ownership Rules

- Commission Owner must be tracked.
- A manager can change Commission Owner only when the change includes:
  - Reason
  - Decision Date
  - Decision By
- Nothing should be deleted after a commission decision.
- Every decision must be logged.

## Referral Ownership Values

- Pending Review
- Confirmed First Referrer
- Transferred by Manager
- Split Commission
- No Commission

## Audit Trail Rules

Every important action must create an Audit Trail event. Examples include:

- Lead Created
- Patient Registered
- Referral Sent
- Email Delivered
- WhatsApp Sent
- Hospital Confirmed
- Hospital Case ID Received
- Quote Requested
- Quote Received
- Commission Owner Changed
- Decision Approved
- Partner Notified

Each Audit Trail event should include:

- Date
- Time
- User
- Action
- Evidence
- Notes
- Reason when the event changes ownership or commercial rights

## Evidence Management Rules

Referral and attribution evidence may include:

- Email
- WhatsApp
- PDF
- Hospital Confirmation
- Portal Screenshot
- Hospital Registration Number
- Voice Note
- Internal Note

The system should always be able to prove:

- Who referred first
- When they referred
- How they referred
- What evidence exists
- What decision was made
- Who owns the commission

## Hospital Registration Rules

Each hospital referral stores:

- Hospital
- Referral Date
- Registration Date
- Registration Status
- Hospital Case ID
- Coordinator
- Quote Status
- Treatment Cost
- Expected Response Date

## Duplicate Review Rules

Duplicate Review Center must show:

- Possible duplicates
- Matching score
- Existing patient
- Existing partner
- Existing hospital referrals
- Evidence

Manager actions may include:

- Approve New Referral
- Merge
- Assign Commission Owner
- Split Commission
- Reject Duplicate

## Case Profile Rules

Case Profile is the central operational screen.

It must display:

- Case header and patient identity
- Lifetime Partner section
- Medical Review summary
- Hospital Referrals
- Hospital Quotes
- Case Timeline
- Audit Trail
- Attached Files
- Internal Notes
- Tasks
- Quick Actions

Case Status values include:

- New
- Active
- Waiting Documents
- Waiting Quotes
- Treatment Approved
- Travel Planned
- Under Treatment
- Recovery
- Closed
- Reopened
- Lost

## Locked Future Rule: Attribution Protection Layer

Attribution Protection Layer is documented as future architecture but must not be implemented yet.

It will protect the commercial rights of:

- AfraMedico
- Referral Partners
- Marketing Campaigns

The future module must preserve:

- First Touch Attribution
- Last Touch Attribution
- Declared Referral
- Verified Referral
- Commission Owner
- Lifetime Partner Owner

These values may differ and must never overwrite each other.

Manager attribution decisions must require:

- Review of evidence
- Decision type
- Reason
- Audit Trail
