# AfraMedico Business Growth OS - Modules

This document lists current modules, their purpose, key pages, data sources, and important product rules.

## Module 1: Authority CRM

Status: Implemented as frontend prototype.

Purpose:

Track African authority targets, outreach progress, backlink opportunities, partnerships, and country-level authority growth.

Pages:

- Authority Intelligence Dashboard
- Organizations List
- Organization Details
- Add Organization
- CSV Import placeholder

Local data:

- `src/data/organizations.json`

Core entities:

- Organization
- Country
- Category
- Priority
- Status
- Opportunity Type

Key categories:

- Universities
- Teaching Hospitals
- Medical Associations
- NGOs
- Health Blogs
- News Media
- Business Directories

Important rules:

- This module is for authority and growth operations, not patient management.
- CSV import is only a placeholder during the prototype.
- The module should remain separate from public website code.

## Module 2: Referral Partner CRM

Status: Implemented as frontend prototype.

Purpose:

Manage partners who can refer patients to AfraMedico.

Pages:

- Referral Dashboard
- Partner Directory
- Partner Profile
- Add Partner
- Referral Pipeline

Local data:

- `src/data/referral-partners.json`

Partner types:

- Physicians
- Specialist Clinics
- Diagnostic Centers
- NGOs
- HMOs / Insurance
- Travel Agencies
- Medical Facilitators
- Corporate Organizations

Pipeline stages:

- Prospect
- Contacted
- Meeting Scheduled
- Negotiation
- Agreement Signed
- Active Referrer
- Inactive

Important rules:

- Partner records should support commercial follow-up and referral tracking.
- Partner trust is a strategic business asset.
- Pipeline columns must remain readable and horizontally scrollable.

## Module 3: Lead Management

Status: Implemented as frontend prototype.

Purpose:

Manage potential patients from first contact until they become active patients, are accepted, or are lost.

Pages:

- Lead Dashboard
- Lead Directory
- Lead Profile
- Add New Lead
- Lead Pipeline

Local data:

- `src/data/leads.json`

Lead sources:

- Website
- WhatsApp
- Facebook
- Instagram
- Google Search
- Google Ads
- YouTube
- Referral Partner
- Hospital
- Doctor
- NGO
- Conference
- University
- Phone Call
- Email
- Walk-in
- Other

Lead statuses:

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

Pipeline stages:

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

Important rules:

- A Lead should connect to Patient ID and Case ID when available.
- Do not treat every Lead as a separate Patient forever.
- Patient Cases must be visible from Lead Profile.
- Duplicate warnings should not block creation or follow-up.
- Pipeline columns must remain readable and horizontally scrollable.

## Module 4: Referral Protection Engine

Status: Implemented as frontend prototype.

Purpose:

Protect AfraMedico commission rights, Referral Partner rights, hospital registration history, and legal/operational audit evidence.

Pages:

- Referral Protection Dashboard
- Hospital Referrals
- Referral Details
- Duplicate Review Center
- Commission Ownership
- Audit Trail

Local data:

- `src/data/referral-protection.json`

Core concepts:

- Hospital Referral
- Duplicate Review
- Commission Owner
- Referral Ownership
- Evidence
- Audit Trail

Important rules:

- A Patient may be referred to multiple hospitals.
- A Patient may be referred by multiple partners.
- Never overwrite referral attempts.
- Duplicate detection must never block registration.
- Manager ownership decisions require reason, date, decision maker, and audit trail.
- Partner protection depends on proving who referred first, when, how, with what evidence, and what decision was made.

## Module 5: Case Profile

Status: Implemented as frontend prototype.

Purpose:

Provide the Master Patient Case screen and single source of truth for one treatment journey.

Page:

- Case Profile

## Module 7: Operations Center

Status: Implemented as frontend prototype.

Purpose:

Establish the operational ownership model for AfraMedico Intelligent Care Operating System (ICOS), ensuring every Case and Work Item has a responsible department, responsible user, current owner, next owner, current stage, and next required action.

Pages:

- Operations Dashboard
- Department Workboard
- Case Ownership
- Role Matrix
- Work Item Engine
- Handoff Center
- Department Dashboard

Local data:

- `src/data/operations.json`

Core concepts:

- Responsible Department
- Responsible User
- Current Owner
- Next Owner
- Work Item
- Department Handoff
- Role Permission Matrix

Important rules:

- No Case should ever have no owner.
- No Work Item should ever have no owner.
- Every transfer between departments must be logged.
- History must never be overwritten.
- Audit Trail must record every ownership change.

Local data:

- `src/data/case-profiles.json`

Connected concepts:

- Patient
- Case
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

Case header includes:

- Case ID
- Patient ID
- Patient Name
- Photo Placeholder
- Country
- Age
- Gender
- Treatment Requested
- Medical Condition
- Destination Country
- Coordinator
- Priority
- Case Status
- Created Date
- Expected Travel Date
- Last Updated

Important rules:

- Every operational module should eventually be able to open the Case Profile by Case ID.
- Case Profile is the central operational record.
- The page should show commercial ownership, medical review status, hospital activity, timelines, audit evidence, files, notes, and tasks together.

## Module 6: Clinical Decision Center

Status: Implemented as frontend prototype.

Purpose:

Transform raw medical documents into document completeness decisions, AI-assisted preliminary opinions, internal clinical validation, patient-facing preliminary opinions, hospital-ready case packages, hospital MSO requests, and final patient recommendation packages.

Pages:

- Clinical Decision Dashboard
- Review Queue
- Clinical Review Workspace
- Document Completeness Review
- Preliminary Medical Opinion
- Hospital Case Package
- Hospital MSO Tracker

Local data:

- `src/data/clinical-reviews.json`

Important rules:

- Medical Review is part of the broader Clinical Decision Center.
- Clinical Review belongs to the Case, not directly to the Patient.
- Every Case Workspace can have one or more review cycles.
- Clinical Decision Center is required before sending a full clinical package or requesting a detailed treatment quote.
- Clinical Decision Center must not block Early Hospital Registration for referral and commission protection.
- Referral Protection can register a patient early with minimum patient data.
- Early Hospital Registration must preserve evidence and audit trail.

## Locked Future Module: Attribution Protection Layer

Status: Documented only. Do not implement yet.

Purpose:

Protect the commercial rights of AfraMedico, Referral Partners, and Marketing Campaigns by identifying who actually generated the patient.

Core concepts:

- First Touch Attribution
- Last Touch Attribution
- Lead Source
- Acquisition Source
- Referral Partner
- Campaign
- UTM Tracking
- QR Codes
- Partner Referral Codes
- Landing Pages
- Manual Partner Declaration
- Evidence Files
- Audit Trail

Important rules:

- First Touch, Last Touch, Declared Referral, Verified Referral, Commission Owner, and Lifetime Partner Owner may differ.
- Never overwrite attribution history.
- Manager decisions require reason and audit trail.
- Future integrations may include Google Analytics, Google Ads, Meta Ads, call tracking, WhatsApp, referral links, and landing pages.

## Coming-Soon Navigation Areas

The sidebar includes several broader operational areas that are not fully implemented yet:

- Countries
- Contacts
- Activities
- Tasks
- Reports
- Settings

These should remain visually present as part of the operating system direction, but they should not imply backend functionality during the prototype phase.
