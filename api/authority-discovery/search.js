import { analyzeOrganizationsWithOpenAi } from "./services/openaiOrganizationAnalysisService.js";

const configuredSearchProvider = "tavily";
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
        verificationStatus: "Needs Manual Review",
        confidence: "Low",
        source: "tavily_web_search",
        rawSearchSource: `Tavily result: ${title}`,
        reason: "Retrieved from Tavily web search. Human verification required before outreach.",
        suggestedNextStep: "Open source URL, verify organization identity, then qualify for Authority CRM.",
        aiSummary: null,
      };
    })
    .filter((item) => item.sourceUrl);
}

function buildDiagnostics(overrides = {}) {
  return {
    providerUsed: "tavily",
    tavilyResultsCount: 0,
    normalizedResultsCount: 0,
    openAiEnabled: false,
    openAiAnalysisAttempted: false,
    openAiResultsCount: 0,
    fallbackUsed: false,
    errorCode: null,
    safeMessage: "",
    ...overrides,
  };
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
    throw new Error(`TAVILY_SEARCH_FAILED:${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.results) ? payload.results : [];
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, {
      error: "Method not allowed.",
      diagnostics: buildDiagnostics({
        errorCode: "METHOD_NOT_ALLOWED",
        safeMessage: "Only POST requests are supported.",
      }),
    });
  }

  const searchProvider = process.env.SEARCH_PROVIDER || configuredSearchProvider;
  const aiProvider = process.env.AI_PROVIDER || configuredAiProvider;
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (searchProvider !== configuredSearchProvider || !tavilyApiKey) {
    const diagnostics = buildDiagnostics({
      errorCode: "TAVILY_NOT_CONFIGURED",
      safeMessage: "Tavily Web Search is not configured. Add TAVILY_API_KEY in Vercel environment variables.",
    });
    console.warn("Authority discovery configuration warning:", diagnostics);
    return sendJson(response, 503, {
      error: "Tavily Web Search is not configured. Add TAVILY_API_KEY in Vercel environment variables.",
      code: "TAVILY_NOT_CONFIGURED",
      diagnostics,
    });
  }

  const openAiEnabled = aiProvider === configuredAiProvider && Boolean(openAiApiKey);

  const body = parseRequestBody(request);
  const country = sanitizeText(body.country);
  const category = sanitizeText(body.category);
  const treatmentKeyword = sanitizeText(body.treatmentKeyword);
  const query = sanitizeText(body.query);
  const maxResults = sanitizeMaxResults(body.maxResults);

  if (!country || !category || !query) {
    return sendJson(response, 400, {
      error: "country, category, and query are required.",
      code: "INVALID_REQUEST",
      diagnostics: buildDiagnostics({
        openAiEnabled,
        errorCode: "INVALID_REQUEST",
        safeMessage: "country, category, and query are required.",
      }),
    });
  }

  try {
    const tavilyResults = await runTavilySearch({
      query: `${query} ${treatmentKeyword}`.trim(),
      maxResults,
      apiKey: tavilyApiKey,
    });

    const normalizedTavilyResults = normalizeTavilyResults({ tavilyResults, country, category });
    let results = [];
    let warning = "";
    let openAiAnalysisAttempted = false;
    let openAiResultsCount = 0;

    if (tavilyResults.length === 0) {
      const diagnostics = buildDiagnostics({
        tavilyResultsCount: 0,
        normalizedResultsCount: 0,
        openAiEnabled,
        openAiAnalysisAttempted: false,
        openAiResultsCount: 0,
        fallbackUsed: false,
        errorCode: "TAVILY_ZERO_RESULTS",
        safeMessage: "Tavily returned zero results for this query.",
      });
      console.info("Authority discovery diagnostics:", diagnostics);
      return sendJson(response, 200, {
        results: [],
        warning: "Tavily returned zero results for this query.",
        diagnostics,
      });
    }

    if (openAiEnabled) {
      openAiAnalysisAttempted = true;
      try {
        results = await analyzeOrganizationsWithOpenAi({
          searchResults: tavilyResults,
          country,
          category,
          treatmentKeyword,
          apiKey: openAiApiKey,
        });
        openAiResultsCount = results.length;
      } catch (error) {
        warning = "OpenAI analysis failed. Showing normalized Tavily results for manual verification.";
        console.warn("Authority discovery OpenAI fallback:", error instanceof Error ? error.message : "Unknown OpenAI error");
      }
    } else {
      warning = "OpenAI Intelligence Layer is not configured. Showing normalized Tavily results for manual verification.";
    }

    if (results.length === 0 && tavilyResults.length > 0) {
      results = normalizedTavilyResults;
      warning ||= "OpenAI returned no structured organizations. Showing normalized Tavily results for manual verification.";
    }

    const fallbackUsed = Boolean(warning);
    const diagnostics = buildDiagnostics({
      tavilyResultsCount: tavilyResults.length,
      normalizedResultsCount: normalizedTavilyResults.length,
      openAiEnabled,
      openAiAnalysisAttempted,
      openAiResultsCount,
      fallbackUsed,
      errorCode: fallbackUsed ? (openAiEnabled ? "OPENAI_FALLBACK_USED" : "OPENAI_NOT_CONFIGURED") : null,
      safeMessage: warning || `Returned ${results.length} discovery results.`,
    });

    console.info("Authority discovery diagnostics:", diagnostics);

    return sendJson(response, 200, {
      results,
      warning,
      diagnostics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tavily Web Search failed.";
    const diagnostics = buildDiagnostics({
      openAiEnabled,
      errorCode: message.startsWith("TAVILY_SEARCH_FAILED:") ? "TAVILY_SEARCH_FAILED" : "AUTHORITY_DISCOVERY_FAILED",
      safeMessage: message.startsWith("TAVILY_SEARCH_FAILED:")
        ? "Tavily search request failed. Check TAVILY_API_KEY, provider quota, and request parameters."
        : message,
    });
    console.warn("Authority discovery failure:", diagnostics);
    return sendJson(response, 502, {
      error: message.startsWith("TAVILY_SEARCH_FAILED:")
        ? "Tavily search request failed. Check TAVILY_API_KEY, provider quota, and request parameters."
        : message,
      code: diagnostics.errorCode,
      diagnostics,
    });
  }
}
