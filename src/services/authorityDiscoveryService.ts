import { scoreAuthorityTarget } from "./authorityScoringService";
import type {
  AuthorityDiscoveryHistoryItem,
  AuthorityDiscoveryParameters,
  AuthorityDiscoveryResult,
} from "../types/authorityDiscovery";
import type { OrganizationCategory } from "../types/organization";

const discoveryHistoryKey = "aframedico.authorityDiscovery.history";

const categoryTerms: Record<OrganizationCategory, string[]> = {
  "Teaching Hospitals": ["Teaching Hospital", "University Hospital", "Specialist Hospital", "Federal Medical Centre"],
  "Medical Associations": ["Medical Association", "Physicians Association", "Specialist Society", "Doctors Network"],
  Universities: ["College of Medicine", "University", "Medical School", "Public Health Institute"],
  NGOs: ["Cancer Foundation", "Health Initiative", "Patient Support NGO", "Care Alliance"],
  "Health Blogs": ["Health Review", "Medical Insights", "Wellness Journal", "Care Blog"],
  "News Media": ["Health Desk", "Medical News", "Business Health", "Daily Health"],
  "Business Directories": ["Health Directory", "Medical Listings", "Care Directory", "Provider Index"],
};

const countryDomainHints: Record<string, string> = {
  Nigeria: "ng",
  Ghana: "gh",
  Kenya: "ke",
  Uganda: "ug",
  Tanzania: "tz",
  "South Africa": "za",
};

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
  const terms = categoryTerms[parameters.category];
  const countrySlug = slugify(parameters.country);
  const domainHint = countryDomainHints[parameters.country] ?? "org";
  const keyword = parameters.keyword.trim() || "Medical";
  const keywordSlug = slugify(keyword);
  const results: AuthorityDiscoveryResult[] = Array.from({ length: resultLimit }, (_, index) => {
    const term = terms[index % terms.length];
    const scored = scoreAuthorityTarget(parameters.category, keyword);
    const sequence = index + 1;
    const organization =
      sequence === 1
        ? `${parameters.country} ${keyword} ${term}`
        : `${parameters.country} ${term} ${keyword} Network ${sequence}`;
    const websiteSlug = slugify(`${organization}`);

    return {
      id: `discovery-${Date.now()}-${sequence}`,
      organization,
      country: parameters.country,
      category: parameters.category,
      website: `https://${websiteSlug}.${domainHint}`,
      contactEmail: `info@${websiteSlug}.${domainHint}`,
      authorityType: scored.authorityType,
      authorityScore: Math.max(35, scored.authorityScore - Math.floor(index / 6)),
      referralValue: scored.referralValue,
      backlinkValue: scored.backlinkValue,
      partnershipPotential: scored.partnershipPotential,
      opportunityType: scored.opportunityType,
      suggestedNextAction: `Qualify ${term.toLowerCase()} contact path for ${keywordSlug.replace(/-/g, " ")} authority outreach.`,
      status: "New",
    };
  });

  const historyItem: AuthorityDiscoveryHistoryItem = {
    id: `history-${Date.now()}`,
    searchedAt: new Date().toISOString(),
    parameters,
    resultCount: results.length,
    importedCount: 0,
  };

  const history = recordAuthorityDiscoveryHistory(historyItem);

  return {
    historyItem,
    history,
    results,
  };
}
