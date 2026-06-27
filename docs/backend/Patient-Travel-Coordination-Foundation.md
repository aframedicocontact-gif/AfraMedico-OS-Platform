# Patient Travel Coordination Foundation

## Purpose

Backend Sprint 5 creates the Patient Travel Coordination Foundation for AfraMedico OS Platform.

ICOS is not a booking platform.

ICOS coordinates medical travel while reservations remain with the patient, trusted travel providers, hospital partners, or future external booking integrations.

## Architecture

The travel coordination foundation is organization-scoped and case-centered.

Tables created:

- `travel_plans`
- `travel_milestones`
- `visa_processes`
- `travel_companions`
- `airport_transfers`
- `hotel_coordination`
- `flight_coordination`
- `interpreter_services`
- `medical_escort_services`
- `travel_documents`

Every table includes `organization_id`.

Every coordination record links to a Case through `case_id`.

`travel_plans` also links to `patient_id` so the travel layer remains connected to the long-term Patient identity.

## Workflow

The travel workflow begins when a Case needs travel coordination.

1. A `travel_plan` is created for the Case.
2. Visa coordination is tracked through `visa_processes`.
3. Companions are tracked through `travel_companions`.
4. Airport and local transfers are coordinated through `airport_transfers`.
5. Hotel options and external references are coordinated through `hotel_coordination`.
6. Flight information and external booking references are tracked through `flight_coordination`.
7. Interpreter needs are coordinated through `interpreter_services`.
8. Medical escort needs are coordinated through `medical_escort_services`.
9. Travel documents are tracked through `travel_documents`.
10. The complete travel timeline is preserved through `travel_milestones`.

## Entity Relationships

One Case may have one or more Travel Plans over time.

One Travel Plan may have:

- many milestones
- many visa records
- many companions
- many airport transfers
- many hotel coordination records
- many flight coordination records
- many interpreter service records
- many medical escort service records
- many travel documents

All child records reference `travel_plans(id, organization_id)` to preserve tenant isolation.

## Business Principles

ICOS coordinates travel.

ICOS does not sell flights.

ICOS does not sell hotel stays.

ICOS does not replace travel agencies.

ICOS does not become merchant of record for optional third-party travel services unless explicitly contracted in the future.

The system records:

- coordination status
- external booking provider
- external booking reference
- responsible coordinator
- timeline milestones
- required documents
- patient and companion travel readiness

The system does not perform booking transactions in this sprint.

## Travel Timeline

`travel_milestones` is append-only by RLS policy.

Organization members can select and insert milestones, but normal policies do not allow update or delete.

This preserves a complete travel coordination timeline.

Milestones are timeline-compatible because they include:

- `case_id`
- `patient_id`
- `event_type`
- `event_title`
- `event_description`
- `scheduled_at`
- `completed_at`
- `created_by`

## RLS Rules

All tables enable Row Level Security.

Policies restrict rows by:

`organization_id = public.current_organization_id()`

This follows the existing SaaS foundation where authenticated users carry organization context in:

`auth.jwt().app_metadata.organization_id`

## Future Booking API Integrations

Future integrations may include:

- flight booking APIs
- hotel booking APIs
- airport transfer providers
- travel insurance APIs
- visa status APIs
- hospital partner travel desks
- patient portal travel confirmation

These integrations should write coordination references back into ICOS without changing the principle that ICOS is primarily an operating system, not a booking marketplace.

## Future Affiliate Integrations

Future affiliate integrations may include:

- travel agency referral links
- hotel affiliate programs
- insurance affiliate programs
- airport transfer partner tracking
- partner commission attribution

Any affiliate model must be explicit, auditable, and separated from medical decision-making.

## Sprint Boundary

This sprint does not add:

- React UI changes.
- Frontend JSON changes.
- Seed data.
- Booking APIs.
- Affiliate APIs.
- Payment processing.
- Storage buckets.
- WhatsApp, SMS, or email integrations.
- AI services.
