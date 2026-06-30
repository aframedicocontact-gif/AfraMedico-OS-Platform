import type {
  AuthorityDiscoveryResult,
  AuthorityImportSummary,
} from "../types/authorityDiscovery";
import type { Organization } from "../types/organization";

const importedOrganizationsKey = "aframedico.authorityDiscovery.importedOrganizations";

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\/+$/, "");
}

function isCleanAuthorityOrganization(organization: Organization) {
  const searchable = [
    organization.name,
    organization.website,
    organization.email,
    organization.notes,
  ]
    .join(" ")
    .toLowerCase();

  if (!organization.name.trim() || !organization.website.trim()) return false;
  if (searchable.includes("example")) return false;
  if (searchable.includes("demo data") || searchable.includes("demo ")) return false;
  if (searchable.includes("mock") || searchable.includes("placeholder")) return false;
  return true;
}

function readImportedOrganizations() {
  if (typeof window === "undefined") return [];

  const rawValue = window.localStorage.getItem(importedOrganizationsKey);
  if (!rawValue) return [];

  try {
    return JSON.parse(rawValue) as Organization[];
  } catch {
    window.localStorage.removeItem(importedOrganizationsKey);
    return [];
  }
}

function writeImportedOrganizations(organizations: Organization[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(importedOrganizationsKey, JSON.stringify(organizations));
}

export function getImportedAuthorityOrganizations() {
  return readImportedOrganizations();
}

export function mergeImportedAuthorityOrganizations(baseOrganizations: Organization[]) {
  const cleanImportedOrganizations = readImportedOrganizations().filter(isCleanAuthorityOrganization);
  const baseKeys = new Set([
    ...baseOrganizations.map((organization) => normalize(organization.website)),
    ...baseOrganizations.map((organization) => normalize(organization.name)),
  ]);

  return [
    ...baseOrganizations,
    ...cleanImportedOrganizations.filter(
      (organization) =>
        !baseKeys.has(normalize(organization.website)) &&
        !baseKeys.has(normalize(organization.name)),
    ),
  ];
}

export function importAuthorityDiscoveryResults(
  existingOrganizations: Organization[],
  selectedResults: AuthorityDiscoveryResult[],
): { organizations: Organization[]; summary: AuthorityImportSummary } {
  const imported = readImportedOrganizations();
  const allExisting = [...existingOrganizations, ...imported];
  const existingWebsites = new Set(allExisting.map((organization) => normalize(organization.website)));
  const existingNames = new Set(allExisting.map((organization) => normalize(organization.name)));
  const importedOrganizations: Organization[] = [];
  const duplicateNames: string[] = [];

  selectedResults.forEach((result) => {
    if (existingWebsites.has(normalize(result.website)) || existingNames.has(normalize(result.organization))) {
      duplicateNames.push(result.organization);
      return;
    }
    const isTavilyResult = result.sourceType === "Tavily Web Search";

    const organization: Organization = {
      id: `authority-import-${Date.now()}-${importedOrganizations.length + 1}`,
      name: result.organization,
      country: result.country,
      category: result.category,
      status: "research",
      priority: isTavilyResult ? "low" : result.authorityScore >= 85 ? "high" : result.authorityScore >= 70 ? "medium" : "low",
      owner: "Discovery",
      contactName: "To qualify",
      email: result.contactEmail,
      website: result.website,
      linkedin: result.linkedin,
      opportunityType: result.opportunityType,
      domainRating: 0,
      nextStep: result.suggestedNextAction,
      nextFollowUp: new Date().toISOString().slice(0, 10),
      notes: isTavilyResult
        ? `Imported from Tavily Web Search. Source URL: ${result.sourceUrl || "Not found"}. Snippet: ${result.snippet || "Not found"}. Human verification required before outreach. No authority, backlink, referral, or domain authority metrics have been estimated.`
        : `Imported from Authority Discovery. Source: ${result.sourceNote}. Estimated category score: ${result.authorityScore}. Referral value: ${result.referralValue}. Backlink value: ${result.backlinkValue}. Partnership potential: ${result.partnershipPotential}. Domain authority is not verified yet.`,
      activity: [
        {
          date: new Date().toISOString().slice(0, 10),
          title: "Imported from Authority Discovery",
          detail: isTavilyResult
            ? "Imported from Tavily Web Search. Status set to research for human verification."
            : `Estimated category score ${result.authorityScore}. Status set to research for qualification.`,
        },
      ],
    };

    existingWebsites.add(normalize(organization.website));
    existingNames.add(normalize(organization.name));
    importedOrganizations.push(organization);
  });

  const nextImported = [...imported, ...importedOrganizations];
  writeImportedOrganizations(nextImported);

  return {
    organizations: mergeImportedAuthorityOrganizations(existingOrganizations),
    summary: {
      importedOrganizations: importedOrganizations.length,
      duplicateOrganizations: duplicateNames.length,
      importedIds: importedOrganizations.map((organization) => organization.id),
      duplicateNames,
    },
  };
}
