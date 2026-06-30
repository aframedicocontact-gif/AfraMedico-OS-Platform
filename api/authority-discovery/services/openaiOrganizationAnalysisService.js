const analysisCache = new Map();

function sanitizeText(value, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 1200) : fallback;
}

function safeUrl(value) {
  const text = sanitizeText(value);
  if (!text) return null;

  try {
    return new URL(text).toString();
  } catch {
    return null;
  }
}

function cacheKeyFor({ country, category, treatmentKeyword, searchResults }) {
  const compact = searchResults
    .map((item) => `${item.title}|${item.link}|${item.snippet}`)
    .join("\n")
    .slice(0, 6000);

  return JSON.stringify({
    country,
    category,
    treatmentKeyword,
    compact,
  });
}

function dedupeSearchResults(searchResults) {
  const seen = new Set();

  return searchResults
    .map((item) => ({
      title: sanitizeText(item.title),
      link: safeUrl(item.link),
      snippet: sanitizeText(item.snippet || item.content),
    }))
    .filter((item) => item.title && item.link)
    .filter((item) => {
      const key = `${item.link}|${item.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function normalizeNullableUrl(value) {
  return safeUrl(value);
}

function normalizeEmail(value) {
  const text = sanitizeText(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
}

function normalizeChoice(value, allowedValues, fallback) {
  const text = sanitizeText(value);
  return allowedValues.includes(text) ? text : fallback;
}

function normalizeOpenAiResults(value, { country, category }) {
  if (!value || !Array.isArray(value.results)) return [];

  return value.results
    .filter((item) => item && typeof item.organizationName === "string" && item.organizationName.trim())
    .map((item) => ({
      name: sanitizeText(item.organizationName),
      country: sanitizeText(item.country, country),
      category: sanitizeText(item.possibleCategory, category),
      website: normalizeNullableUrl(item.officialWebsite),
      sourceUrl: normalizeNullableUrl(item.officialSourceUrl),
      snippet: sanitizeText(item.supportingSnippet),
      email: normalizeEmail(item.possibleEmail),
      linkedin: normalizeNullableUrl(item.possibleLinkedInUrl),
      contactPage: normalizeNullableUrl(item.possibleContactPage),
      organizationType: sanitizeText(item.organizationType, "Unknown"),
      description: sanitizeText(item.shortDescription),
      primaryMedicalSpecialty: sanitizeText(item.primaryMedicalSpecialty, "Unknown"),
      treatmentFocus: sanitizeText(item.treatmentFocus, "Unknown"),
      partnershipType: sanitizeText(item.partnershipType, "Unknown"),
      confidence: normalizeChoice(item.confidence, ["High", "Medium", "Low"], "Low"),
      verificationStatus: normalizeChoice(
        item.verificationStatus,
        ["Verified", "Needs Manual Review", "Insufficient Evidence"],
        "Needs Manual Review",
      ),
      source: "tavily_openai_intelligence",
      rawSearchSource: sanitizeText(item.rawSearchSource, "Tavily search result analyzed by OpenAI"),
      reason: sanitizeText(item.reason),
      suggestedNextStep: sanitizeText(
        item.recommendedNextAction,
        "Verify source evidence and qualify this organization for outreach.",
      ),
      aiSummary: sanitizeText(item.aiSummary),
    }))
    .filter((item) => item.sourceUrl && item.name);
}

function buildPrompt({ country, category, treatmentKeyword, searchResults }) {
  return {
    task: "Extract factual organization intelligence from Tavily search results.",
    strictRules: [
      "Return JSON only. No markdown.",
      "Never invent organization names.",
      "Never invent websites, emails, LinkedIn URLs, contact pages, or phone numbers.",
      "Only use facts supported by the supplied Tavily titles, URLs, and snippets.",
      "If a field is not supported by the supplied evidence, return null.",
      "Group duplicate or similar results into one organization when the evidence supports it.",
      "Ignore irrelevant pages.",
      "AI Summary must be no more than 120 words.",
    ],
    requestedContext: {
      country,
      category,
      treatmentKeyword,
    },
    allowedOrganizationTypes: [
      "Teaching Hospital",
      "Private Hospital",
      "Cancer Center",
      "Medical Association",
      "University",
      "Research Institute",
      "NGO",
      "Government Agency",
      "Medical Journal",
      "Healthcare Directory",
      "Media",
      "Professional Society",
    ],
    allowedTreatmentFocus: [
      "Brain Surgery",
      "Cancer",
      "Oncology",
      "Cardiology",
      "IVF",
      "Orthopedics",
      "Robotic Surgery",
      "Neurology",
      "Transplant",
      "Medical Tourism",
      "Unknown",
    ],
    allowedPartnershipTypes: [
      "Referral Partner",
      "Academic Collaboration",
      "Clinical Research",
      "Conference Partner",
      "Education Partner",
      "Backlink Opportunity",
      "Media Partnership",
      "Government Collaboration",
      "Unknown",
    ],
    responseShape: {
      results: [
        {
          organizationName: "string",
          officialWebsite: "url or null",
          country: "string",
          organizationType: "string",
          possibleCategory: "string",
          shortDescription: "string or null",
          primaryMedicalSpecialty: "string or Unknown",
          treatmentFocus: "string",
          partnershipType: "string",
          confidence: "High | Medium | Low",
          officialSourceUrl: "url",
          possibleContactPage: "url or null",
          possibleLinkedInUrl: "url or null",
          possibleEmail: "email or null",
          verificationStatus: "Verified | Needs Manual Review | Insufficient Evidence",
          supportingSnippet: "string",
          rawSearchSource: "string",
          aiSummary: "string max 120 words",
          recommendedNextAction: "string",
          reason: "string",
        },
      ],
    },
    tavilySearchResults: searchResults,
  };
}

export async function analyzeOrganizationsWithOpenAi({
  searchResults,
  country,
  category,
  treatmentKeyword,
  apiKey,
}) {
  const usefulResults = dedupeSearchResults(searchResults);
  if (usefulResults.length === 0) return [];

  const cacheKey = cacheKeyFor({
    country,
    category,
    treatmentKeyword,
    searchResults: usefulResults,
  });

  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey);
  }

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
            "You are an evidence-bound business intelligence extractor. You only return JSON and never invent unsupported details.",
        },
        {
          role: "user",
          content: JSON.stringify(
            buildPrompt({
              country,
              category,
              treatmentKeyword,
              searchResults: usefulResults,
            }),
          ),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI organization analysis request failed.");
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (!content) return [];

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  const normalized = normalizeOpenAiResults(parsed, { country, category });
  analysisCache.set(cacheKey, normalized);
  return normalized;
}
