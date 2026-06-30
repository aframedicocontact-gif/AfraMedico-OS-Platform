import type { OrganizationCategory, OpportunityType } from "./organization";

export type AuthorityDiscoveryStatus = "New" | "Imported" | "Duplicate";

export type AuthorityValueRating = "High" | "Medium" | "Low";
export type AuthorityDiscoverySourceType =
  | "Curated Data"
  | "CSV Imported Data"
  | "Tavily Web Search";
export type AuthorityDiscoveryConfidence = "Verified" | "Needs verification" | "Unknown";
export type AuthorityIntelligenceConfidence = "High" | "Medium" | "Low" | "Unknown";
export type AuthorityVerificationStatus = "Verified" | "Needs Manual Review" | "Insufficient Evidence";

export type AuthorityDiscoveryParameters = {
  searchText: string;
  country: string;
  category: OrganizationCategory;
  treatmentKeyword: string;
  maximumResults: number;
  sourceType: AuthorityDiscoverySourceType;
  csvText?: string;
};

export type AuthorityProviderKind =
  | "Manual CSV import"
  | "Curated seed list"
  | "Tavily Web Search";

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
  linkedin: string;
  contactEmail: string;
  sourceUrl?: string;
  snippet?: string;
  rawSearchSource?: string;
  description?: string;
  organizationType?: string;
  primaryMedicalSpecialty?: string;
  treatmentFocus?: string;
  partnershipType?: string;
  aiConfidence?: AuthorityIntelligenceConfidence;
  verificationStatus?: AuthorityVerificationStatus;
  contactPage?: string;
  aiSummary?: string;
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

export type AuthorityDiscoveryDiagnostics = {
  providerUsed?: string;
  tavilyResultsCount?: number;
  normalizedResultsCount?: number;
  openAiEnabled?: boolean;
  openAiAnalysisAttempted?: boolean;
  openAiResultsCount?: number;
  fallbackUsed?: boolean;
  errorCode?: string | null;
  safeMessage?: string;
};

export type AuthorityImportSummary = {
  importedOrganizations: number;
  duplicateOrganizations: number;
  importedIds: string[];
  duplicateNames: string[];
};
