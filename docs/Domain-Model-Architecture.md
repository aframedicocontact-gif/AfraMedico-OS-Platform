# AfraMedico Business Growth OS - Domain Model Architecture

This document defines the core domain model of AfraMedico Business Growth OS. It is the reference model for future modules, database design, Supabase schema planning, and cross-module relationships.

## Core Principle

AfraMedico Business Growth OS is case-centered, patient-aware, partner-protected, and hospital-connected.

- The Case is the operational center.
- The Patient is the long-term identity.
- The Partner may own lifetime attribution.
- The Hospital Referral protects commission rights and enables hospital engagement.
- The Medical Review produces clinical decision outputs.

## Stable ID Formats

Use stable IDs across modules. Future database records should use these IDs or database primary keys mapped to these IDs.

| Entity | ID Format |
| --- | --- |
| Patient | `PAT-YYYY-000001` |
| Case | `CASE-YYYY-000001` |
| Partner | `PARTNER-YYYY-000001` |
| Hospital | `HOSP-YYYY-000001` |
| Hospital Referral | `HREF-YYYY-000001` |
| Medical Review | `MRV-YYYY-000001` |
| Medical Document | `DOC-YYYY-000001` |
| Hospital Quote | `QUOTE-YYYY-000001` |
| Timeline Event | `EVT-YYYY-000001` |
| Audit Event | `AUD-YYYY-000001` |
| Task | `TASK-YYYY-000001` |
| Invoice / Proforma | `INV-YYYY-000001` |
| Commission | `COMM-YYYY-000001` |
| Travel Plan | `TRAVEL-YYYY-000001` |
| Treatment Episode | `TRT-YYYY-000001` |
| Follow-up | `FU-YYYY-000001` |

## Core Entities

### 1. Patient

Purpose: Long-term identity for a person who may have multiple medical cases over time.

Key fields: `patient_id`, full name, date of birth, country, nationality, phone, WhatsApp, email, preferred language, lifetime partner owner, ownership status.

Main relationships: Has many Cases. Has one Patient Acquisition record. May have one Lifetime Partner Owner. May have many Partner Attribution attempts.

Business rules: Patient is not the same as Case. Patient identity should not be duplicated across modules. Future Cases inherit Lifetime Partner Owner unless admin changes it with reason.

Example ID format: `PAT-2026-000001`

### 2. Patient Acquisition

Purpose: Captures how the Patient first entered AfraMedico's ecosystem.

Key fields: acquisition ID, patient ID, source, channel, campaign, first touch, last touch, UTM data, referral code, declared referral, acquisition date.

Main relationships: Belongs to Patient. May connect to Partner Attribution, campaigns, referral links, and future Attribution Protection Layer.

Business rules: Direct leads belong to AfraMedico unless valid attribution evidence exists. Acquisition source is not automatically the same as Commission Owner.

Example ID format: `ACQ-2026-000001`

### 3. Case

Purpose: Operational unit for one treatment journey or medical request.

Key fields: `case_id`, patient ID, treatment requested, medical condition, destination, case status, priority, coordinator, created date, closed date, reopened date, expected travel date.

Main relationships: Belongs to Patient. May have many Medical Reviews, Hospital Referrals, Hospital Quotes, Medical Documents, Timeline Events, Tasks, Communications, Travel Plans, Treatment Episodes, and Follow-ups.

Business rules: Case is the operational center. One Patient may have multiple Cases over time. A closed Case may be reopened. A new Case may be created for a different treatment later.

Example ID format: `CASE-2026-000001`

### 4. Referral Partner

Purpose: Organization or person who may refer patients to AfraMedico.

Key fields: `partner_id`, organization name, contact person, country, city, partner type, specialties, treatments referred, phone, email, WhatsApp, agreement status, commission model.

Main relationships: May have many Partner Attribution attempts. May become Lifetime Partner Owner. May receive Commission.

Business rules: Partner trust must be protected. Partners should stay informed, but AfraMedico should become the operational communication center.

Example ID format: `PARTNER-2026-000001`

### 5. Partner Attribution

Purpose: Preserves referral and attribution attempts from partners or campaigns.

Key fields: attribution ID, patient ID, case ID, partner ID, attribution type, channel, referral date, evidence, ownership status, manager decision.

Main relationships: Belongs to Patient. May connect to Case, Referral Partner, Commission, and Audit Trail.

Business rules: First touch, last touch, declared referral, verified referral, Commission Owner, and Lifetime Partner Owner must remain separate. Never overwrite attribution history.

Example ID format: `ATTR-2026-000001`

### 6. Hospital

Purpose: Destination hospital or clinical provider that can receive referrals, provide opinions, and issue quotes.

Key fields: `hospital_id`, hospital name, country, city, specialties, international office contact, email, phone, website, response time, quality notes.

Main relationships: Has many Hospital Referrals, Hospital Quotes, Hospital Medical Opinions, and Treatment Episodes.

Business rules: Hospital relationships must be protected through clear communication, registration evidence, and accurate case packages.

Example ID format: `HOSP-2026-000001`

### 7. Hospital Referral

Purpose: Registers or refers a Case to a Hospital and protects commission rights.

Key fields: `hospital_referral_id`, case ID, hospital ID, referral date, registration date, registration status, hospital case ID, coordinator, contact person, quote status, documents sent, evidence.

Main relationships: Belongs to Case. Belongs to Hospital. May have Hospital Quote, Hospital Medical Opinion, Timeline Events, Evidence, and Commission.

Business rules: Hospital Referral may happen before Medical Review. Early Hospital Registration protects commission rights and must not be blocked by Medical Review.

Example ID format: `HREF-2026-000001`

### 8. Hospital Quote

Purpose: Stores pricing and treatment package information received from a Hospital.

Key fields: `hospital_quote_id`, case ID, hospital referral ID, hospital ID, quoted cost, currency, estimated stay, doctor, quote date, validity date, status, notes.

Main relationships: Belongs to Case. Belongs to Hospital Referral. Belongs to Hospital.

Business rules: Detailed quote requests should follow Medical Review or sufficient clinical package readiness. Quote history should not be overwritten.

Example ID format: `QUOTE-2026-000001`

### 9. Medical Review

Purpose: Case-based clinical decision workflow that turns raw documents into clinical outputs.

Key fields: `medical_review_id`, case ID, assigned reviewer, status, priority, submission date, review time, outcome, clinical recommendation, destination recommendation.

Main relationships: Belongs to Case. Uses many Medical Documents. May generate Preliminary Medical Opinion. May prepare Hospital Submission Package.

Business rules: Medical Review belongs to Case, not directly to Patient. Medical Review is required before sending a full clinical package or requesting a detailed treatment quote.

Example ID format: `MRV-2026-000001`

### 10. Medical Document

Purpose: Stores metadata for uploaded or requested patient documents.

Key fields: `medical_document_id`, case ID, medical review ID, category, file name, upload date, document status, OCR status, AI extracted flag, verified flag.

Main relationships: Belongs to Case. May belong to Medical Review. May be used in Preliminary Medical Opinion and Hospital Submission Package.

Business rules: Document completeness depends on specialty and condition. Missing documents must be requested and tracked.

Example ID format: `DOC-2026-000001`

### 11. Preliminary Medical Opinion

Purpose: Patient-facing AI-assisted preliminary opinion reviewed by AfraMedico clinical leadership.

Key fields: opinion ID, medical review ID, case ID, key findings, possible diagnosis, red flags, missing information, suggested questions, disclaimer, reviewer approval.

Main relationships: Belongs to Medical Review and Case. May be sent through Communication.

Business rules: This is not a final specialist opinion. It must be internally reviewed before sending to the patient/family and must include disclaimer language.

Example ID format: `PMO-2026-000001`

### 12. Hospital Medical Opinion / MSO

Purpose: Specialist medical opinion received from a Hospital.

Key fields: hospital opinion ID, case ID, hospital ID, hospital referral ID, specialist name, treatment plan, urgency, risks, required documents, received date.

Main relationships: Belongs to Hospital Referral, Hospital, and Case. May support Hospital Quote and Final Recommendation Package.

Business rules: Hospital MSO is different from AfraMedico Preliminary Medical Opinion. AfraMedico should not call its AI-assisted summary a hospital MSO.

Example ID format: `MSO-2026-000001`

### 13. Case Timeline Event

Purpose: Chronological operating history for a Case.

Key fields: `timeline_event_id`, case ID, date, time, user, action, evidence, notes.

Main relationships: Belongs to Case. May reference Hospital Referral, Medical Review, Task, Communication, or Quote.

Business rules: Timeline should show what happened operationally. History must not be overwritten.

Example ID format: `EVT-2026-000001`

### 14. Audit Trail Event

Purpose: Immutable audit record for important decisions and sensitive actions.

Key fields: `audit_event_id`, entity type, entity ID, user, timestamp, action, old value, new value, reason, evidence.

Main relationships: May reference Patient, Case, Partner Attribution, Hospital Referral, Commission, Medical Review, or User.

Business rules: Every important action must create audit trail. Admin overrides require reason and timestamp.

Example ID format: `AUD-2026-000001`

### 15. Task

Purpose: Work item assigned to staff for follow-up and operations.

Key fields: `task_id`, case ID, patient ID, owner, title, due date, status, priority, related entity type, related entity ID.

Main relationships: Usually belongs to Case. May reference Patient, Medical Review, Hospital Referral, Partner, or Travel Plan.

Business rules: Tasks should keep daily operations visible and prevent patient loss.

Example ID format: `TASK-2026-000001`

### 16. Communication

Purpose: Records communication with patient, family, partner, hospital, or internal staff.

Key fields: communication ID, case ID, patient ID, channel, sender, recipient, date, message summary, attachments, copied partner flag.

Main relationships: Belongs to Case and may reference Patient, Partner, Hospital, Medical Review, or Hospital Referral.

Business rules: AfraMedico should become the operational communication center. Partners may be copied or updated when relevant.

Example ID format: `COMMS-2026-000001`

### 17. Invoice / Proforma

Purpose: Stores invoice or proforma invoice details from hospitals or AfraMedico.

Key fields: `invoice_id`, case ID, hospital quote ID, hospital ID, amount, currency, issue date, due date, status, file reference.

Main relationships: Belongs to Case. May belong to Hospital Quote and Hospital.

Business rules: Financial documents should remain traceable to the quote and hospital referral that produced them.

Example ID format: `INV-2026-000001`

### 18. Commission

Purpose: Tracks commercial ownership and commission expectations.

Key fields: `commission_id`, case ID, patient ID, partner ID, commission owner, model, amount, status, decision reason, decision date, decision by.

Main relationships: May belong to Partner, AfraMedico, or split ownership. References Case, Patient, Partner Attribution, and Hospital Referral.

Business rules: Commission may belong to Partner, AfraMedico, or split. Commission Owner changes require reason and audit trail.

Example ID format: `COMM-2026-000001`

### 19. Travel Plan

Purpose: Coordinates travel logistics for a Case.

Key fields: `travel_plan_id`, case ID, patient ID, destination country, flight date, arrival date, hotel, visa status, companion count, travel risk.

Main relationships: Belongs to Case. May connect to Treatment Episode and Communications.

Business rules: Travel should not proceed if the case is unsafe, clinically inappropriate, or legally unacceptable.

Example ID format: `TRAVEL-2026-000001`

### 20. Treatment Episode

Purpose: Represents actual treatment activity at a hospital.

Key fields: `treatment_episode_id`, case ID, hospital ID, admission date, treatment date, discharge date, doctor, treatment performed, outcome.

Main relationships: Belongs to Case and Hospital. May connect to Invoice, Follow-up, and Patient Journey.

Business rules: Treatment Episodes should remain tied to the Case that generated the hospital referral and quote.

Example ID format: `TRT-2026-000001`

### 21. Follow-up

Purpose: Tracks post-treatment or future-care follow-up.

Key fields: `follow_up_id`, patient ID, case ID, due date, owner, reason, status, notes, next action.

Main relationships: Belongs to Patient and/or Case. May create a new Case if new treatment is requested.

Business rules: Follow-up can be long-term patient management or case-specific care continuity.

Example ID format: `FU-2026-000001`

### 22. User / Staff

Purpose: Internal AfraMedico team member or future authorized user.

Key fields: user ID, name, email, department ID, role ID, status, permissions, assigned region.

Main relationships: Belongs to Department. Has Role / Permission. May own Tasks, Reviews, Communications, and Audit Events.

Business rules: User actions must be traceable for audit-sensitive decisions.

Example ID format: `USER-2026-000001`

### 23. Department

Purpose: Internal business unit responsible for a workflow area.

Key fields: department ID, name, description, manager, status.

Main relationships: Has many Users / Staff. May own module workflows.

Business rules: Departments support operational accountability and future permission boundaries.

Example ID format: `DEPT-2026-000001`

### 24. Role / Permission

Purpose: Defines what a User / Staff member can view or change.

Key fields: role ID, role name, permission keys, module access, approval rights, status.

Main relationships: Assigned to Users. May control access to Commission, Medical Review approval, Audit Trail, and admin overrides.

Business rules: Sensitive decisions such as Commission Owner changes and clinical approval require appropriate permissions.

Example ID format: `ROLE-2026-000001`

## Entity Relationships

- Patient has many Cases.
- Patient has one Patient Acquisition record.
- Patient may have one Lifetime Partner Owner.
- Patient may have many Partner Attribution attempts.
- Case belongs to Patient.
- Case may have many Medical Reviews.
- Case may have many Hospital Referrals.
- Case may have many Hospital Quotes.
- Case may have many Medical Documents.
- Case may have many Timeline Events.
- Case may have many Tasks.
- Case may have many Communications.
- Hospital Referral belongs to Case.
- Hospital Referral belongs to Hospital.
- Hospital Referral may happen before Medical Review.
- Hospital Referral protects commission rights.
- Medical Review belongs to Case.
- Medical Review may use many Medical Documents.
- Medical Review may generate Preliminary Medical Opinion.
- Preliminary Medical Opinion is patient-facing and must be reviewed internally.
- Hospital Medical Opinion / MSO comes from Hospital.
- Hospital Quote belongs to Hospital Referral and Case.
- Commission may belong to Partner, AfraMedico, or split.
- Travel Plan belongs to Case.
- Treatment Episode belongs to Case.
- Follow-up belongs to Patient and/or Case.

## Critical Business Rules

1. Patient is not the same as Case.
2. One patient may have multiple cases over time.
3. Case is the operational unit.
4. Patient is the long-term identity.
5. Lifetime Partner Owner is preserved across future cases unless changed by admin with reason.
6. Duplicate detection must flag but never block.
7. Early Hospital Registration may happen before Medical Review.
8. Medical Review is required before a complete clinical package or detailed quote request.
9. Partner attribution and hospital commission protection are different concepts.
10. First touch, last touch, declared referral, verified referral, Commission Owner, and Lifetime Partner Owner must remain separate.
11. Every important action must create audit trail.
12. History must never be overwritten.
13. Admin overrides require reason and timestamp.
14. Medical Review output is a decision package, not just a document summary.
15. AfraMedico Preliminary Medical Opinion is not the same as Hospital MSO.
16. Patient/family decision remains final unless unsafe or legally unacceptable.
17. The system protects business relationships, not only patient records.

## Future Database Implications

Future Supabase/database design should avoid duplicated patient data across modules.

Every module should reference stable IDs instead of storing repeated names:

- `patient_id`
- `case_id`
- `partner_id`
- `hospital_id`
- `hospital_referral_id`
- `medical_review_id`

Examples:

- Medical Review should reference `case_id`, not duplicate the full Patient record.
- Hospital Quote should reference `hospital_referral_id`, `hospital_id`, and `case_id`.
- Commission should reference `partner_id`, `case_id`, and relevant attribution or referral records.
- Audit Trail should reference entity type and entity ID rather than copying entire records.

This will preserve data consistency, reduce conflicting records, and make future reporting reliable.

## Future UI Implications

Case Workspace is the operational center.

Patient Workspace will be created later for long-term patient history across multiple cases.

Medical Review Center should connect to Case Workspace and show review status by Case.

Referral Protection should connect to Hospital Referral and Partner Attribution.

Mission Control should summarize all core entities without becoming the source of truth for any one entity.

Future UI navigation should respect these levels:

- Patient-level: long-term identity and lifetime partner ownership.
- Case-level: operational treatment journey.
- Referral-level: hospital registration and commission protection.
- Review-level: clinical package and decision workflow.
- Quote-level: hospital response, cost, and treatment plan.

