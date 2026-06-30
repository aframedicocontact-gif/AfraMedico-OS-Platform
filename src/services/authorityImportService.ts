import type {
  AuthorityDiscoveryResult,
  AuthorityImportSummary,
} from "../types/authorityDiscovery";
import type { Organization } from "../types/organization";

const importedOrganizationsKey = "aframedico.authorityDiscovery.importedOrganizations";

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\/+$/, "");
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
  const baseKeys = new Set([
    ...baseOrganizations.map((organization) => normalize(organization.website)),
    ...baseOrganizations.map((organization) => normalize(organization.name)),
  ]);

  return [
    ...baseOrganizations,
    ...readImportedOrganizations().filter(
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

    const organization: Organization = {
      id: `authority-import-${Date.now()}-${importedOrganizations.length + 1}`,
      name: result.organization,
      country: result.country,
      category: result.category,
      status: "research",
      priority: result.authorityScore >= 85 ? "high" : result.authorityScore >= 70 ? "medium" : "low",
      owner: "Discovery",
      contactName: "To qualify",
      email: result.contactEmail,
      website: result.website,
      linkedin: "https://www.linkedin.com",
      opportunityType: result.opportunityType,
      domainRating: result.authorityScore,
      nextStep: result.suggestedNextAction,
      nextFollowUp: new Date().toISOString().slice(0, 10),
      notes: `Imported from Authority Discovery. Referral value: ${result.referralValue}. Backlink value: ${result.backlinkValue}. Partnership potential: ${result.partnershipPotential}.`,
      activity: [
        {
          date: new Date().toISOString().slice(0, 10),
          title: "Imported from Authority Discovery",
          detail: `AI-assisted score ${result.authorityScore}. Status set to research for qualification.`,
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
