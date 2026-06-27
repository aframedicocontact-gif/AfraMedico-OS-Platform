# AfraMedico Business Growth OS - Architecture

This document describes the current prototype architecture. It should evolve with the product and remain aligned with the implemented modules.

## Current Architecture Stage

The current system is a frontend-only clickable prototype.

It uses:

- React
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Local JSON data

It does not use:

- Backend services
- Supabase
- Authentication
- APIs
- SQL
- Migrations

## Project Boundary

AfraMedico Business Growth OS is separate from the public AfraMedico website. The prototype must not depend on or modify the public website.

The current app is an internal operations workspace for:

- Authority growth operations
- Referral partner management
- Lead and patient intake workflows
- Referral protection
- Case-level operational control

## Frontend Structure

Current implementation is organized around:

- `src/app` for application composition and routing state
- `src/components/layout` for the shared shell and navigation
- `src/components/pages` for page-level screens
- `src/components/ui` for reusable UI primitives
- `src/components/leads`, `src/components/referrals`, and `src/components/protection` for module-specific UI helpers
- `src/data` for local JSON prototype data
- `src/types` for TypeScript data models
- `src/styles` for global styling

## Data Layer

The prototype data layer is local JSON only.

Current data files:

- `src/data/organizations.json`
- `src/data/referral-partners.json`
- `src/data/leads.json`
- `src/data/referral-protection.json`
- `src/data/case-profiles.json`

The JSON files represent prototype data contracts. They should be kept close to the future database model but must remain simple enough for UX validation.

## Type Layer

Current type files:

- `src/types/organization.ts`
- `src/types/referralPartner.ts`
- `src/types/lead.ts`
- `src/types/referralProtection.ts`
- `src/types/caseProfile.ts`

Types define the expected shape of local JSON records and help keep pages consistent while the system remains frontend-only.

## Navigation Model

The app uses a shared internal sidebar and top workspace shell.

Current navigation includes:

- Dashboard
- Authority CRM
- Referral Partners
- Lead Management
- Referral Protection
- Case Profile
- Countries
- Organizations
- Contacts
- Activities
- Tasks
- Reports
- Settings

Some navigation items are placeholders or coming-soon items. This is acceptable during prototype validation.

## Module Relationship Model

The long-term business architecture is centered on Patient and Case.

```text
Patient
  -> Case
    -> Lead Management
    -> Medical Review
    -> Hospital Referrals
    -> Hospital Quotes
    -> Referral Protection
    -> Patient Journey
    -> Timeline
    -> Audit Trail
    -> Files
    -> Notes
    -> Tasks
```

Key principle:

- Patient is the person.
- Case is the treatment journey.
- Lead is an intake/opportunity workflow that may create or connect to a Case.
- Referral Protection preserves commercial and legal evidence around the Patient and Case.
- Case Profile is the operational single source of truth.

## Protection and Clinical Review Boundary

Early Hospital Registration and Medical Review are separate workflows.

- Early Hospital Registration belongs to Referral Protection and Hospital Referrals.
- Early Hospital Registration protects referral and commission rights.
- Early Hospital Registration can happen before Medical Review when minimum patient data exists.
- Medical Review belongs to the Case.
- Medical Review prepares a hospital-ready clinical package.
- Medical Review is required before sending full clinical documentation or requesting a detailed treatment quote.
- Medical Review must not block early hospital registration.

## Patient and Case Model

Patient fields currently established conceptually:

- Patient ID
- Full name
- Date of birth
- Country
- Phone / WhatsApp
- Email
- Primary Partner Attribution
- First Referral Date
- Lifetime Partner Owner
- Ownership Status
- Admin Override Reason
- Audit Trail

Case fields currently established conceptually:

- Case ID
- Patient ID
- Treatment Requested
- Medical Condition
- Destination
- Case Status
- Created Date
- Closed Date
- Reopened Date
- Assigned Coordinator
- Related Hospital Referrals
- Related Quotes
- Related Medical Review
- Related Patient Journey

## UI System

Visual direction:

- Enterprise SaaS style
- Emerald and deep green foundation
- White and light gray surfaces
- Subtle gold accents
- Dense but readable operational screens
- Dashboard cards, tables, filters, timelines, badges, and Kanban boards

Shared UI primitives currently include:

- Badge
- Button
- Card
- Input
- Select
- Table
- Kanban Board

Kanban-style pipeline pages should use fixed-width columns with horizontal scrolling to preserve readability.

## Audit and Evidence Architecture

Audit and evidence are cross-cutting concepts, especially for Referral Protection, Commission Ownership, Case Profile, and future Attribution Protection.

Important events should be append-only in concept:

- No overwriting referral attempts
- No deleting ownership decisions
- No hiding duplicate review history
- No replacing attribution history with a single final value

Even in the frontend prototype, the UI should communicate this append-only mindset.

## Future Backend Readiness

When backend work is approved, the likely architecture should preserve the frontend contracts already validated here.

Future backend concerns may include:

- Supabase database
- Authentication and roles
- Row-level access policies
- File storage
- Audit log tables
- Import jobs
- Notifications
- API boundaries
- Data validation

These are intentionally out of scope for the current prototype.

## Living Documentation Rule

When a module, business rule, field, status, or workflow changes, update:

- `Business-Rules.md`
- `Architecture.md`
- `Modules.md`
- `Roadmap.md`
- `Future-Ideas.md`

Architecture documentation should remain synchronized with the working prototype.
