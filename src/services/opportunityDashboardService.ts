import { scoreOrganizationOpportunities } from "./opportunityScoringService";
import type { Organization } from "../types/organization";
import type { OutreachWorkspaceRecord } from "../types/outreach";

const outreachStorageKey = "aframedico.authorityOutreach.workspaces";

export type OpportunityDashboardMetric = {
  label: string;
  value: number;
  helper: string;
};

export type OpportunityChartDatum = {
  label: string;
  value: number;
};

export type OpportunityDashboardData = {
  metrics: OpportunityDashboardMetric[];
  topCountries: OpportunityChartDatum[];
  topTreatments: OpportunityChartDatum[];
  topCategories: OpportunityChartDatum[];
  pipeline: OpportunityChartDatum[];
  opportunityMix: OpportunityChartDatum[];
};

function readStoredOutreachWorkspaces(): OutreachWorkspaceRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(outreachStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, OutreachWorkspaceRecord>;
    return Object.values(parsed).filter(Boolean);
  } catch {
    return [];
  }
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((accumulator, value) => {
    const normalized = value.trim();
    if (!normalized) return accumulator;
    accumulator[normalized] = (accumulator[normalized] ?? 0) + 1;
    return accumulator;
  }, {});
}

function toTopChartData(counts: Record<string, number>, limit = 7): OpportunityChartDatum[] {
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function getBestOpportunity(organization: Organization) {
  return [...scoreOrganizationOpportunities(organization)].sort((a, b) => b.opportunityScore - a.opportunityScore)[0];
}

function hasHighValueOpportunity(organization: Organization) {
  return scoreOrganizationOpportunities(organization).some((opportunity) => opportunity.opportunityScore >= 80);
}

function hasReferralPotential(organization: Organization) {
  return scoreOrganizationOpportunities(organization).some((opportunity) => opportunity.referralPotential >= 75);
}

function hasBacklinkPotential(organization: Organization) {
  return (
    organization.opportunityType === "Backlink" ||
    scoreOrganizationOpportunities(organization).some((opportunity) => opportunity.seoValue >= 80)
  );
}

function getTreatmentLabel(organization: Organization) {
  return organization.treatmentFocus || organization.medicalSpecialty || "";
}

export function buildOpportunityDashboardData(organizations: Organization[]): OpportunityDashboardData {
  const outreachWorkspaces = readStoredOutreachWorkspaces();
  const communications = outreachWorkspaces.flatMap((workspace) => workspace.communications);
  const meetings = outreachWorkspaces.flatMap((workspace) => workspace.meetings);
  const signedWorkspaceIds = new Set(
    outreachWorkspaces
      .filter((workspace) => ["Agreement Signed", "Active Partner"].includes(workspace.partnershipStage))
      .map((workspace) => workspace.organizationId),
  );

  organizations
    .filter((organization) => organization.status === "partner")
    .forEach((organization) => signedWorkspaceIds.add(organization.id));

  const metrics: OpportunityDashboardMetric[] = [
    {
      label: "Organizations Discovered",
      value: organizations.length,
      helper: "Current Authority CRM records.",
    },
    {
      label: "Qualified Organizations",
      value: organizations.filter((organization) => !["research", "rejected"].includes(organization.status)).length,
      helper: "Organizations beyond research status.",
    },
    {
      label: "High Value Opportunities",
      value: organizations.filter(hasHighValueOpportunity).length,
      helper: "Local opportunity score at or above 80.",
    },
    {
      label: "Emails Sent",
      value: communications.filter((communication) => communication.type === "Email").length,
      helper: "Saved outreach email communications.",
    },
    {
      label: "Replies Received",
      value: communications.filter((communication) => /reply|respond|positive|interested|accepted/i.test(communication.outcome)).length,
      helper: "Replies inferred only from saved outcomes.",
    },
    {
      label: "Meetings",
      value:
        meetings.length +
        communications.filter((communication) => ["Meeting", "Video Call", "Conference"].includes(communication.type)).length,
      helper: "Saved meetings and meeting-type communications.",
    },
    {
      label: "Signed Agreements",
      value: signedWorkspaceIds.size,
      helper: "Partner status or saved agreement stage.",
    },
    {
      label: "Potential Referral Partners",
      value: organizations.filter(hasReferralPotential).length,
      helper: "Referral potential based on current CRM category/status.",
    },
    {
      label: "Potential Backlink Partners",
      value: organizations.filter(hasBacklinkPotential).length,
      helper: "SEO or backlink fit based on current CRM record.",
    },
  ];

  const topCountries = toTopChartData(countBy(organizations.map((organization) => organization.country)));
  const topTreatments = toTopChartData(countBy(organizations.map(getTreatmentLabel)));
  const topCategories = toTopChartData(countBy(organizations.map((organization) => organization.category)));
  const pipeline = toTopChartData(countBy(organizations.map((organization) => organization.status)), 10);
  const opportunityMix = toTopChartData(
    countBy(organizations.map((organization) => getBestOpportunity(organization)?.kind ?? "")),
    10,
  );

  return {
    metrics,
    topCountries,
    topTreatments,
    topCategories,
    pipeline,
    opportunityMix,
  };
}
