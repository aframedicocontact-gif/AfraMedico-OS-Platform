# Authority Discovery Backend

Phase 4 Sprint 1 establishes the Real Discovery Engine foundation using Tavily.

Authority Discovery supports three providers:

- Curated Data: local curated records.
- CSV Imported Data: user-provided CSV content processed in the browser.
- Tavily Web Search: server-side web search through a secure Vercel API route.

## Secure Backend Route

Tavily Web Search calls:

```text
POST /api/authority-discovery/search
```

The browser never receives provider secrets. The serverless route reads the Tavily key from server-side environment variables only.

## Required Vercel Environment Variables

Configure these in Vercel Project Settings -> Environment Variables:

```text
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=
```

Do not use the `VITE_` prefix for these values. `VITE_` variables are exposed to the browser bundle.

## Workflow

1. The user selects Tavily Web Search in Authority Discovery.
2. The frontend posts country, category, treatment keyword, query, and maximum result count to the backend route.
3. The backend calls Tavily Search.
4. The backend normalizes Tavily results into Discovery Result rows.
5. The frontend displays organization, website, source URL, snippet, country, category, verification status, and raw search source.
6. The user selects rows and imports them into Authority CRM.

## Current Scope

This sprint does not use AI.

The system does not estimate:

- authority score
- backlink value
- referral value
- partnership potential

Every Tavily result must include the original source URL and should be manually verified before outreach.

## Missing Provider Behavior

If Tavily is not configured, the backend returns:

```text
503 Tavily Web Search is not configured. Add TAVILY_API_KEY in Vercel environment variables.
```

The frontend displays the error and does not generate fake organizations.

## Safety Rules

- Do not call Tavily directly from frontend code.
- Do not invent organizations.
- Do not invent websites.
- Do not invent email addresses.
- Do not expose provider keys in frontend code.
- Do not store provider keys in the repository.
- Keep Curated Data and CSV Imported Data available even when Tavily is not configured.
