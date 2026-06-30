# Architecture

AfraMedico OS Platform / ICOS is a React/Vite frontend with local JSON fallback, a frozen Supabase backend foundation, and Vercel serverless API routes for secure provider integrations.

## High-Level Architecture

```text
Browser
  |
  | React / Vite UI
  | local JSON + localStorage fallback
  |
  +--> Supabase client wrapper
  |      |
  |      +--> Supabase Development Backend
  |
  +--> Vercel Serverless API
         |
         +--> Tavily Search API
         +--> OpenAI API
```

## Frontend Architecture

Main app:

```text
src/app/App.tsx
```

Layout:

```text
src/components/layout/AppShell.tsx
```

Page modules:

```text
src/components/pages/
```

Service layer:

```text
src/services/
```

Shared utilities:

```text
src/lib/
```

The app currently uses a hybrid model:

- some screens are frontend prototype/local JSON
- some services are live-ready for Supabase
- some workflows use local storage for development persistence
- Authority Discovery uses a secure serverless API for Tavily/OpenAI

## Routing and Auth Guard

Routes are represented by the `AppView` union in `src/app/App.tsx`.

Public routes:

- `/login`
- `/reset-password`
- `/auth/callback`

Internal routes should require Supabase Auth session.

Implemented source files:

- `src/services/authService.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/pages/LoginPage.tsx`
- `src/components/pages/ResetPasswordPage.tsx`

Deployment status of the auth guard should be verified after each Vercel deployment.

## Supabase Architecture

Backend Foundation v1.0 is defined in:

```text
supabase/migrations/
```

Migration order:

1. `20260627130000_icos_saas_foundation.sql`
2. `20260627143000_case_workspace_foundation.sql`
3. `20260627160000_clinical_decision_foundation.sql`
4. `20260627180000_hospital_referral_foundation.sql`
5. `20260627190000_patient_travel_coordination_foundation.sql`
6. `20260627200000_finance_commission_foundation.sql`
7. `20260627210000_authentication_operational_access_foundation.sql`
8. `20260627220000_backend_foundation_hardening_1.sql`

Backend Foundation v1.0 status:

```text
Frozen
```

Development project:

```text
AfraMedico OS - Development
Project ID: sblaedmxxquiavmfdmwq
```

## Auth and RLS Model

The backend is SaaS-ready and organization-scoped.

Core tenant field:

```text
organization_id
```

RLS depends on:

```text
auth.jwt().app_metadata.organization_id
```

Important rule:

- `organization_id` must be trusted app metadata, not user-editable metadata.

Operational access tables include:

- roles
- permissions
- role permissions
- organization users
- user role assignments
- departments
- operational teams
- team members
- user sessions
- access audit log

Current limitation:

- permission structure exists, but complete permission-aware frontend enforcement is future work.

## Vercel Serverless API Architecture

Current API route:

```text
api/authority-discovery/search.js
```

Current backend service:

```text
api/authority-discovery/services/openaiOrganizationAnalysisService.js
```

The API route is responsible for:

1. validating request method and input
2. reading server-side environment variables
3. calling Tavily Search
4. sending useful snippets to OpenAI
5. normalizing organization intelligence
6. returning structured JSON to the frontend

Secrets must remain server-side.

## Authority Discovery Architecture

Authority Discovery is implemented in:

```text
src/components/pages/AuthorityDiscovery.tsx
src/services/authorityDiscoveryService.ts
src/services/authorityImportService.ts
src/types/authorityDiscovery.ts
```

Provider modes:

- Curated Data
- CSV Imported Data
- Tavily Web Search

Workflow:

```text
Search inputs
  |
  +--> Curated local provider
  |
  +--> CSV local provider
  |
  +--> Tavily Web Search
          |
          +--> POST /api/authority-discovery/search
          +--> Tavily
          +--> OpenAI Intelligence Layer
          +--> Structured Discovery Results
```

Authority Discovery preserves:

- horizontal scrolling
- checkbox per row
- select all
- import selected
- clickable website/source/email/LinkedIn fields
- duplicate prevention by website and organization name

## Tavily Provider Architecture

Tavily is called only from the serverless backend route.

Required server-side variables:

```text
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=
```

The frontend never sees `TAVILY_API_KEY`.

Tavily results provide:

- source URL
- title
- snippet/content

Every Tavily-backed discovery result must include a source URL.

## OpenAI Provider Architecture

OpenAI is called only from the serverless backend route.

Required server-side variables:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=
```

The OpenAI prompt is evidence-bound:

- JSON only
- no invented organizations
- no invented websites
- no invented email addresses
- no invented LinkedIn URLs
- unsupported fields return `null`
- AI summary maximum 120 words

Token optimization:

- Tavily results are deduplicated
- only compact title, URL, and snippet data is sent
- identical analyses are cached in memory during runtime lifetime

Current limitation:

- OpenAI runtime output quality must be verified with real provider keys.
- Cost should be verified against current OpenAI pricing.

## Local Storage vs Live Backend

Local JSON/local storage is still used by several frontend modules.

Examples:

- Authority CRM seed data: `src/data/organizations.json`
- Authority Discovery import/history: local storage through service layer
- Outreach/relationship/opportunity services: development/local service patterns

Live-ready Supabase service files:

- `src/services/organizationService.ts`
- `src/services/patientService.ts`
- `src/services/caseService.ts`
- `src/services/timelineService.ts`
- `src/services/operationalWorkflowService.ts`

Current principle:

- Do not remove mock fallback all at once.
- Replace local data module by module after auth/RLS and organization context are stable.

## Security Notes

Never expose these in browser code:

- Supabase service role key
- `TAVILY_API_KEY`
- `OPENAI_API_KEY`
- passwords
- production data exports

Frontend-safe variables use `VITE_` and are visible to the browser.

Server-only provider keys must not use `VITE_`.

Required safeguards before production:

- verify auth guard on Vercel
- verify RLS with real authenticated sessions
- configure Supabase Storage and document privacy policies
- add consent and PHI handling
- add backup/disaster recovery runbooks
- add production monitoring
- audit serverless API rate limits and abuse controls

## Known Architecture Limitations

- Full role/permission enforcement is not complete.
- Imported Authority CRM records are not persisted to Supabase yet.
- Tavily/OpenAI provider behavior needs live verification.
- Clinical AI/OCR is not connected.
- Finance/payment integrations are not connected.
- Travel booking integrations are intentionally not implemented.

## Next Recommended Architecture Step

Create a backend persistence design for Authority CRM and Authority Discovery imports before saving Tavily/OpenAI intelligence into Supabase.
