# Clinical Decision Foundation

## Purpose

Backend Sprint 3 creates the database foundation for the ICOS Clinical Decision Center.

This sprint stores the workflow data needed to manage clinical reviews, document completeness, AI draft records, internal validation, hospital package readiness, MSO tracking, clinical recommendations, and patient preliminary opinions.

It does not add frontend UI, frontend JSON, mock data, AI services, OCR, storage buckets, PDF generation, or external integrations.

## Tables Created

This sprint introduces:

- `clinical_reviews`
- `clinical_required_documents`
- `clinical_ai_drafts`
- `clinical_validations`
- `clinical_hospital_packages`
- `clinical_mso_requests`
- `clinical_recommendations`
- `clinical_patient_opinions`

## Relationship To Case Workspace

Clinical Decision Center belongs to the Case.

The Case Workspace provides the operational center for notes, tasks, documents, and internal messages.

The Clinical Decision Center adds the clinical workflow layer for that same Case:

- document completeness
- clinical review status
- future AI draft output
- internal validation
- hospital package readiness
- MSO requests
- clinical recommendation
- patient preliminary opinion

Every clinical table includes `organization_id` and `case_id`.

`clinical_reviews` also includes `patient_id` and uses a same-organization Case/Patient foreign key so the clinical review cannot accidentally connect the wrong Patient to the wrong Case.

## Relationship To Future AI

`clinical_ai_drafts` stores future AI-generated clinical draft output.

It includes:

- clinical summary
- diagnosis
- key findings
- red flags
- urgency assessment
- suggested specialties
- suggested destinations
- suggested providers
- hospital questions
- confidence level
- validation status

## Why AI Output Is Stored But Not Generated Here

This migration creates database structure only.

AI services should not be introduced until the clinical workflow, approval model, risk controls, and audit requirements are ready.

The table is designed to store AI output later, but this sprint does not:

- call an AI model
- create OCR logic
- create medical analysis functions
- generate PDFs
- automate clinical decisions

Human validation remains required for clinical, ethical, and governance decisions.

## RLS And `organization_id` Rules

Every table includes `organization_id`.

Every table enables Row Level Security.

Every RLS policy restricts access using:

`organization_id = public.current_organization_id()`

This depends on the Backend Sprint 1 convention that authenticated users carry their organization id in:

`auth.jwt().app_metadata.organization_id`

Same-organization foreign keys are used wherever possible to prevent cross-tenant clinical relationships between Cases, Patients, Providers, Reviews, and Users.

## Patient Preliminary Opinion Rule

`clinical_patient_opinions` stores AfraMedico preliminary clinical coordination opinions.

These are not final hospital opinions.

The default disclaimer states that the final recommendation will be provided after review by the selected hospital.

## Future Migrations

Future Clinical Decision migrations may add:

- clinical review audit triggers
- clinical document links to Case Workspace documents
- Supabase Storage metadata and policies
- reviewer assignment history
- clinical lead approval workflow
- MDT or tumor board workflows
- AI OCR result tables
- AI medical analysis result tables
- clinical risk flags
- clinical guideline references
- provider-specific MSO response details
- hospital package versioning
- patient-facing communication records
