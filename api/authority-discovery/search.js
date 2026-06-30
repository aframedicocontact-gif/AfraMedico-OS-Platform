const configuredSearchProvider = "serpapi";
const configuredAiProvider = "openai";

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function parseRequestBody(request) {
  if (!request.body) return {};
  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return {};
    }
  }
  return request.body;
}

function sanitizeText(value, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 500) : fallback;
}

function sanitizeMaxResults(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(Math.floor(parsed), 20));
}

function normalizeAiResults(value) {
  if (!value || !Array.isArray(value.results)) return [];

  return value.results
    .filter((item) => item && typeof item.name === "string" && item.name.trim())
    .map((item) => ({
      name: sanitizeText(item.name),
      country: sanitizeText(item.country),
      category: sanitizeText(item.category),
      website: item.website ? sanitizeText(item.website) : null,
      email: item.email ? sanitizeText(item.email) : null,
      linkedin: item.linkedin ? sanitizeText(item.linkedin) : null,
      sourceUrl: item.sourceUrl ? sanitizeText(item.sourceUrl) : null,
      confidence: ["Verified", "Needs verification", "Unknown"].includes(item.confidence)
        ? item.confidence
        : "Needs verification",
      source: "web_search_ai",
      reason: sanitizeText(item.reason),
      suggestedNextStep: sanitizeText(item.suggestedNextStep, "Verify source evidence and qualify this organization."),
    }))
    .filter((item) => item.sourceUrl || item.website);
}

async function runSerpApiSearch({ query, country, maxResults, apiKey }) {
  const searchParams = new URLSearchParams({
    engine: "google",
    q: query || `${country} healthcare authority targets`,
    num: String(maxResults),
    api_key: apiKey,
  });
  const response = await fetch(`https://serpapi.com/search.json?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Search provider request failed.");
  }

  const payload = await response.json();
  const organicResults = Array.isArray(payload.organic_results) ? payload.organic_results : [];

  return organicResults.slice(0, maxResults).map((item) => ({
    title: sanitizeText(item.title),
    link: sanitizeText(item.link),
    snippet: sanitizeText(item.snippet),
    displayedLink: sanitizeText(item.displayed_link),
  }));
}

async function extractOrganizationsWithOpenAi({ searchResults, country, category, treatmentKeyword, apiKey }) {
  const prompt = {
    country,
    category,
    treatmentKeyword,
    rules: [
      "Extract real organizations only from the provided search results.",
      "Do not invent organizations, websites, emails, LinkedIn URLs, or source URLs.",
      "Every result must be supported by a provided result link or snippet.",
      "If an email or LinkedIn URL is not explicitly present, return null.",
      "If no supported organizations exist, return an empty results array.",
    ],
    searchResults,
    responseShape: {
      results: [
        {
          name: "Organization name",
          country: "Country",
          category: "Category",
          website: "Website or null",
          email: "Email or null",
          linkedin: "LinkedIn URL or null",
          sourceUrl: "Supporting search result URL",
          confidence: "Verified | Needs verification | Unknown",
          reason: "Why this organization matches the request",
          suggestedNextStep: "Recommended next outreach action",
        },
      ],
    },
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract structured business records from search results. You must not invent facts. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify(prompt),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("AI provider request failed.");
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (!content) return [];

  try {
    return normalizeAiResults(JSON.parse(content));
  } catch {
    return [];
  }
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const searchProvider = process.env.SEARCH_PROVIDER || configuredSearchProvider;
  const aiProvider = process.env.AI_PROVIDER || configuredAiProvider;
  const serpApiKey = process.env.SERPAPI_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (
    searchProvider !== configuredSearchProvider ||
    aiProvider !== configuredAiProvider ||
    !serpApiKey ||
    !openAiApiKey
  ) {
    return sendJson(response, 503, { error: "Real Web + AI Search is not configured." });
  }

  const body = parseRequestBody(request);
  const country = sanitizeText(body.country);
  const category = sanitizeText(body.category);
  const treatmentKeyword = sanitizeText(body.treatmentKeyword);
  const query = sanitizeText(body.query);
  const maxResults = sanitizeMaxResults(body.maxResults);

  if (!country || !category || !query) {
    return sendJson(response, 400, { error: "country, category, and query are required." });
  }

  try {
    const searchResults = await runSerpApiSearch({
      query,
      country,
      maxResults,
      apiKey: serpApiKey,
    });

    if (searchResults.length === 0) {
      return sendJson(response, 200, { results: [] });
    }

    const results = await extractOrganizationsWithOpenAi({
      searchResults,
      country,
      category,
      treatmentKeyword,
      apiKey: openAiApiKey,
    });

    return sendJson(response, 200, { results });
  } catch (error) {
    return sendJson(response, 502, {
      error: error instanceof Error ? error.message : "Real Web + AI Search failed.",
    });
  }
}
