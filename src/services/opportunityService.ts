import { generateExecutiveSummary, rankTopOpportunities } from "./opportunityRecommendationService";
import { scoreOrganizationOpportunities } from "./opportunityScoringService";
import type { Organization } from "../types/organization";
import type {
  OpportunityIndicator,
  OpportunityProfile,
  OpportunityProviderAdapter,
} from "../types/opportunity";

const opportunityProfileStorageKey = "aframedico.authorityOpportunity.profiles";

type OpportunityProfileStore = Record<string, OpportunityProfile>;

export const opportunityProviderAdapters: OpportunityProviderAdapter[] = [
  { provider: "OpenAI", isConfigured: false },
  { provider: "Claude", isConfigured: false },
  { provider: "Gemini", isConfigured: false },
  { provider: "PubMed", isConfigured: false },
  { provider: "Google Search", isConfigured: false },
  { provider: "Crossref", isConfigured: false },
  { provider: "OpenAlex", isConfigured: false },
  { provider: "Google Scholar", isConfigured: false },
];

function readProfiles(): OpportunityProfileStore {
  if (typeof window === "undefined") return {};

  const rawValue = window.localStorage.getItem(opportunityProfileStorageKey);
  if (!rawValue) return {};

  try {
    return JSON.parse(rawValue) as OpportunityProfileStore;
  } catch {
    window.localStorage.removeItem(opportunityProfileStorageKey);
    return {};
  }
}

function writeProfiles(profiles: OpportunityProfileStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(opportunityProfileStorageKey, JSON.stringify(profiles));
}

function indicatorsFor(profile: Omit<OpportunityProfile, "indicators">): OpportunityIndicator[] {
  const top = profile.topOpportunities[0]?.opportunity;
  const indicators = new Set<OpportunityIndicator>();

  if (top?.opportunityScore && top.opportunityScore >= 80) indicators.add("High Value");
  if (top?.difficulty === "Low" && top.estimatedTime === "1-3 weeks") indicators.add("Quick Win");
  if (profile.opportunities.some((item) => item.brandAuthority >= 80)) indicators.add("High Authority");
  if (profile.opportunities.some((item) => item.seoValue >= 80)) indicators.add("High SEO");
  if (profile.opportunities.some((item) => item.revenuePotential >= 75)) indicators.add("High Revenue");
  if (profile.opportunities.some((item) => item.referralPotential >= 75)) indicators.add("High Referral");

  return [...indicators];
}

export function generateOpportunityProfile(organization: Organization): OpportunityProfile {
  const opportunities = scoreOrganizationOpportunities(organization);
  const topOpportunities = rankTopOpportunities(opportunities);
  const executiveSummary = generateExecutiveSummary(organization, opportunities);
  const profileWithoutIndicators = {
    organizationId: organization.id,
    generatedAt: new Date().toISOString(),
    opportunities,
    topOpportunities,
    executiveSummary,
  };

  return {
    ...profileWithoutIndicators,
    indicators: indicatorsFor(profileWithoutIndicators),
  };
}

export function getOpportunityProfile(organization: Organization) {
  const profiles = readProfiles();
  if (profiles[organization.id]) return profiles[organization.id];

  const profile = generateOpportunityProfile(organization);
  writeProfiles({ ...profiles, [organization.id]: profile });
  return profile;
}

export function refreshOpportunityProfile(organization: Organization) {
  const profiles = readProfiles();
  const profile = generateOpportunityProfile(organization);
  writeProfiles({ ...profiles, [organization.id]: profile });
  return profile;
}
