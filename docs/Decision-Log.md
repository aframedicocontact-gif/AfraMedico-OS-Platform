# AfraMedico Business Growth OS - Decision Log

This document records major architecture and business design decisions for AfraMedico Business Growth OS. It should remain chronological and should be updated whenever a significant product, data model, or operating model decision is made.

## Decision 001: Patient is not the same as Case.

Date: 2026-06-25

Status: Accepted

Context: Early lead and patient workflows could incorrectly treat each lead or inquiry as a permanent patient record.

Decision: Patient and Case are separate concepts.

Reason: A patient may return for chemotherapy cycles, follow-up, or a different treatment later.

Impact on system design: The system must preserve Patient ID separately from Case ID. Lead Profile, Referral Protection, and Case Profile should all support both identifiers.

## Decision 002: One patient may have multiple cases.

Date: 2026-06-25

Status: Accepted

Context: Medical tourism patients may have staged care, recurring treatments, follow-up reviews, or future treatment needs.

Decision: A single Patient can own multiple Case records.

Reason: Long-term care and staged treatment require separate operational records.

Impact on system design: Lead Profile and Case Profile must show Patient Cases. Future backend design should model Patient and Case as separate entities with a one-to-many relationship.

## Decision 003: One case may have multiple hospital referrals.

Date: 2026-06-25

Status: Accepted

Context: One treatment journey may require comparing hospitals, destinations, prices, and doctors.

Decision: A Case can include multiple Hospital Referrals.

Reason: Patients may be sent to Acibadem, Medipol, Memorial, Bumrungrad, etc. for comparison.

Impact on system design: Hospital Referral records must belong to a Case ID and preserve their own status, registration, quote, coordinator, evidence, and timeline.

## Decision 004: Duplicate detection must not block registration.

Date: 2026-06-25

Status: Accepted

Context: Duplicate prevention can accidentally stop valid patient intake or hospital registration.

Decision: Possible duplicates should be flagged but not blocked.

Reason: Name similarities, partial data, and independent partner submissions are common.

Impact on system design: Forms and workflows should allow creation while showing warning badges and creating duplicate review items.

## Decision 005: Duplicate cases create manager review tasks.

Date: 2026-06-25

Status: Accepted

Context: Duplicate ownership and commission conflicts can be too sensitive for automatic resolution.

Decision: Duplicate cases should create manager review tasks or review records.

Reason: Final ownership must be decided by a human manager.

Impact on system design: Duplicate Review Center must show matching score, existing records, evidence, hospital referrals, and manager action options.

## Decision 006: Commission Owner can be changed only by admin with reason.

Date: 2026-06-25

Status: Accepted

Context: Commission ownership may need correction after evidence review or dispute resolution.

Decision: Commission Owner can be changed only by an admin or manager with a required reason.

Reason: Commission disputes require business judgment and audit trail.

Impact on system design: Commission Ownership views must capture reason, decision date, decision by, and audit event. No ownership history should be deleted.

## Decision 007: Lifetime Partner Owner must be preserved.

Date: 2026-06-25

Status: Accepted

Context: A partner may validly introduce a patient who later returns for future cases.

Decision: Lifetime Partner Owner should carry forward across future Cases by default.

Reason: Partners need confidence that future patient cases remain connected to the original valid referral.

Impact on system design: New Case creation should inherit Lifetime Partner Owner unless an admin changes it with reason and audit trail.

## Decision 008: Direct leads have no partner owner unless attribution evidence exists.

Date: 2026-06-25

Status: Accepted

Context: Some patients enter directly through AfraMedico-owned channels without partner involvement.

Decision: Direct leads belong to AfraMedico unless valid attribution evidence proves partner or campaign ownership.

Reason: Patients may arrive through SEO, Google Ads, AI search, social media, or direct website forms.

Impact on system design: Lead records should support direct source, partner claims, attribution evidence, and manager review when needed.

## Decision 009: Partner campaign attribution must be tracked in the future.

Date: 2026-06-25

Status: Accepted

Context: Partners may promote AfraMedico externally before a patient later enters through a direct channel.

Decision: Partner campaign attribution should become a future tracked layer.

Reason: Partners may promote AfraMedico and patients may later enter directly.

Impact on system design: Future Attribution Protection must support referral links, UTM parameters, QR codes, partner codes, landing pages, declarations, and evidence files.

## Decision 010: Hospital referral protection is required before medical review when possible.

Date: 2026-06-25

Status: Accepted

Context: Hospital registration timing can affect AfraMedico's ability to prove commission rights.

Decision: Referral protection and hospital registration should happen before medical review when possible.

Reason: AfraMedico must protect its commission rights by registering the patient with the hospital early.

Impact on system design: Case Profile and Referral Protection should make hospital registration and protection status visible early in the workflow.

## Decision 014: Early Hospital Registration is separate from Medical Review.

Date: 2026-06-25

Status: Accepted

Context: Medical Review prepares a hospital-ready clinical package, but AfraMedico may need to register a patient with a hospital earlier to protect commission rights.

Decision: Early Hospital Registration must be allowed as soon as enough minimum patient data exists. Medical Review must not block this protection step.

Reason: AfraMedico must protect referral and commission rights early, while still requiring Medical Review before full clinical package submission or detailed treatment quote requests.

Impact on system design: Referral Protection and Hospital Referrals should support early registration, evidence capture, and audit trail before Medical Review is completed. Medical Review should gate detailed clinical package and quote workflows, not early registration.

## Decision 011: Every important action requires timestamp, user, evidence, and notes.

Date: 2026-06-25

Status: Accepted

Context: Informal actions can create ambiguity during disputes or audits.

Decision: Important actions must create structured audit events.

Reason: The system must support future disputes, audits, and partner/hospital trust.

Impact on system design: Audit Trail should be a cross-cutting concept across Lead Management, Referral Protection, Commission Ownership, Case Profile, and future modules.

## Decision 012: Attribution Protection Layer is locked as a future module.

Date: 2026-06-25

Status: Accepted

Context: Attribution is strategically important but should not be built before the core patient, case, referral, and medical review workflows are validated.

Decision: Attribution Protection Layer is documented as future architecture and not implemented yet.

Reason: First touch, last touch, declared referral, verified referral, commission owner, and lifetime partner owner must be tracked separately.

Impact on system design: Current modules should leave room for attribution evidence and review, but no tracking integrations should be added during the frontend prototype stage.

## Decision 013: AfraMedico Business Growth OS is not only a CRM.

Date: 2026-06-25

Status: Accepted

Context: The product started with CRM-like modules but expanded into protection, case operations, evidence, and future attribution architecture.

Decision: AfraMedico Business Growth OS should be treated as a business operating system, not only a CRM.

Reason: It is a medical tourism operating system covering authority, referrals, leads, protection, medical review, patient journey, hospitals, doctors, finance, and analytics.

Impact on system design: The architecture should prioritize connected modules, shared Patient and Case identity, auditability, relationship protection, and operational visibility.
