# AfraMedico Business Growth OS - Future Ideas

This document captures ideas that are useful but not yet part of the current implementation scope. It should help future planning without creating accidental scope creep.

## Product Expansion Ideas

### Medical Review Center

Centralize the clinical review workflow before hospital referrals are sent.

Possible features:

- Review queue
- Document checklist
- Medical reviewer assignment
- Medical summary
- AI summary placeholder
- Missing document flags
- Treatment suitability notes
- Review due dates

### Patient Journey Module

Track the full patient journey from lead intake through treatment and follow-up.

Possible stages:

- Inquiry
- Documents Requested
- Medical Review
- Hospital Matching
- Quote Review
- Decision
- Visa
- Travel
- Admission
- Treatment
- Discharge
- Follow-up

### Treatment and Destination Matching

Help coordinators match patients to hospitals, countries, and treatments.

Possible features:

- Treatment category database
- Destination country suitability
- Hospital specialty matching
- Doctor matching
- Estimated cost ranges
- Patient preference comparison

### Hospital CRM

Manage hospital relationships separately from referral protection.

Possible features:

- Hospital directory
- Department contacts
- International office contacts
- Response time tracking
- Quote quality tracking
- Registration reliability
- Hospital performance dashboard

### Document and Evidence Vault

Create a secure file and evidence layer once backend storage is approved.

Possible file categories:

- MRI
- CT
- Pathology
- Passport
- Reports
- Images
- Invoices
- Consent
- Hospital confirmations
- Partner evidence

### Task and SLA Center

Create a unified work queue for coordinators and managers.

Possible tasks:

- Upcoming follow-ups
- Pending quotes
- Missing documents
- Partner follow-up
- Hospital follow-up
- Visa reminder
- Duplicate review decision
- Commission ownership decision

### Reporting Center

Create reports for management visibility.

Possible reports:

- Leads by source
- Leads by country
- Accepted leads
- Conversion rate
- Revenue estimate
- Partner performance
- Hospital response time
- Duplicate review outcomes
- Commission conflict history
- Authority growth

## Locked Future Module: Attribution Protection Layer

This is one of the most important future modules.

Purpose:

Protect the commercial rights of AfraMedico, Referral Partners, and Marketing Campaigns by identifying who generated the patient even if the patient later contacts AfraMedico directly.

Future concepts:

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
- Cookie / Session Tracking
- Manual Partner Declaration
- Evidence Files
- Audit Trail

Possible evidence:

- Partner referral URL
- UTM parameters
- QR Code
- Partner Code
- Landing Page
- Website Form
- WhatsApp Entry
- Phone Number Used
- Call Tracking
- Campaign ID
- Patient Declaration
- Partner Declaration
- Admin Notes
- Screenshots

Attribution statuses:

- Direct
- Partner
- Marketing Campaign
- Hospital
- Doctor
- NGO
- Unknown
- Pending Review

Manager review outcomes:

- Direct Lead
- Partner Lead
- Split Attribution
- Marketing Attribution
- Override

Important rule:

Attribution values may differ and must never overwrite each other.

## Future Integrations

Potential integrations after backend approval:

- Supabase
- Google Analytics
- Google Ads
- Meta Ads
- WhatsApp
- Email delivery
- Call tracking
- Partner referral links
- QR code generation
- File storage
- E-signature tools
- Calendar reminders

## Future AI-Assisted Features

Possible AI helpers:

- Medical summary draft
- Case timeline summary
- Missing document detection
- Partner performance insights
- Duplicate match explanation
- Quote comparison summary
- Patient journey risk summary
- Follow-up message drafts

These should remain assistive. Human review should be required for medical, legal, ownership, and commission decisions.

## Backend Readiness Ideas

When backend work begins, consider:

- Append-only audit logs
- Ownership decision tables
- Patient and Case separation
- Evidence metadata
- File storage policies
- Role-based permissions
- Manager approval workflow
- Import history
- Data quality checks
- Duplicate review workflow

## Design Ideas

The product should keep an enterprise SaaS style:

- Dense operational screens
- Clear tables
- Useful filters
- Professional badges
- Timelines for history
- Horizontal Kanban boards for pipelines
- Emerald and deep green brand foundation
- White and light gray surfaces
- Subtle gold accents for priority and commercial signals

Avoid turning internal tools into marketing pages. The first screen should be useful for work.

