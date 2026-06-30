import type { Organization } from "../types/organization";
import type {
  OpportunityAnalysis,
  OpportunityExecutiveSummary,
  OpportunityPriority,
} from "../types/opportunity";

export function rankTopOpportunities(opportunities: OpportunityAnalysis[]): OpportunityPriority[] {
  return [...opportunities]
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 3)
    .map((opportunity, index) => ({
      rank: (index + 1) as 1 | 2 | 3,
      opportunity,
      explanation:
        index === 0
          ? "Best first move based on combined strategic value, revenue, SEO, referral potential, confidence, and difficulty."
          : index === 1
            ? "Strong secondary path if the first opportunity needs more stakeholder alignment."
            : "Useful parallel opportunity that can support the relationship while larger opportunities mature.",
    }));
}

export function generateExecutiveSummary(
  organization: Organization,
  opportunities: OpportunityAnalysis[],
): OpportunityExecutiveSummary {
  const top = rankTopOpportunities(opportunities)[0]?.opportunity;
  const seoLeader = opportunities.find((item) => item.seoValue >= 75);
  const referralLeader = opportunities.find((item) => item.referralPotential >= 75);

  return {
    strengths: [
      `${organization.name} has a DR/authority signal of ${organization.domainRating}.`,
      `${organization.category} creates strong fit for ${top?.kind ?? organization.opportunityType}.`,
      `${organization.country} expands AfraMedico's Africa authority footprint.`,
    ],
    weaknesses: [
      "Contact path may still need qualification before executive outreach.",
      "Partnership terms, decision maker, and response quality are not fully validated yet.",
    ],
    quickWins: [
      seoLeader ? `${seoLeader.recommendedAction} for ${seoLeader.kind.toLowerCase()}.` : "Send a concise guest article or expert citation pitch.",
      "Confirm the best decision maker and preferred outreach channel.",
    ],
    longTermOpportunities: [
      referralLeader ? `${referralLeader.kind} could become a repeatable growth channel.` : "Develop a recurring education or referral partnership.",
      "Move from one-time outreach to an active partner relationship.",
    ],
    potentialRisks: [
      "Low response or slow approvals may delay execution.",
      "High-value opportunities may require MOU, compliance review, or senior stakeholder involvement.",
    ],
  };
}
