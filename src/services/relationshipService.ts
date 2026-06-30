import type { Organization } from "../types/organization";
import type { OutreachWorkspaceRecord, RelationshipScores } from "../types/outreach";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateRelationshipScores(
  organization: Organization,
  workspace: OutreachWorkspaceRecord,
): RelationshipScores {
  const stageBoost = {
    Discovered: 10,
    Qualified: 20,
    Contacted: 35,
    "Meeting Scheduled": 45,
    "Proposal Sent": 60,
    Negotiating: 70,
    "Agreement Signed": 85,
    "Active Partner": 95,
    Inactive: 30,
  }[workspace.partnershipStage];
  const contactBoost = workspace.contacts.some((contact) => contact.decisionMaker) ? 10 : 0;
  const communicationBoost = Math.min(workspace.communications.length * 6, 24);
  const taskPenalty = workspace.tasks.filter((task) => task.status !== "Completed").length * 2;
  const authorityBase = organization.domainRating;

  return {
    relationshipScore: clamp(stageBoost + contactBoost + communicationBoost - taskPenalty),
    responseScore: clamp(40 + workspace.communications.length * 8 + workspace.meetings.length * 10),
    partnershipPotential: clamp(authorityBase * 0.6 + stageBoost * 0.5 + contactBoost),
    referralPotential: clamp(
      organization.category === "Teaching Hospitals" || organization.category === "Medical Associations" || organization.category === "NGOs"
        ? 78 + stageBoost * 0.2
        : 45 + stageBoost * 0.2,
    ),
    strategicValue: clamp(authorityBase * 0.55 + stageBoost * 0.35 + workspace.documents.length * 4),
  };
}
