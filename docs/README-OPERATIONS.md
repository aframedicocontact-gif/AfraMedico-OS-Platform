# Operations README

This runbook explains how to run, configure, deploy, and test the AfraMedico OS Platform / ICOS development app.

## Run Locally

From the project root:

```powershell
npm install
npm.cmd run dev
```

Default local URL:

```text
http://localhost:5173
```

Production build check:

```powershell
npm.cmd run build
```

## Local Environment Variables

Create `.env.local` in the repository root.

Frontend variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEV_ORGANIZATION_ID=
```

Rules:

- Do not commit `.env.local`.
- Do not place Supabase service role keys in frontend variables.
- Only `VITE_` variables are exposed to the browser.
- `VITE_DEV_ORGANIZATION_ID` is not a secret, but it should still match the development organization being tested.

## Required Vercel Variables

Frontend Supabase:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEV_ORGANIZATION_ID=
```

Server-side Authority Discovery:

```text
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=
AI_PROVIDER=openai
OPENAI_API_KEY=
```

Security rules:

- Do not use `VITE_` for `TAVILY_API_KEY` or `OPENAI_API_KEY`.
- Do not commit real keys.
- Do not paste keys into documentation.
- Keep provider keys server-side in Vercel environment variables.

## How to Deploy

1. Confirm the working tree contains the intended changes.
2. Run:

```powershell
npm.cmd run build
```

3. Commit and push only when explicitly intended.
4. Ensure Vercel has the required environment variables.
5. Trigger a Vercel deployment from the connected GitHub repository.
6. After deployment, test:
   - `/login`
   - protected dashboard route
   - `/reset-password` or recovery callback route when needed
   - Authority Discovery provider configuration

## How to Test Login

1. Open `/login`.
2. Enter the development admin email and password.
3. Confirm successful login redirects to Mission Control/dashboard.
4. Confirm unauthenticated access to internal pages redirects to `/login`.
5. Confirm `/login`, `/reset-password`, and `/auth/callback` remain public.

If login fails:

- `Invalid login credentials` means the Supabase Auth user or password is wrong.
- RLS failures after login usually mean `app_metadata.organization_id` is missing or stale.
- After changing app metadata, sign out and sign in again so the JWT refreshes.

## How to Test Supabase Connection

1. Confirm `.env.local` contains:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_DEV_ORGANIZATION_ID
```

2. Open the login page.
3. Check the backend connection status panel if present.
4. Confirm organizations query succeeds.

Known dependency:

```text
auth.jwt().app_metadata.organization_id
```

RLS policies depend on this organization context.

## How to Test Authority Discovery

Open Authority CRM -> Authority Discovery.

### Curated Data

1. Select `Curated Data`.
2. Choose Nigeria or Ghana.
3. Choose a supported category.
4. Run Discovery.
5. Confirm only curated real records appear.

### CSV Imported Data

1. Select `CSV Imported Data`.
2. Paste CSV with columns such as:

```text
organization_name,country,category,website,contact_email,linkedin,tags
```

3. Run Discovery.
4. Confirm rows appear only from CSV content.

### Tavily Web Search

1. Select `Tavily Web Search`.
2. Enter Search query, Country, Category, Treatment / Keyword, and Maximum results.
3. Run Discovery.
4. If not configured, the app should show:

```text
Tavily Web Search is not configured. Add TAVILY_API_KEY in Vercel environment variables.
```

5. If configured, verify every row includes a source URL.

## How to Test OpenAI Intelligence

OpenAI Intelligence runs only inside:

```text
api/authority-discovery/search.js
```

Required Vercel variables:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=
```

Test steps:

1. Configure Tavily and OpenAI server-side variables.
2. Run a low-result search first, for example `maxResults=3`.
3. Confirm rows include:
   - description
   - organization type
   - medical specialty
   - treatment focus
   - partnership type
   - confidence
   - verification status
   - AI summary
4. Verify fields are absent or `Not found` when unsupported by source evidence.

If OpenAI is not configured, the backend should return:

```text
OpenAI Intelligence Layer is not configured. Add OPENAI_API_KEY in Vercel environment variables.
```

## How to Test Import Selected

1. Run Authority Discovery using Curated, CSV, or Tavily.
2. Select one or more rows.
3. Click `Import Selected`.
4. Confirm success message shows imported and skipped duplicate counts.
5. Open Organizations List.
6. Confirm imported records appear.
7. Repeat the same import.
8. Confirm duplicate prevention skips records by website or organization name.

Storage note:

- Authority Discovery imports currently use local storage/development state.
- Supabase persistence for Authority CRM imports is future work.

## How to Avoid Committing Secrets

Before committing:

```powershell
git status
```

Confirm these files are not staged:

```text
.env
.env.local
.env.*.local
```

Do not commit:

- Supabase service role key
- Tavily key
- OpenAI key
- passwords
- SQL files with real user secrets
- production data exports

## Known Limitations

- Many operational modules still use local JSON or local storage.
- Backend Foundation v1.0 is frozen, but not every frontend module is connected to it.
- Permission-aware frontend access is not fully implemented.
- Storage buckets, PHI classification, consent, retention, and production compliance workflows are future work.
- Tavily/OpenAI runtime behavior needs verification with real Vercel environment variables.
- Authority Discovery imported records are not yet persisted to Supabase.
