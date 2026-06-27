# AfraMedico Business Growth OS - Core Business Principles

This document defines the business principles that should guide AfraMedico Business Growth OS. These principles should shape product decisions, interface design, data modeling, future automation, and backend architecture.

## 1. Never lose a patient.

Explanation: Every patient inquiry, case, referral, and follow-up should remain visible and recoverable.

Why it matters in medical tourism: Patients often have complex journeys across countries, hospitals, treatments, documents, and timelines. Losing a patient means losing care continuity, revenue, and trust.

Software support: The system should preserve Patient ID, Case ID, contact details, case history, follow-ups, and timelines across modules.

## 2. Never lose a commission.

Explanation: Commercial rights must be protected from the first referral through hospital registration and treatment confirmation.

Why it matters in medical tourism: Commission disputes can occur when patients contact hospitals directly, enter through multiple partners, or submit incomplete information.

Software support: The system should track Commission Owner, Referral Ownership, hospital registration evidence, attribution evidence, and audit history.

## 3. Protect partner trust.

Explanation: Referral Partners must trust that AfraMedico will preserve valid referral rights.

Why it matters in medical tourism: Partners may invest time, reputation, and marketing budget before a patient converts.

Software support: The system should show who referred first, when, how, with what evidence, and what manager decision was made.

## 4. Protect hospital relationships.

Explanation: Hospital interactions should be documented clearly and professionally.

Why it matters in medical tourism: Hospitals need reliable communication, proper registration, accurate patient data, and clear ownership of cases.

Software support: Each Hospital Referral should track referral date, registration date, registration status, hospital case ID, coordinator, quote status, and expected response date.

## 5. Every important action must leave evidence.

Explanation: Important operational and commercial actions should not be informal or invisible.

Why it matters in medical tourism: Medical tourism involves cross-border coordination, sensitive documents, partner commissions, hospital quotes, and patient decisions.

Software support: The system should support evidence types such as email, WhatsApp, PDF, hospital confirmation, portal screenshot, registration number, voice note, and internal note.

## 6. Never overwrite history.

Explanation: New information should be added to the record, not used to erase older information.

Why it matters in medical tourism: Disputes often depend on timing, sequence, and original evidence.

Software support: Referral attempts, attribution events, ownership decisions, and audit events should be preserved as history.

## 7. Duplicates should be reviewed, not blocked.

Explanation: Possible duplicates should create a review path instead of stopping registration or intake.

Why it matters in medical tourism: Patient names may be similar, spellings may differ, and multiple partners may submit partial information.

Software support: The system should display duplicate warnings, allow creation, and create manager review cases.

## 8. One Patient can have multiple Cases.

Explanation: A Patient is the person. A Case is one medical journey or treatment request.

Why it matters in medical tourism: A patient may return for chemotherapy cycles, follow-up reviews, new treatment, or staged care.

Software support: Patient Profile concepts should support multiple Case records connected by Patient ID.

## 9. One Case can have multiple Hospital Referrals.

Explanation: A single treatment journey may be sent to multiple hospitals.

Why it matters in medical tourism: Patients often compare hospitals, prices, doctors, destinations, and timelines before deciding.

Software support: Case Profile should show multiple Hospital Referrals, each with its own registration, quote, coordinator, evidence, and timeline.

## 10. A Patient can have multiple Partner referral attempts.

Explanation: Multiple partners may claim or attempt to refer the same patient.

Why it matters in medical tourism: Partners may reach the same patient through different communities, campaigns, or channels.

Software support: The system should preserve every referral attempt and send ownership conflicts to manager review.

## 11. First valid attribution is preserved.

Explanation: The first valid referral or attribution event should remain visible even if later activity occurs elsewhere.

Why it matters in medical tourism: A patient may first discover AfraMedico through a partner and later submit a direct website form.

Software support: Future attribution logic should track first touch, last touch, declared referral, verified referral, and evidence separately.

## 12. Manager overrides are allowed only with reason and audit trail.

Explanation: Managers can resolve complex business cases, but decisions must be documented.

Why it matters in medical tourism: Commission and ownership disputes require human judgment, not automatic overwrites.

Software support: Override actions should require reason, decision date, decision by, and an Audit Trail event.

## 13. Lifetime Partner Owner must be preserved across future cases unless changed by admin with reason.

Explanation: Later Cases should inherit the Lifetime Partner Owner by default.

Why it matters in medical tourism: A partner who legitimately introduced a patient should remain protected when the patient returns for future care.

Software support: Case creation should inherit Lifetime Partner Owner and show any admin override reason if ownership changes.

## 14. Direct leads belong to AfraMedico unless valid attribution evidence exists.

Explanation: Direct submissions are AfraMedico-owned unless credible partner or campaign evidence proves otherwise.

Why it matters in medical tourism: Patients may come from SEO, Google Ads, AI search, social media, or direct website forms.

Software support: Lead records should distinguish direct source, declared partner, verified partner, and attribution evidence.

## 15. Partner-promoted leads require attribution review if the patient later enters directly.

Explanation: Direct entry does not always mean direct acquisition.

Why it matters in medical tourism: A partner may promote AfraMedico, then the patient later searches for AfraMedico and submits a form directly.

Software support: Future Attribution Protection should flag partner campaign evidence for manager review before final ownership decisions.

## 16. The system must protect business relationships, not only manage patient data.

Explanation: The operating system must support trust with patients, partners, hospitals, and internal teams.

Why it matters in medical tourism: Revenue depends on coordinated relationships, not only records in a database.

Software support: Modules should connect patient care, partner rights, hospital interactions, evidence, tasks, and management decisions.

## 17. The system should reduce operational risk before increasing automation.

Explanation: Reliability, traceability, and control come before automation.

Why it matters in medical tourism: Premature automation can create legal, commercial, and patient-care risk.

Software support: The product should first make workflows visible, structured, and reviewable before automating sensitive actions.

## 18. Every important decision must be traceable.

Explanation: Decisions should have context, reason, actor, timestamp, and evidence.

Why it matters in medical tourism: Traceability protects AfraMedico during disputes, audits, partner conversations, and hospital escalations.

Software support: Decision records should appear in Audit Trail and relevant Case, Patient, Referral, or Commission views.

## 19. Referral protection happens before medical review when possible.

Explanation: Early Hospital Registration and referral protection should happen early enough to preserve commercial rights.

Why it matters in medical tourism: If a hospital receives the patient without AfraMedico registration evidence, commission rights may be weakened.

Software support: The system should allow Early Hospital Registration as soon as minimum patient data exists. Medical Review should prepare the full hospital-ready clinical package and detailed quote request, but it must not block early registration for commission protection.

## 20. Automation must never remove managerial control in commission-sensitive situations.

Explanation: Automation may assist, but managers must control final commission and ownership outcomes.

Why it matters in medical tourism: Commission-sensitive cases involve trust, fairness, evidence, and business judgment.

Software support: Automated duplicate, attribution, or ownership suggestions should require manager approval before changing Commission Owner or Lifetime Partner Owner.
