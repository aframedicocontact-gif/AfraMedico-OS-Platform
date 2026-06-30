import type { Organization } from "../types/organization";
import type { OpportunityAnalysis, OpportunityDifficulty, OpportunityKind } from "../types/opportunity";

const opportunityKinds: OpportunityKind[] = [
  "Research Collaboration",
  "Medical Tourism Referral",
  "Hospital Partnership",
  "Academic Partnership",
  "Conference Partnership",
  "Clinical Training",
  "Student Recruitment",
  "Backlink Opportunity",
  "Media Exposure",
  "Government Collaboration",
  "Grant Opportunity",
  "NGO Partnership",
  "Professional Association",
  "Medical Education",
  "International Expansion",
];

const recommendedActions: Record<OpportunityKind, string> = {
  "Research Collaboration": "Research collaboration",
  "Medical Tourism Referral": "Referral agreement",
  "Hospital Partnership": "Medical tourism agreement",
  "Academic Partnership": "Educational partnership",
  "Conference Partnership": "Conference invitation",
  "Clinical Training": "Invite for webinar",
  "Student Recruitment": "Educational partnership",
  "Backlink Opportunity": "Guest article",
  "Media Exposure": "Guest article",
  "Government Collaboration": "Offer MOU",
  "Grant Opportunity": "Joint publication",
  "NGO Partnership": "Offer MOU",
  "Professional Association": "Invite for webinar",
  "Medical Education": "Educational partnership",
  "International Expansion": "Medical tourism agreement",
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function categoryFit(organization: Organization, kind: OpportunityKind) {
  const category = organization.category;

  if (category === "Teaching Hospitals") {
    return ["Medical Tourism Referral", "Hospital Partnership", "Clinical Training", "Medical Education"].includes(kind) ? 24 : 8;
  }
  if (category === "Medical Associations") {
    return ["Professional Association", "Conference Partnership", "Medical Education", "International Expansion"].includes(kind) ? 24 : 10;
  }
  if (category === "Universities") {
    return ["Research Collaboration", "Academic Partnership", "Student Recruitment", "Grant Opportunity"].includes(kind) ? 24 : 8;
  }
  if (category === "NGOs") {
    return ["NGO Partnership", "Medical Tourism Referral", "Grant Opportunity", "Government Collaboration"].includes(kind) ? 22 : 9;
  }
  if (category === "News Media") {
    return ["Media Exposure", "Backlink Opportunity", "Conference Partnership"].includes(kind) ? 24 : 6;
  }
  if (category === "Health Blogs") {
    return ["Backlink Opportunity", "Media Exposure", "Medical Education"].includes(kind) ? 20 : 5;
  }
  return ["Backlink Opportunity", "Medical Tourism Referral", "International Expansion"].includes(kind) ? 18 : 5;
}

function difficultyFor(kind: OpportunityKind, organization: Organization): OpportunityDifficulty {
  if (["Backlink Opportunity", "Media Exposure", "Medical Education"].includes(kind)) return "Low";
  if (["Government Collaboration", "Grant Opportunity", "Hospital Partnership"].includes(kind)) return "High";
  return organization.priority === "high" ? "Medium" : "Low";
}

function estimatedTimeFor(difficulty: OpportunityDifficulty) {
  if (difficulty === "Low") return "1-3 weeks";
  if (difficulty === "Medium") return "1-2 months";
  return "3-6 months";
}

export function scoreOrganizationOpportunities(organization: Organization): OpportunityAnalysis[] {
  return opportunityKinds.map((kind) => {
    const fit = categoryFit(organization, kind);
    const authority = organization.domainRating;
    const priorityBoost = organization.priority === "high" ? 12 : organization.priority === "medium" ? 6 : 0;
    const statusBoost = organization.status === "partner" ? 15 : organization.status === "in-discussion" ? 10 : organization.status === "contacted" ? 6 : 0;
    const difficulty = difficultyFor(kind, organization);
    const difficultyPenalty = difficulty === "High" ? 18 : difficulty === "Medium" ? 8 : 0;
    const seoValue = clamp(kind.includes("Backlink") || kind.includes("Media") ? authority + fit : authority * 0.55 + fit);
    const referralPotential = clamp(
      ["Medical Tourism Referral", "Hospital Partnership", "NGO Partnership", "Professional Association"].includes(kind)
        ? 55 + fit + priorityBoost
        : 25 + fit,
    );
    const revenuePotential = clamp(
      ["Medical Tourism Referral", "Hospital Partnership", "International Expansion"].includes(kind)
        ? 50 + fit + statusBoost
        : 20 + fit,
    );
    const brandAuthority = clamp(authority + fit + statusBoost);
    const strategicValue = clamp((brandAuthority + referralPotential + revenuePotential + seoValue) / 4 + priorityBoost);
    const opportunityScore = clamp(strategicValue + fit * 0.7 + statusBoost - difficultyPenalty);

    return {
      kind,
      opportunityScore,
      strategicValue,
      revenuePotential,
      brandAuthority,
      seoValue,
      referralPotential,
      difficulty,
      estimatedTime: estimatedTimeFor(difficulty),
      confidence: opportunityScore >= 78 ? "High" : opportunityScore >= 60 ? "Medium" : "Low",
      recommendedAction: recommendedActions[kind],
      explanation: `${kind} is scored from category fit, authority signal, current CRM status, and expected execution difficulty.`,
    };
  });
}
