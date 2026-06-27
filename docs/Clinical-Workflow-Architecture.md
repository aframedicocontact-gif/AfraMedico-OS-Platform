# AfraMedico Business Growth OS - Clinical Workflow Architecture

This document defines the clinical workflow architecture for AfraMedico Business Growth OS. It is a living architecture document and should evolve with the Medical Review Center, Case Workspace, Referral Protection, hospital workflows, and future AI/OCR systems.

## Core Concept

Medical Review Center is not simply document review.

It is the clinical decision workflow that turns raw patient files into:

1. A preliminary patient-facing medical opinion.
2. A hospital-ready medical package.

Medical Review belongs to the Case. A Patient may have multiple Cases, and each Case may have its own Medical Review cycle.

## Early Hospital Registration vs Medical Review

Early Hospital Registration is separate from Medical Review.

Early Hospital Registration:

- May happen before Medical Review.
- Protects AfraMedico commission rights.
- Protects valid Referral Partner rights.
- Requires enough minimum patient data to register or timestamp the patient with a hospital.
- Must create evidence and audit trail.

Medical Review:

- Prepares the clinical package.
- Reviews document completeness and clinical readiness.
- Supports patient-facing preliminary guidance.
- Is required before sending a full clinical package or requesting detailed specialist review and quote.
- Must not block early hospital registration.

## Case-Based Review Model

Medical Review is Case-based, not Patient-only.

Rules:

- One Patient may have multiple Cases.
- Each Case may have one or more Medical Review cycles.
- A closed Case may have a completed review.
- A reopened Case may require a new review cycle.
- A future Case may begin with a document request before clinical review.
- Medical Review records should connect to Case ID.

## Document Completeness Review

Medical Review starts with Document Completeness Review.

The first question is not “what is the diagnosis?” The first question is:

Are the documents sufficient for clinical assessment?

Examples:

- MRI report exists but DICOM MRI files are missing.
- Pathology report is missing.
- Lab results are outdated.
- Passport is missing.
- Discharge summary is missing.
- Medication list is missing.
- Prior treatment history is incomplete.

Document completeness should be visible before clinical interpretation.

## Specialty-Specific Checklists

Required documents depend on the medical condition and specialty.

Specialty checklists should eventually exist for:

- Oncology
- Neurosurgery
- Cardiac surgery
- Orthopedics
- IVF
- Transplant
- Rehabilitation
- Emergency cases

Each checklist may require different imaging, pathology, lab, medication, and prior-treatment evidence.

## Missing Document Requests

Missing document requests must be sent to the patient or family contact.

If the case came through a Referral Partner:

- The partner should receive a copy or status update.
- The partner may help with follow-up.
- AfraMedico remains the main communication owner.

The operating principle is:

The partner stays informed, but AfraMedico becomes the operational communication center for medical documentation and coordination.

## Preliminary Medical Opinion

After documents are sufficiently complete, AfraMedico may generate an AI-assisted Preliminary Medical Opinion.

Purpose:

- Keep the patient engaged.
- Reduce waiting-time anxiety.
- Prevent patient loss during hospital response delays.
- Show AfraMedico clinical value early.
- Help the patient/family understand likely next steps.

Target delivery time:

- Ideally within 24-48 hours after documents are sufficiently complete.

The Preliminary Medical Opinion must be reviewed by AfraMedico clinical leadership before it is sent to the patient or family.

## Required Disclaimer

Every patient-facing Preliminary Medical Opinion must include this disclaimer:

> This is a preliminary medical opinion based on available documents and does not replace evaluation by the treating specialist or hospital medical team.

## AI Validation Rule

AI output must be internally validated.

Rules:

- AI may make errors.
- AfraMedico clinical lead must review AI-generated content.
- Clinical lead may correct, approve, reject, or request more documents.
- AI output should not be sent directly to patients without internal review.
- Approval or rejection must be logged.

## Emergency Cases

Emergency cases must be flagged.

Possible emergency outcomes:

- Recommend urgent local care first.
- Air ambulance candidate.
- Medical escort required.
- Commercial travel not recommended.
- Immediate hospital escalation.

Emergency workflows should prioritize patient safety over conversion.

## Ethical Non-Travel Recommendations

Some cases may not benefit from international travel.

Example:

- End-stage cancer cases may gain limited clinical benefit from expensive international treatment.

AfraMedico should ethically advise the patient or family when international treatment may have low expected benefit.

The patient/family may still choose to continue. AfraMedico provides advisory guidance. Final decision belongs to the patient/family unless the case is unsafe, unethical, or legally unacceptable.

## Patient-Facing vs Hospital-Facing Outputs

AfraMedico must clearly separate patient-facing and hospital-facing outputs.

Patient-facing output:

- Preliminary Medical Opinion.
- Explanation of findings.
- Missing information.
- Suggested questions.
- Possible next steps.
- Clear disclaimer.

Hospital-facing output:

- Medical Summary.
- Clinical Case Summary.
- Case Brief.
- Hospital Submission Package.

When sending to hospitals, do not call the AfraMedico AI-assisted document a “Medical Second Opinion.”

## Hospital Medical Second Opinion

Hospital MSO is the specialist opinion from the hospital.

AfraMedico may request from the hospital:

- Specialist review.
- Treatment plan.
- Estimated cost.
- Expected length of stay.
- Required documents.
- Urgency.
- Possible risks.

Hospital response should be stored separately from AfraMedico preliminary review.

## Final Patient Recommendation Package

After hospital response, AfraMedico sends the final recommendation package to the patient or family.

This may include:

- Hospital specialist opinion.
- Proposed treatment plan.
- Estimated cost.
- Expected stay.
- Invoice or proforma invoice.
- Next steps.
- Limitations and disclaimers.

This package should clearly distinguish AfraMedico guidance from the hospital specialist opinion.

## Medical Review Outcome Statuses

Medical Review outcome statuses:

- Documents Incomplete
- Waiting for Documents
- AI Draft Generated
- Internal Review Required
- Preliminary Opinion Approved
- Preliminary Opinion Sent
- Ready for Hospital Submission
- Hospital Review Requested
- Hospital Opinion Received
- Final Recommendation Sent
- Not Recommended for Travel
- Emergency Escalation

## Audit Trail Requirements

Every important action must create audit trail.

The audit trail should capture:

- Who reviewed.
- When they reviewed.
- What was missing.
- What was sent.
- What was corrected.
- Who approved AI opinion.
- When patient/family was notified.
- When partner was copied.
- When hospital package was sent.

Audit history must not be overwritten.

## System Connections

Medical Review Center must connect to:

- Case Workspace
- Referral Protection
- Hospital Referrals
- Hospital Quotes
- Patient Journey
- Future AI Medical Review system
- Future Document OCR system

These connections should preserve the difference between:

- Commission-protection registration.
- Clinical readiness.
- Hospital specialist opinion.
- Patient-facing final recommendation.

## Purpose of Medical Review Center

Medical Review Center exists to:

- Protect patient trust.
- Improve clinical quality.
- Reduce patient loss during waiting time.
- Prepare hospital-ready case packages.
- Support ethical decision-making.
- Help AfraMedico communicate earlier and more clearly.
- Ensure clinical AI is reviewed before external use.
- Keep Referral Partners informed without making them the operational communication owner.

