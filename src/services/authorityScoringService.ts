import type { OrganizationCategory, OpportunityType } from "../types/organization";
import type { AuthorityValueRating } from "../types/authorityDiscovery";

type AuthorityScoreProfile = {
  authorityType: string;
  authorityScore: number;
  referralValue: AuthorityValueRating;
  backlinkValue: AuthorityValueRating;
  partnershipPotential: AuthorityValueRating;
  opportunityType: OpportunityType;
};

const authorityScoreProfiles: Record<OrganizationCategory, AuthorityScoreProfile> = {
  "Teaching Hospitals": {
    authorityType: "Teaching Hospital",
    authorityScore: 95,
    referralValue: "High",
    backlinkValue: "Medium",
    partnershipPotential: "High",
    opportunityType: "Expert citation",
  },
  "Medical Associations": {
    authorityType: "Medical Association",
    authorityScore: 90,
    referralValue: "High",
    backlinkValue: "High",
    partnershipPotential: "High",
    opportunityType: "Partnership",
  },
  Universities: {
    authorityType: "University",
    authorityScore: 88,
    referralValue: "Medium",
    backlinkValue: "High",
    partnershipPotential: "High",
    opportunityType: "Research collaboration",
  },
  NGOs: {
    authorityType: "Cancer NGO",
    authorityScore: 80,
    referralValue: "High",
    backlinkValue: "Medium",
    partnershipPotential: "High",
    opportunityType: "Partnership",
  },
  "News Media": {
    authorityType: "Medical Journal",
    authorityScore: 92,
    referralValue: "Medium",
    backlinkValue: "High",
    partnershipPotential: "Medium",
    opportunityType: "Editorial mention",
  },
  "Business Directories": {
    authorityType: "Medical Directory",
    authorityScore: 70,
    referralValue: "Low",
    backlinkValue: "Medium",
    partnershipPotential: "Low",
    opportunityType: "Directory listing",
  },
  "Health Blogs": {
    authorityType: "Blog",
    authorityScore: 55,
    referralValue: "Low",
    backlinkValue: "Medium",
    partnershipPotential: "Low",
    opportunityType: "Backlink",
  },
};

export function scoreAuthorityTarget(category: OrganizationCategory, keyword: string) {
  const profile = authorityScoreProfiles[category];
  const normalizedKeyword = keyword.trim().toLowerCase();
  const cancerBoost =
    normalizedKeyword.includes("cancer") && (category === "Teaching Hospitals" || category === "NGOs")
      ? 2
      : 0;

  return {
    ...profile,
    authorityScore: Math.min(100, profile.authorityScore + cancerBoost),
  };
}
