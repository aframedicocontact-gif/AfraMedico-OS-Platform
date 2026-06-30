import type { OrganizationCategory, OpportunityType } from "./organization";

export type AuthorityDiscoveryStatus = "New" | "Imported" | "Duplicate";

export type AuthorityValueRating = "High" | "Medium" | "Low";

export type AuthorityDiscoveryParameters = {
  country: string;
  category: OrganizationCategory;
  keyword: string;
  maximumResults: number;
};

export type AuthorityProviderKind =
  | "Google Custom Search API"
  | "Bing Search API"
  | "SerpAPI"
  | "LinkedIn"
  | "OpenAlex"
  | "Crossref"
  | "PubMed";

export type AuthorityDiscoveryProvider = {
  kind: AuthorityProviderKind;
  search: (parameters: AuthorityDiscoveryParameters) => Promise<AuthorityDiscoveryResult[]>;
};

export type AuthorityDiscoveryResult = {
  id: string;
  organization: string;
  country: string;
  category: OrganizationCategory;
  website: string;
  contactEmail: string;
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
