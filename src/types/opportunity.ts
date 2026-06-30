export type OpportunityKind =
  | "Research Collaboration"
  | "Medical Tourism Referral"
  | "Hospital Partnership"
  | "Academic Partnership"
  | "Conference Partnership"
  | "Clinical Training"
  | "Student Recruitment"
  | "Backlink Opportunity"
  | "Media Exposure"
  | "Government Collaboration"
  | "Grant Opportunity"
  | "NGO Partnership"
  | "Professional Association"
  | "Medical Education"
  | "International Expansion";

export type OpportunityDifficulty = "Low" | "Medium" | "High";
export type OpportunityConfidence = "Low" | "Medium" | "High";

export type OpportunityAnalysis = {
  kind: OpportunityKind;
  opportunityScore: number;
  strategicValue: number;
  revenuePotential: number;
  brandAuthority: number;
  seoValue: number;
  referralPotential: number;
  difficulty: OpportunityDifficulty;
  estimatedTime: string;
  confidence: OpportunityConfidence;
  recommendedAction: string;
  explanation: string;
};

export type OpportunityPriority = {
  rank: 1 | 2 | 3;
  opportunity: OpportunityAnalysis;
  explanation: string;
};

export type OpportunityExecutiveSummary = {
  strengths: string[];
  weaknesses: string[];
  quickWins: string[];
  longTermOpportunities: string[];
  potentialRisks: string[];
};

export type OpportunityIndicator =
  | "High Value"
  | "Quick Win"
  | "High Authority"
  | "High SEO"
  | "High Revenue"
  | "High Referral";

export type OpportunityProfile = {
  organizationId: string;
  generatedAt: string;
  indicators: OpportunityIndicator[];
  opportunities: OpportunityAnalysis[];
  topOpportunities: OpportunityPriority[];
  executiveSummary: OpportunityExecutiveSummary;
};

export type OpportunityAiProvider =
  | "OpenAI"
  | "Claude"
  | "Gemini"
  | "PubMed"
  | "Google Search"
  | "Crossref"
  | "OpenAlex"
  | "Google Scholar";

export type OpportunityProviderAdapter = {
  provider: OpportunityAiProvider;
  isConfigured: boolean;
};
