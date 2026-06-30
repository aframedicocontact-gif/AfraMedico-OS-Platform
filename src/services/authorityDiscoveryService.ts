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
  tags: string[];
};

const curatedSeedOrganizations: CuratedSeedOrganization[] = [
  {
    organization: "Nigerian Medical Association",
    country: "Nigeria",
    category: "Medical Associations",
    website: "https://nigeriannma.org",
    tags: ["medical association", "physicians", "professional association", "health"],
  },
  {
    organization: "University of Lagos",
    country: "Nigeria",
    category: "Universities",
    website: "https://unilag.edu.ng",
    tags: ["university", "college of medicine", "academic", "research"],
  },
  {
    organization: "Lagos University Teaching Hospital",
    country: "Nigeria",
    category: "Teaching Hospitals",
    website: "https://luth.gov.ng",
    tags: ["teaching hospital", "cancer", "oncology", "surgery", "specialist care"],
  },
  {
    organization: "National Hospital Abuja",
    country: "Nigeria",
    category: "Teaching Hospitals",
    website: "https://nationalhospital.gov.ng",
    tags: ["hospital", "government hospital", "cancer", "specialist care", "abuja"],
  },
  {
    organization: "University College Hospital Ibadan",
    country: "Nigeria",
    category: "Teaching Hospitals",
    website: "https://uch-ibadan.org.ng",
    tags: ["teaching hospital", "university college hospital", "cancer", "ibadan", "specialist care"],
  },
  {
    organization: "Ghana Medical Association",
    country: "Ghana",
    category: "Medical Associations",
    website: "https://ghanamedassn.org",
    tags: ["medical association", "physicians", "professional association", "health"],
  },
  {
    organization: "University of Ghana",
    country: "Ghana",
    category: "Universities",
    website: "https://ug.edu.gh",
    tags: ["university", "academic", "research", "medical school"],
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

const demoCategoryTerms: Record<OrganizationCategory, string[]> = {
  "Teaching Hospitals": ["Teaching Hospital", "University Hospital", "Specialist Hospital", "Federal Medical Centre"],
  "Medical Associations": ["Medical Association", "Physicians Association", "Specialist Society", "Doctors Network"],
  Universities: ["College of Medicine", "University", "Medical School", "Public Health Institute"],
  NGOs: ["Cancer Foundation", "Health Initiative", "Patient Support NGO", "Care Alliance"],
  "Health Blogs": ["Health Review", "Medical Insights", "Wellness Journal", "Care Blog"],
  "News Media": ["Health Desk", "Medical News", "Business Health", "Daily Health"],
  "Business Directories": ["Health Directory", "Medical Listings", "Care Directory", "Provider Index"],
};

export const authorityDiscoveryProviders: AuthorityDiscoveryProvider[] = [
  {
    kind: "Curated seed list",
    sourceType: "Curated seed",
    isConfigured: true,
    search: curatedSeedSearch,
  },
  {
    kind: "Manual CSV import",
    sourceType: "CSV import",
    isConfigured: true,
    search: csvImportSearch,
  },
  {
    kind: "Public web search provider",
    sourceType: "Future web provider",
    isConfigured: false,
    search: async () => [],
  },
  {
    kind: "OpenAlex",
    sourceType: "Future web provider",
    isConfigured: false,
    search: async () => [],
  },
  {
    kind: "PubMed",
    sourceType: "Future web provider",
    isConfigured: false,
    search: async () => [],
  },
  {
    kind: "Crossref",
    sourceType: "Future web provider",
    isConfigured: false,
    search: async () => [],
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

function matchesKeyword(seed: CuratedSeedOrganization, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;

  return [seed.organization, seed.category, ...seed.tags]
    .join(" ")
    .toLowerCase()
    .includes(normalizedKeyword);
}

function buildResult(
  seed: CuratedSeedOrganization,
  sourceType: AuthorityDiscoverySourceType,
  sourceNote: string,
  index: number,
  keyword: string,
): AuthorityDiscoveryResult {
  const scored = scoreAuthorityTarget(seed.category, keyword);

  return {
    id: `${slugify(sourceType)}-${slugify(seed.organization)}-${index}`,
    organization: seed.organization,
    country: seed.country,
    category: seed.category,
    website: seed.website,
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
    .filter((seed) => matchesKeyword(seed, parameters.keyword))
    .slice(0, parameters.maximumResults)
    .map((seed, index) =>
      buildResult(seed, "Curated seed", "Curated seed / needs verification", index + 1, parameters.keyword),
    );
}

async function csvImportSearch(parameters: AuthorityDiscoveryParameters) {
  const rows = parseCsv(parameters.csvText ?? "");

  return rows
    .filter((row) => row.organization && row.country && row.category && row.website)
    .filter((row) => row.country === parameters.country)
    .filter((row) => row.category === parameters.category)
    .filter((row) => matchesCsvKeyword(row, parameters.keyword))
    .slice(0, parameters.maximumResults)
    .map((row, index) => {
      const scored = scoreAuthorityTarget(row.category, parameters.keyword);

      return {
        id: `csv-import-${slugify(row.organization)}-${index + 1}`,
        organization: row.organization,
        country: row.country,
        category: row.category,
        website: row.website,
        contactEmail: row.contactEmail || "Not found",
        sourceType: "CSV import",
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
    : ["organization_name", "country", "category", "website", "contact_email"];
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

function matchesCsvKeyword(
  row: { organization: string; category: OrganizationCategory },
  keyword: string,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  return [row.organization, row.category].join(" ").toLowerCase().includes(normalizedKeyword);
}

function runDemoDiscovery(parameters: AuthorityDiscoveryParameters) {
  const resultLimit = Math.max(1, Math.min(parameters.maximumResults, 25));
  const terms = demoCategoryTerms[parameters.category];
  const keyword = parameters.keyword.trim() || "Medical";

  return Array.from({ length: resultLimit }, (_, index) => {
    const term = terms[index % terms.length];
    const scored = scoreAuthorityTarget(parameters.category, keyword);
    const sequence = index + 1;
    const organization =
      sequence === 1
        ? `Demo ${parameters.country} ${keyword} ${term}`
        : `Demo ${parameters.country} ${term} ${keyword} Network ${sequence}`;

    return {
      id: `demo-discovery-${Date.now()}-${sequence}`,
      organization,
      country: parameters.country,
      category: parameters.category,
      website: "",
      contactEmail: "Not found",
      sourceType: "Demo data",
      sourceNote: "Demo data / not real organization",
      confidence: "Unknown",
      authorityType: scored.authorityType,
      authorityScore: Math.max(35, scored.authorityScore - Math.floor(index / 6)),
      referralValue: scored.referralValue,
      backlinkValue: scored.backlinkValue,
      partnershipPotential: scored.partnershipPotential,
      opportunityType: scored.opportunityType,
      suggestedNextAction: "Demo only. Do not import into production CRM.",
      status: "New",
    } satisfies AuthorityDiscoveryResult;
  });
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
  const results =
    parameters.mode === "demo"
      ? runDemoDiscovery(normalizedParameters)
      : provider?.isConfigured
        ? await provider.search(normalizedParameters)
        : [];

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
    providerConfigured: parameters.mode === "demo" ? true : Boolean(provider?.isConfigured),
  };
}
