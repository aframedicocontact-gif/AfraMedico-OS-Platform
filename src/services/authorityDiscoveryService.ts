import { scoreAuthorityTarget } from "./authorityScoringService";
import type {
  AuthorityDiscoveryHistoryItem,
  AuthorityDiscoveryParameters,
  AuthorityDiscoveryProvider,
  AuthorityDiscoveryResult,
  AuthorityDiscoverySourceType,
} from "../types/authorityDiscovery";
import type { OrganizationCategory } from "../types/organization";

const discoveryHistoryKey = "aframedico.authorityDiscovery.history";

type CuratedSeedOrganization = {
  organization: string;
  country: string;
  category: OrganizationCategory;
  website: string;
  linkedin?: string;
  tags: string[];
};

const curatedSeedOrganizations: CuratedSeedOrganization[] = [
  {
    organization: "Nigerian Medical Association",
    country: "Nigeria",
    category: "Medical Associations",
    website: "https://nigeriannma.org",
    tags: ["medical association", "physicians", "professional association", "health", "medical tourism"],
  },
  {
    organization: "University of Lagos",
    country: "Nigeria",
    category: "Universities",
    website: "https://unilag.edu.ng",
    tags: ["university", "college of medicine", "academic", "research", "medical education"],
  },
  {
    organization: "Lagos University Teaching Hospital",
    country: "Nigeria",
    category: "Teaching Hospitals",
    website: "https://luth.gov.ng",
    tags: ["teaching hospital", "cancer", "oncology", "surgery", "cardiology", "specialist care"],
  },
  {
    organization: "National Hospital Abuja",
    country: "Nigeria",
    category: "Teaching Hospitals",
    website: "https://nationalhospital.gov.ng",
    tags: ["hospital", "government hospital", "cancer", "oncology", "cardiology", "specialist care"],
  },
  {
    organization: "University College Hospital Ibadan",
    country: "Nigeria",
    category: "Teaching Hospitals",
    website: "https://uch-ibadan.org.ng",
    tags: ["teaching hospital", "university college hospital", "cancer", "oncology", "ibadan", "specialist care"],
  },
  {
    organization: "Ghana Medical Association",
    country: "Ghana",
    category: "Medical Associations",
    website: "https://ghanamedassn.org",
    tags: ["medical association", "physicians", "professional association", "health", "medical tourism"],
  },
  {
    organization: "University of Ghana",
    country: "Ghana",
    category: "Universities",
    website: "https://ug.edu.gh",
    tags: ["university", "academic", "research", "medical school", "medical education"],
  },
  {
    organization: "Korle Bu Teaching Hospital",
    country: "Ghana",
    category: "Teaching Hospitals",
    website: "https://kbth.gov.gh",
    tags: ["teaching hospital", "cancer", "oncology", "surgery", "specialist care"],
  },
  {
    organization: "Komfo Anokye Teaching Hospital",
    country: "Ghana",
    category: "Teaching Hospitals",
    website: "https://kath.gov.gh",
    tags: ["teaching hospital", "cancer", "oncology", "kumasi", "specialist care"],
  },
];

export const authorityDiscoveryProviders: AuthorityDiscoveryProvider[] = [
  {
    kind: "Curated seed list",
    sourceType: "Curated Data",
    isConfigured: true,
    search: curatedSeedSearch,
  },
  {
    kind: "Manual CSV import",
    sourceType: "CSV Imported Data",
    isConfigured: true,
    search: csvImportSearch,
  },
  {
    kind: "Hybrid web search and AI extraction",
    sourceType: "Real Web + AI Search",
    isConfigured: true,
    search: realWebAiSearch,
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readDiscoveryHistory() {
  if (typeof window === "undefined") return [];

  const rawValue = window.localStorage.getItem(discoveryHistoryKey);
  if (!rawValue) return [];

  try {
    return JSON.parse(rawValue) as AuthorityDiscoveryHistoryItem[];
  } catch {
    window.localStorage.removeItem(discoveryHistoryKey);
    return [];
  }
}

function writeDiscoveryHistory(history: AuthorityDiscoveryHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(discoveryHistoryKey, JSON.stringify(history));
}

function matchesText(values: Array<string | undefined>, text: string) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return true;
  return values.filter(Boolean).join(" ").toLowerCase().includes(normalized);
}

function buildResult(
  seed: CuratedSeedOrganization,
  sourceType: AuthorityDiscoverySourceType,
  sourceNote: string,
  index: number,
  treatmentKeyword: string,
): AuthorityDiscoveryResult {
  const scored = scoreAuthorityTarget(seed.category, treatmentKeyword);

  return {
    id: `${slugify(sourceType)}-${slugify(seed.organization)}-${index}`,
    organization: seed.organization,
    country: seed.country,
    category: seed.category,
    website: seed.website,
    linkedin: seed.linkedin ?? "",
    contactEmail: "Not found",
    sourceType,
    sourceNote,
    confidence: "Needs verification",
    authorityType: scored.authorityType,
    authorityScore: scored.authorityScore,
    referralValue: scored.referralValue,
    backlinkValue: scored.backlinkValue,
    partnershipPotential: scored.partnershipPotential,
    opportunityType: scored.opportunityType,
    suggestedNextAction: `Verify contact path and qualify ${seed.organization} for ${scored.opportunityType.toLowerCase()}.`,
    status: "New",
  };
}

async function curatedSeedSearch(parameters: AuthorityDiscoveryParameters) {
  return curatedSeedOrganizations
    .filter((seed) => seed.country === parameters.country)
    .filter((seed) => seed.category === parameters.category)
    .filter((seed) => matchesText([seed.organization, seed.category, seed.website, ...seed.tags], parameters.searchText))
    .filter((seed) => matchesText([seed.organization, seed.category, ...seed.tags], parameters.treatmentKeyword))
    .slice(0, parameters.maximumResults)
    .map((seed, index) =>
      buildResult(seed, "Curated Data", "Curated seed / needs verification", index + 1, parameters.treatmentKeyword),
    );
}

async function csvImportSearch(parameters: AuthorityDiscoveryParameters) {
  const rows = parseCsv(parameters.csvText ?? "");

  return rows
    .filter((row) => row.organization && row.country && row.category && row.website)
    .filter((row) => row.country === parameters.country)
    .filter((row) => row.category === parameters.category)
    .filter((row) => matchesText([row.organization, row.category, row.website, row.contactEmail, row.linkedin], parameters.searchText))
    .filter((row) => matchesText([row.organization, row.category, row.tags], parameters.treatmentKeyword))
    .slice(0, parameters.maximumResults)
    .map((row, index) => {
      const scored = scoreAuthorityTarget(row.category, parameters.treatmentKeyword);

      return {
        id: `csv-import-${slugify(row.organization)}-${index + 1}`,
        organization: row.organization,
        country: row.country,
        category: row.category,
        website: row.website,
        linkedin: row.linkedin,
        contactEmail: row.contactEmail || "Not found",
        sourceType: "CSV Imported Data",
        sourceNote: "CSV import / needs verification",
        confidence: "Needs verification",
        authorityType: scored.authorityType,
        authorityScore: scored.authorityScore,
        referralValue: scored.referralValue,
        backlinkValue: scored.backlinkValue,
        partnershipPotential: scored.partnershipPotential,
        opportunityType: scored.opportunityType,
        suggestedNextAction: `Verify CSV-supplied organization details and qualify ${row.organization}.`,
        status: "New",
      } satisfies AuthorityDiscoveryResult;
    });
}

type WebAiDiscoveryResponse = {
  results?: Array<{
    name?: string;
    country?: string;
    category?: OrganizationCategory;
    website?: string | null;
    email?: string | null;
    linkedin?: string | null;
    sourceUrl?: string | null;
    confidence?: "Verified" | "Needs verification" | "Unknown";
    source?: string;
    reason?: string;
    suggestedNextStep?: string;
  }>;
  error?: string;
};

async function realWebAiSearch(parameters: AuthorityDiscoveryParameters) {
  const query = [
    parameters.searchText,
    parameters.treatmentKeyword,
    parameters.category,
    parameters.country,
  ]
    .filter(Boolean)
    .join(" ");
  const response = await fetch("/api/authority-discovery/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      country: parameters.country,
      category: parameters.category,
      treatmentKeyword: parameters.treatmentKeyword,
      query,
      maxResults: parameters.maximumResults,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as WebAiDiscoveryResponse;

  if (!response.ok) {
    throw new Error(payload.error || "Real Web + AI Search is not configured.");
  }

  return (payload.results ?? [])
    .filter((result) => result.name && result.country && result.category)
    .slice(0, parameters.maximumResults)
    .map((result, index) => {
      const category = normalizeCategory(result.category || parameters.category);
      const scored = scoreAuthorityTarget(category, parameters.treatmentKeyword);
      const sourceUrl = result.sourceUrl || result.website || "";

      return {
        id: `web-ai-${slugify(result.name || "organization")}-${index + 1}`,
        organization: result.name || "",
        country: result.country || parameters.country,
        category,
        website: result.website || "",
        linkedin: result.linkedin || "",
        contactEmail: result.email || "Not found",
        sourceUrl,
        sourceType: "Real Web + AI Search",
        sourceNote: sourceUrl ? `Supported by ${sourceUrl}` : "Supported by search result snippets",
        confidence: result.confidence || "Needs verification",
        authorityType: scored.authorityType,
        authorityScore: scored.authorityScore,
        referralValue: scored.referralValue,
        backlinkValue: scored.backlinkValue,
        partnershipPotential: scored.partnershipPotential,
        opportunityType: scored.opportunityType,
        suggestedNextAction: result.suggestedNextStep || `Verify evidence and qualify ${result.name}.`,
        status: "New",
      } satisfies AuthorityDiscoveryResult;
    });
}

function parseCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const [firstLine, ...restLines] = lines;
  const firstCells = splitCsvLine(firstLine);
  const hasHeader = firstCells.some((cell) => cell.toLowerCase().includes("organization"));
  const headers = hasHeader
    ? firstCells.map((cell) => cell.toLowerCase().replace(/[^a-z0-9]+/g, "_"))
    : ["organization_name", "country", "category", "website", "contact_email", "linkedin", "tags"];
  const dataLines = hasHeader ? restLines : lines;

  return dataLines.map((line) => {
    const cells = splitCsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));

    return {
      organization: record.organization_name || record.organization || record.name || "",
      country: record.country || "",
      category: normalizeCategory(record.category || ""),
      website: record.website || "",
      contactEmail: record.contact_email || record.email || "",
      linkedin: record.linkedin || record.linkedin_url || "",
      tags: record.tags || record.treatment_focus || record.specialty || "",
    };
  });
}

function splitCsvLine(line: string) {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

function normalizeCategory(value: string): OrganizationCategory {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("teaching") || normalized.includes("hospital")) return "Teaching Hospitals";
  if (normalized.includes("association")) return "Medical Associations";
  if (normalized.includes("universit")) return "Universities";
  if (normalized.includes("ngo") || normalized.includes("foundation")) return "NGOs";
  if (normalized.includes("blog")) return "Health Blogs";
  if (normalized.includes("media") || normalized.includes("news")) return "News Media";
  return "Business Directories";
}

export function getAuthorityDiscoveryHistory() {
  return readDiscoveryHistory();
}

export function recordAuthorityDiscoveryHistory(item: AuthorityDiscoveryHistoryItem) {
  const nextHistory = [item, ...readDiscoveryHistory()].slice(0, 12);
  writeDiscoveryHistory(nextHistory);
  return nextHistory;
}

export function updateAuthorityDiscoveryImportCount(historyId: string, importedCount: number) {
  const nextHistory = readDiscoveryHistory().map((item) =>
    item.id === historyId
      ? {
          ...item,
          importedCount,
        }
      : item,
  );
  writeDiscoveryHistory(nextHistory);
  return nextHistory;
}

export async function runAuthorityDiscovery(parameters: AuthorityDiscoveryParameters) {
  const resultLimit = Math.max(1, Math.min(parameters.maximumResults, 100));
  const normalizedParameters = { ...parameters, maximumResults: resultLimit };
  const provider = authorityDiscoveryProviders.find((item) => item.sourceType === parameters.sourceType);
  let results: AuthorityDiscoveryResult[] = [];
  let errorMessage = "";

  try {
    results = provider?.isConfigured ? await provider.search(normalizedParameters) : [];
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Authority discovery failed.";
  }

  const historyItem: AuthorityDiscoveryHistoryItem = {
    id: `history-${Date.now()}`,
    searchedAt: new Date().toISOString(),
    parameters: normalizedParameters,
    resultCount: results.length,
    importedCount: 0,
  };

  const history = recordAuthorityDiscoveryHistory(historyItem);

  return {
    historyItem,
    history,
    results,
    providerConfigured: Boolean(provider?.isConfigured),
    errorMessage,
  };
}
