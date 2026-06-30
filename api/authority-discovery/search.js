const configuredSearchProvider = "tavily";

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
  return typeof value === "string" ? value.trim().slice(0, 1000) : fallback;
}

function sanitizeMaxResults(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(Math.floor(parsed), 20));
}

function safeUrl(value) {
  const text = sanitizeText(value);
  if (!text) return "";

  try {
    return new URL(text).toString();
  } catch {
    return "";
  }
}

function getWebsiteFromSourceUrl(sourceUrl) {
  try {
    const parsed = new URL(sourceUrl);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return "";
  }
}

function cleanTitle(title) {
  return sanitizeText(title)
    .replace(/\s*[-|]\s*official\s*site\s*$/i, "")
    .replace(/\s*[-|]\s*home\s*$/i, "")
    .replace(/\s*[-|]\s*homepage\s*$/i, "")
    .trim();
}

function normalizeTavilyResults({ tavilyResults, country, category }) {
  return tavilyResults
    .map((item, index) => {
      const sourceUrl = safeUrl(item.url);
      const title = cleanTitle(item.title || item.url || `Search Result ${index + 1}`);
      const snippet = sanitizeText(item.content || item.snippet || "");

      return {
        name: title,
        country,
        category,
        website: sourceUrl ? getWebsiteFromSourceUrl(sourceUrl) : null,
        email: null,
        linkedin: sourceUrl.includes("linkedin.com") ? sourceUrl : null,
        sourceUrl: sourceUrl || null,
        snippet,
        confidence: "Needs verification",
        source: "tavily",
        rawSearchSource: `Tavily result: ${title}`,
        reason: "Retrieved from Tavily web search. Human verification required before outreach.",
        suggestedNextStep: "Open source URL, verify organization identity, then qualify for Authority CRM.",
      };
    })
    .filter((item) => item.sourceUrl);
}

async function runTavilySearch({ query, maxResults, apiKey }) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    throw new Error("Tavily search request failed.");
  }

  const payload = await response.json();
  return Array.isArray(payload.results) ? payload.results : [];
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const searchProvider = process.env.SEARCH_PROVIDER || configuredSearchProvider;
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (searchProvider !== configuredSearchProvider || !tavilyApiKey) {
    return sendJson(response, 503, { error: "Tavily Web Search is not configured." });
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
    const tavilyResults = await runTavilySearch({
      query: `${query} ${treatmentKeyword}`.trim(),
      maxResults,
      apiKey: tavilyApiKey,
    });
    const results = normalizeTavilyResults({
      tavilyResults,
      country,
      category,
    });

    return sendJson(response, 200, { results });
  } catch (error) {
    return sendJson(response, 502, {
      error: error instanceof Error ? error.message : "Tavily Web Search failed.",
    });
  }
}
