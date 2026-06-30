import type { OrganizationCategory, OpportunityType } from "./organization";

export type AuthorityDiscoveryStatus = "New" | "Imported" | "Duplicate";

export type AuthorityValueRating = "High" | "Medium" | "Low";
export type AuthorityDiscoveryMode = "real" | "demo";
export type AuthorityDiscoverySourceType =
  | "Curated seed"
  | "CSV import"
  | "Future web provider"
  | "Demo data";
export type AuthorityDiscoveryConfidence = "Verified" | "Needs verification" | "Unknown";

export type AuthorityDiscoveryParameters = {
  country: string;
  category: OrganizationCategory;
  keyword: string;
  maximumResults: number;
  mode: AuthorityDiscoveryMode;
  sourceType: AuthorityDiscoverySourceType;
  csvText?: string;
};

export type AuthorityProviderKind =
  | "Manual CSV import"
  | "Curated seed list"
  | "Public web search provider"
  | "OpenAlex"
  | "PubMed"
  | "Crossref";

export type AuthorityDiscoveryProvider = {
  kind: AuthorityProviderKind;
  sourceType: AuthorityDiscoverySourceType;
  isConfigured: boolean;
  search: (parameters: AuthorityDiscoveryParameters) => Promise<AuthorityDiscoveryResult[]>;
};

export type AuthorityDiscoveryResult = {
  id: string;
  organization: string;
  country: string;
  category: OrganizationCategory;
  website: string;
  contactEmail: string;
  sourceType: AuthorityDiscoverySourceType;
  sourceNote: string;
  confidence: AuthorityDiscoveryConfidence;
  authorityType: string;
  authorityScore: number;
  referralValue: AuthorityValueRating;
  backlinkValue: AuthorityValueRating;
  partnershipPotential: AuthorityValueRating;
  opportunityType: OpportunityType;
  suggestedNextAction: string;
  status: AuthorityDiscoveryStatus;
};

export type AuthorityDiscoveryHistoryItem = {
  id: string;
  searchedAt: string;
  parameters: AuthorityDiscoveryParameters;
  resultCount: number;
  importedCount: number;
};

export type AuthorityImportSummary = {
  importedOrganizations: number;
  duplicateOrganizations: number;
  importedIds: string[];
  duplicateNames: string[];
};
