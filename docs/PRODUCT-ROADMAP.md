# Product Roadmap

AfraMedico Business Growth OS is evolving into ICOS: an intelligent operating system for medical tourism growth, patient case operations, referral protection, clinical workflow coordination, provider knowledge, finance, and autonomous growth intelligence.

This roadmap defines long-term product maturity. It is not a release promise. Each version should be validated against real operational needs before implementation.

## Version 1.0 - Foundation

### Purpose

Establish the core operating system foundation: case-centered workflows, patient-aware modules, backend schema, authentication readiness, and the first Authority CRM growth workflow.

### Features

- Mission Control
- Authority CRM
- Referral Partner CRM
- Lead Management
- Case Workspace
- Clinical Decision Center
- Referral Protection Engine
- Operations Center
- Healthcare Provider Network
- Finance & Commission Center
- Supabase Backend Foundation v1.0
- Authentication foundation
- RLS and development admin bootstrap
- Organization, Patient, and Case management
- Case Detail Workspace
- Timeline integration
- Authority Discovery with curated and CSV data
- Tavily Web Search foundation
- OpenAI Intelligence Layer for Authority Discovery

### Business Value

- Creates the internal operating model for AfraMedico.
- Preserves patient, case, referral, provider, and finance context.
- Reduces operational fragmentation.
- Creates a foundation for real authority and partnership growth.
- Establishes SaaS-ready tenant architecture for future organizations.

### Completion Status

Partially complete.

Implemented in source:

- frontend prototype modules
- backend foundation migrations
- Supabase connection foundation
- auth foundation
- Authority Discovery serverless provider architecture

Needs verification:

- latest Vercel deployment state
- live Tavily/OpenAI runtime behavior
- full authenticated RLS workflow
- development admin provisioning status

### Dependencies

- Supabase Development project
- Vercel deployment
- valid Supabase Auth user
- correct `app_metadata.organization_id`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEV_ORGANIZATION_ID`
- `SEARCH_PROVIDER=tavily`
- `TAVILY_API_KEY`
- `AI_PROVIDER=openai`
- `OPENAI_API_KEY`

### Success Criteria

- Internal users must log in before accessing the app.
- Organization, Patient, Case, and Timeline workflows work against Supabase in development.
- Authority Discovery can run curated, CSV, and Tavily/OpenAI searches without fake data.
- Imported Authority CRM records preserve source evidence and intelligence fields.
- Backend Foundation v1.0 remains stable and additive.

## Version 1.1 - Revenue Engine

### Purpose

Turn ICOS from an operating prototype into a revenue-management system that tracks patient value, referral ownership, finance status, commission protection, and growth opportunities from lead to settlement.

### Features

- Live Finance & Commission Center
- Partner commission workflow
- Commission dispute workflow
- Quote-to-invoice linkage
- Case financial workspace
- Revenue protection dashboard
- Referral partner performance tracking
- Authority CRM opportunity-to-partnership tracking
- Partner settlement workflow
- Revenue attribution rules
- Audit-ready financial timeline

### Business Value

- Protects AfraMedico revenue.
- Protects partner trust.
- Reduces commission disputes.
- Connects marketing, referrals, patient cases, quotes, invoices, and settlements.
- Helps management identify where money is delayed, disputed, or at risk.

### Completion Status

Planned.

Backend finance foundation exists, but live frontend workflows and payment/settlement operations are not fully connected.

### Dependencies

- Backend Foundation v1.0
- Finance & Commission backend tables
- Referral Protection workflow
- Case Workspace
- Partner attribution rules
- role/permission enforcement
- audit event consistency
- future payment provider strategy

### Success Criteria

- Every revenue-bearing case has a financial status.
- Every accepted quote can become an invoice baseline.
- Every commission has an owner, status, reason, and audit trail.
- Partner settlement views show pending, approved, paid, and disputed amounts.
- Revenue risk is visible from Mission Control.

## Version 1.2 - SEO & Authority Intelligence

### Purpose

Build AfraMedico's authority, search visibility, partnerships, and referral network through a real discovery and relationship intelligence system.

### Features

- Real Authority Discovery provider architecture
- Tavily Web Search
- OpenAI organization intelligence extraction
- Authority CRM enrichment
- Outreach Workspace
- Relationship history
- Contact intelligence
- Opportunity Intelligence
- Partnership pipeline
- SEO/backlink opportunity tracking
- Import validation and duplicate prevention
- Evidence-based organization discovery

### Business Value

- Converts authority building into a repeatable operating workflow.
- Helps AfraMedico discover real universities, hospitals, associations, NGOs, media, and directories.
- Supports backlink acquisition, partnerships, referrals, and academic collaborations.
- Reduces manual research time.
- Makes growth operations measurable.

### Completion Status

Partially complete.

Implemented:

- Authority CRM
- Authority Discovery
- Curated and CSV providers
- Tavily serverless route
- OpenAI Intelligence Layer
- Outreach Workspace
- Opportunity Intelligence
- clickable external links
- horizontal enterprise tables

Needs verification:

- Tavily/OpenAI runtime with real Vercel environment variables
- quality of extracted organization intelligence
- cost per search
- production persistence strategy for imported intelligence

### Dependencies

- Vercel serverless functions
- Tavily key
- OpenAI key
- Authority CRM local import service
- future Supabase persistence for Authority CRM
- human verification workflow

### Success Criteria

- Users can run real Tavily-backed searches.
- OpenAI returns only evidence-supported organization intelligence.
- No fake organizations, websites, emails, or LinkedIn URLs are generated.
- Imported organizations appear immediately in Authority CRM.
- Outreach and Opportunity Intelligence can operate on imported records.
- Search cost and quality are acceptable for repeated operational use.

## Version 2.0 - AI Business Agent

### Purpose

Introduce a controlled AI business agent that helps AfraMedico analyze operations, recommend actions, prioritize work, and prepare business intelligence while preserving human approval for sensitive decisions.

### Features

- Executive AI recommendations
- Authority growth recommendations
- Partner follow-up recommendations
- Hospital performance analysis
- Case risk alerts
- Revenue risk alerts
- Clinical workflow readiness insights
- Missing document intelligence
- Provider recommendation support
- Draft outreach recommendations
- AI-generated task suggestions
- Evidence and source citation requirements

### Business Value

- Reduces management blind spots.
- Turns operational data into daily priorities.
- Helps teams decide what to do next.
- Improves speed without removing managerial control.
- Supports better partner, provider, and patient follow-up.

### Completion Status

Future.

Some AI concepts exist in frontend prototypes and Authority Discovery. A general AI Business Agent has not been implemented.

### Dependencies

- stable live backend data
- audit and timeline consistency
- permission model
- provider and partner data quality
- clinical governance rules
- AI provider cost controls
- AI output logging/provenance
- human approval workflows

### Success Criteria

- AI recommendations cite source data or evidence.
- Users can accept, reject, or modify recommendations.
- AI does not perform commission, clinical, or financial decisions without human approval.
- Recommendations improve task completion, follow-up, referral protection, or revenue outcomes.
- AI usage is auditable and cost-controlled.

## Version 3.0 - Autonomous Growth OS

### Purpose

Evolve ICOS into an autonomous growth operating system that can monitor opportunities, detect risks, trigger workflows, draft actions, and coordinate growth operations under human governance.

### Features

- Autonomous authority discovery monitors
- Partner inactivity detection
- Hospital response SLA monitoring
- Automated follow-up suggestions
- Opportunity ranking
- Attribution protection automation
- Revenue leakage detection
- Automated task creation
- Automated outreach draft generation
- Growth experiments and performance tracking
- Executive command center automation
- Human approval gates for sensitive actions

### Business Value

- Makes growth operations proactive instead of reactive.
- Reduces lost referrals, missed follow-ups, and delayed opportunities.
- Improves partner trust through consistent communication.
- Helps AfraMedico scale without losing operational memory.
- Creates a strategic platform advantage beyond a generic CRM.

### Completion Status

Future vision.

No autonomous execution layer has been implemented.

### Dependencies

- production-grade backend
- reliable live data across modules
- role-based access control
- audit and event architecture
- notification channels
- email/WhatsApp/calendar integrations
- provider portal or partner portal readiness
- AI governance
- operational approval workflows
- monitoring and rate limiting

### Success Criteria

- The system detects important growth or revenue risks automatically.
- Users receive prioritized recommended actions.
- Autonomous workflows never bypass human approval in sensitive areas.
- Every automated suggestion or action is traceable.
- Growth outcomes improve measurably through more timely follow-up, partner engagement, and authority building.

## Roadmap Principles

- Do not automate before the workflow is understood.
- Do not replace human judgment in clinical, financial, or commission-sensitive decisions.
- Preserve evidence and history.
- Keep patient, case, partner, provider, finance, and authority data connected through stable identifiers.
- Treat operational knowledge as the core product asset.
