# Authority Discovery Backend

Authority Discovery supports three data paths:

- Curated Data: local curated seed records.
- CSV Imported Data: user-provided CSV content processed in the browser.
- Real Web + AI Search: secure serverless backend discovery.

## Secure Backend Route

Real Web + AI Search calls:

```text
POST /api/authority-discovery/search
```

The browser never receives search or AI provider secrets. The serverless route reads provider keys from server-side environment variables only.

## Required Vercel Environment Variables

Configure these in Vercel Project Settings -> Environment Variables:

```text
SEARCH_PROVIDER=serpapi
SERPAPI_KEY=
AI_PROVIDER=openai
OPENAI_API_KEY=
```

Do not use the `VITE_` prefix for these values. `VITE_` variables are exposed to the browser bundle.

## Workflow

1. The user selects Real Web + AI Search in Authority Discovery.
2. The frontend posts the country, category, treatment keyword, query, and maximum result count to the backend route.
3. The backend queries the configured search provider.
4. The backend sends search result snippets and URLs to the configured AI provider.
5. The AI provider must extract only organizations supported by the search results.
6. The backend returns normalized organization records to the frontend.
7. The user selects rows and imports them into Authority CRM.

## Missing Provider Behavior

If any required provider configuration is missing, the backend returns:

```text
503 Real Web + AI Search is not configured.
```

The frontend displays the error and does not generate fake organizations.

## Safety Rules

- Do not invent organizations.
- Do not invent websites.
- Do not invent email addresses.
- Do not expose provider keys in frontend code.
- Do not store provider keys in the repository.
- Keep Curated Data and CSV Imported Data available even when web discovery is not configured.
