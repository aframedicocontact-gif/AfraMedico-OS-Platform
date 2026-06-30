# Authority Discovery Backend

Phase 4 establishes the Real Discovery Engine foundation using Tavily and a server-side OpenAI intelligence layer.

Authority Discovery supports three providers:

- Curated Data: local curated records.
- CSV Imported Data: user-provided CSV content processed in the browser.
- Tavily Web Search: server-side web search and organization intelligence through a secure Vercel API route.

## Secure Backend Route

Tavily Web Search calls:

```text
POST /api/authority-discovery/search
```

The browser never receives provider secrets. The serverless route reads Tavily and OpenAI keys from server-side environment variables only.

## Required Vercel Environment Variables

Configure these in Vercel Project Settings -> Environment Variables:

```text
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=
AI_PROVIDER=openai
OPENAI_API_KEY=
```

Do not use the `VITE_` prefix for these values. `VITE_` variables are exposed to the browser bundle.

## Workflow

1. The user selects Tavily Web Search in Authority Discovery.
2. The frontend posts country, category, treatment keyword, query, and maximum result count to the backend route.
3. The backend calls Tavily Search.
4. The backend deduplicates useful Tavily snippets.
5. The backend sends compact evidence to OpenAI.
6. OpenAI extracts only factual organization intelligence supported by the supplied Tavily evidence.
7. The frontend displays organization, description, organization type, medical specialty, treatment focus, partnership type, confidence, website, source URL, snippet, verification status, raw search source, and AI summary.
8. The user selects rows and imports them into Authority CRM.

## OpenAI Prompt Strategy

The OpenAI prompt is strict and evidence-bound:

- Return JSON only.
- Never invent organizations.
- Never invent websites, emails, LinkedIn URLs, contact pages, or phone numbers.
- Use only Tavily titles, URLs, and snippets supplied by the backend.
- Return `null` for unsupported fields.
- Group duplicate or similar results only when evidence supports it.
- Keep AI summaries under 120 words.

The system still does not estimate:

- authority score
- backlink value
- referral value
- domain authority

Every organization result must include the original source URL and should be manually verified before outreach.

## Token Optimization

- Tavily results are deduplicated before analysis.
- Only title, URL, and short snippet are sent to OpenAI.
- The backend limits useful snippets to a compact batch.
- Identical analyses are cached in memory during the serverless runtime lifetime.

## Missing Provider Behavior

If Tavily is not configured, the backend returns:

```text
503 Tavily Web Search is not configured. Add TAVILY_API_KEY in Vercel environment variables.
```

If OpenAI is not configured, the backend returns:

```text
503 OpenAI Intelligence Layer is not configured. Add OPENAI_API_KEY in Vercel environment variables.
```

The frontend displays the error and does not generate fake organizations.

## Safety Rules

- Do not call Tavily directly from frontend code.
- Do not call OpenAI directly from frontend code.
- Do not invent organizations.
- Do not invent websites.
- Do not invent email addresses.
- Do not expose provider keys in frontend code.
- Do not store provider keys in the repository.
- Keep Curated Data and CSV Imported Data available even when Tavily is not configured.
