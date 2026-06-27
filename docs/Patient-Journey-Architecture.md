# AfraMedico Intelligent Care Operating System (ICOS) - Patient Journey Architecture

This document defines the Patient Journey & Logistics Architecture for AfraMedico ICOS.

It covers the operational workflow that begins after a patient accepts a proposed treatment plan and continues through treatment readiness, visa coordination, travel logistics, hospital handover, treatment monitoring, discharge, return home, and follow-up.

This is living architecture documentation and should evolve with the software.

## Mission

The Patient Journey & Logistics Center manages operational coordination.

Its purpose is not to sell travel services.

Its purpose is to coordinate every operational activity required to safely move the patient from treatment acceptance to hospital admission, then through discharge and follow-up.

The module should protect patient safety, operational clarity, hospital coordination, and AfraMedico accountability.

## Start Condition

The Patient Journey workflow starts only after:

- Patient accepts treatment.
- Hospital is selected.
- Treatment window is agreed.
- Estimated quotation is accepted.
- Deposit requirements are known.

Before this point, related work belongs mainly to Lead Management, Clinical Decision Center, Hospital Relations, Referral Protection, Finance, and Case Workspace.

## Phase 1: Treatment Readiness Planning

### Objectives

- Determine desired treatment time window.
- Estimate visa processing time.
- Estimate invitation letter processing time.
- Estimate hospital scheduling.
- Estimate travel readiness.
- Assign the journey coordinator.

### Output

- Target Travel Date
- Target Admission Date
- Target Procedure Date
- Journey Coordinator Assigned

### System Support

ICOS should show readiness dependencies clearly so the coordinator understands whether the patient can realistically arrive within the treatment window.

This phase should connect to:

- Case ID
- Patient ID
- Hospital ID
- Quote ID
- Finance/deposit status
- Hospital scheduling status
- Journey Coordinator

## Phase 2: Visa & Invitation Coordination

The system coordinates:

- Invitation Letter Request
- Invitation Letter Received
- Visa Documents Prepared
- Visa Application Submitted
- Visa Appointment
- Visa Decision
- Visa Expiry

### Business Rule

AfraMedico coordinates the visa process.

The patient submits the visa application unless otherwise arranged.

AfraMedico should not imply legal control over government visa decisions. The system should track coordination, document readiness, appointment status, and deadlines.

### System Support

Each visa activity should have:

- Owner
- Status
- Due date
- Evidence
- Notes
- Related Case ID
- Related Hospital
- Related Country

## Phase 3: Travel Logistics

AfraMedico coordinates travel.

AfraMedico does not become the merchant of record for hotels or flights unless explicitly contracted.

### Travel Option Fields

- Travel Option
- Handled By
- Patient
- Hospital
- Third-party Provider
- AfraMedico
- Status
- Notes

### Future Integrations

Possible future integrations:

- Booking.com
- Hotel APIs
- Airline APIs
- Travel Agencies
- Hospital Hotel Partners

These integrations should be optional and should not change the core rule that AfraMedico is primarily the coordinator unless a separate commercial arrangement exists.

## Hotel Planning

Possible accommodation sources:

- Hospital partner hotels
- Booking platforms
- Patient-selected hotel
- Special accommodation

### Store

- Hotel Location
- Distance to Hospital
- Hospital Shuttle Available
- Cancellation Policy
- Notes
- Handled By
- Booking Status
- Check-in Date
- Check-out Date

### Business Guidance

Hospital-provided accommodation should be preferred when clinically appropriate, especially when the patient needs proximity, translation support, transfer coordination, or postoperative monitoring.

The patient chooses hotel and flights unless the hospital package includes them or AfraMedico is explicitly contracted to arrange them.

## Flight Planning

### Store

- Preferred Airport
- Departure Date
- Arrival Date
- Companion
- Wheelchair Assistance
- Medical Clearance
- Fit to Fly
- Airline
- Flight Number
- Baggage Notes

### Business Guidance

Flight planning must reflect clinical readiness. For high-risk cases, the system should require fit-to-fly review before marking travel as ready.

## Airport Coordination

### Store

- Arrival Airport
- Arrival Time
- Driver
- Vehicle
- Emergency Contact
- Hospital Pickup
- Hotel Pickup
- Pickup Status
- Coordinator Notes

### System Support

Airport coordination should be visible to:

- Journey Coordinator
- Case Manager
- Hospital Coordinator
- Patient Support
- Travel Team

Every airport pickup or handoff must have an owner and a confirmation status.

## Interpreter Support

### Store

- Language
- Interpreter Required
- Hospital Interpreter
- AfraMedico Interpreter
- External Interpreter
- Dates Required
- Status
- Notes

### Business Guidance

Interpreter support is a patient safety and patient experience issue, not only a convenience feature.

The system should show interpreter needs before admission, during consultation, on procedure day, and at discharge.

## Medical Escort

Possible support types:

- Commercial Flight
- Medical Escort
- Ground Ambulance
- Air Ambulance
- Local Stabilization Required

### System Support

Medical escort planning should connect back to Clinical Decision Center and Hospital Relations. If local stabilization is required, travel should not be treated as ready until the clinical team clears the patient.

## Phase 4: Hospital Handover

Hospital handover happens when:

- Arrival confirmed.
- Hotel confirmed.
- Hospital notified.
- Admission scheduled.
- Hospital coordinator assigned.
- Patient officially handed over to hospital.

### Record

- Date
- Time
- Coordinator
- Hospital Contact
- Notes
- Handover Status
- Evidence

### Business Rule

Every hospital handover must be recorded.

This protects patient safety, hospital relationships, and operational accountability.

## Phase 5: Treatment Monitoring

### Record

- Admission
- Procedure
- ICU
- Ward
- Complications
- Progress Updates
- Expected Discharge
- Hospital Contact
- Coordinator Notes
- Family Updates

### System Support

Treatment monitoring should not replace hospital clinical responsibility. It should help AfraMedico coordinate communication, updates, and operational follow-through.

## Phase 6: Discharge

### Collect

- Discharge Summary
- Medication List
- Recommendations
- Next Appointment
- Medical Documents
- Images
- Invoices
- Follow-up Instructions

### System Support

Discharge should create follow-up tasks automatically in future versions. In the frontend prototype, it should be represented as a required checklist and timeline event.

## Phase 7: Return Home

### Track

- Return Flight
- Airport Transfer
- Travel Clearance
- Patient Returned Home
- Companion Status
- Post-travel Instructions

### Business Rule

Return travel should be coordinated only when the patient is clinically cleared to travel.

## Phase 8: Follow-up

### Track

- Telemedicine
- Document Upload
- Questions
- Complications
- Additional Treatment
- Future Case

### Business Rule

A future treatment request should create a new Case for the same Patient, not overwrite the completed Case.

The Patient is the long-term identity. The Case is the operational treatment journey.

## Business Principles

### AfraMedico Coordinates

AfraMedico coordinates the journey across patient, hospital, travel, finance, and support teams.

The system should make coordination responsibilities explicit through owners, statuses, tasks, and handoffs.

### AfraMedico Does Not Automatically Become Responsible for Optional Third-party Commercial Services

AfraMedico does not become responsible for optional third-party commercial services unless explicitly contracted.

This includes hotels, flights, external interpreters, transport providers, and travel agencies.

The system should always record who handled each operational item.

### Affiliate Integrations May Be Used in the Future

Affiliate or partner integrations may support hotel booking, travel planning, or related services in future phases.

These integrations must not blur operational responsibility or patient choice.

### Patient Choice Remains Central

Patient chooses hotel and flights unless hospital package includes them or AfraMedico is explicitly contracted to arrange them.

The system should support patient-selected, hospital-selected, third-party, and AfraMedico-coordinated options.

### Hospital Accommodation Should Be Preferred When Clinically Appropriate

Hospital-provided or hospital-partner accommodation should be preferred when it improves clinical coordination, proximity, safety, or post-procedure support.

### Every Operational Handoff Must Be Recorded

Transfers between Case Management, Clinical, Hospital Relations, Finance, Travel, and Patient Support must create a visible handoff.

Each handoff should include:

- From Department
- To Department
- From User
- To User
- Reason
- Timestamp
- Accepted / Rejected
- Notes
- Audit Trail

### Every Responsibility Must Have an Owner

No journey activity should exist without an owner.

This aligns with the Operations Center rule:

- No Case should ever have no Owner.
- No Work Item should ever have no Owner.
- Every transfer must be logged.
- History must never be overwritten.

## Related Modules

Patient Journey & Logistics Center should connect to:

- Case Workspace
- Clinical Decision Center
- Hospital Relations
- Finance
- Operations Center
- Mission Control
- Referral Protection Engine
- Lead Management
- Follow-up Center

## Future Integrations

Future integrations may include:

- Booking.com
- Airline reservation systems
- Hospital scheduling systems
- WhatsApp
- Email
- SMS
- Google Calendar
- Payment Gateway

These integrations should support coordination, reminders, evidence, and visibility. They should not remove human ownership for clinically sensitive, financially sensitive, or travel-risk decisions.

## Core Data Relationships

Patient Journey records should connect through stable IDs:

- `patient_id`
- `case_id`
- `hospital_id`
- `quote_id`
- `journey_id`
- `task_id`
- `handoff_id`
- `audit_event_id`

The Journey belongs to the Case.

The Case belongs to the Patient.

Travel, visa, hotel, airport pickup, interpreter, escort, discharge, and follow-up records should not duplicate patient identity data. They should reference the Patient and Case through stable IDs.

## Architecture Rule

Patient Journey & Logistics Center is an operational coordination layer.

It should not become:

- A travel agency system
- A hotel booking business
- A flight merchant system
- A replacement for hospital clinical responsibility
- A replacement for visa/legal authority

It should become:

- The operational safety layer after treatment acceptance
- The handoff layer between hospital readiness and patient arrival
- The coordination record for travel, admission, discharge, and follow-up
- The source of journey accountability inside ICOS
