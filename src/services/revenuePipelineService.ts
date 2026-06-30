import type { Organization, OrganizationPriority } from "../types/organization";

export type RevenueRisk = "Low" | "Medium" | "High";

export type RevenuePipelineItem = {
  organizationId: string;
  organizationName: string;
  country: string;
  category: string;
  potentialRevenue: number;
  estimatedReferrals: number;
  estimatedPatients: number;
  estimatedSeoValue: number;
  estimatedPartnershipValue: number;
  expectedTimeline: string;
  risk: RevenueRisk;
  priority: OrganizationPriority;
};

export type RevenuePipelineTotals = {
  potentialRevenue: number;
  estimatedReferrals: number;
  estimatedPatients: number;
  estimatedSeoValue: number;
  estimatedPartnershipValue: number;
  highPriorityCount: number;
  highRiskCount: number;
};

export type RevenuePipelineData = {
  items: RevenuePipelineItem[];
  totals: RevenuePipelineTotals;
  byCountry: Array<{ label: string; value: number }>;
  byCategory: Array<{ label: string; value: number }>;
  byTimeline: Array<{ label: string; value: number }>;
  byRisk: Array<{ label: string; value: number }>;
};

const averageCaseValueByCategory: Record<string, number> = {
  "Teaching Hospitals": 12500,
  "Medical Associations": 8500,
  Universities: 6500,
  NGOs: 7000,
  "News Media": 4500,
  "Health Blogs": 3000,
  "Business Directories": 2500,
};

function priorityMultiplier(priority: OrganizationPriority) {
  if (priority === "high") return 1.45;
  if (priority === "medium") return 1.15;
  return 0.85;
}

function statusMultiplier(status: Organization["status"]) {
  if (status === "partner") return 1.8;
  if (status === "in-discussion") return 1.45;
  if (status === "contacted") return 1.2;
  if (status === "backlink-secured") return 1.1;
  if (status === "rejected") return 0.15;
  return 0.7;
}

function categoryReferralBase(category: string) {
  if (category === "Teaching Hospitals") return 18;
  if (category === "Medical Associations") return 14;
  if (category === "NGOs") return 12;
  if (category === "Universities") return 8;
  if (category === "News Media") return 5;
  if (category === "Health Blogs") return 4;
  return 3;
}

function expectedTimelineFor(organization: Organization) {
  if (organization.status === "partner") return "0-30 days";
  if (organization.status === "in-discussion") return "30-60 days";
  if (organization.status === "contacted") return "60-90 days";
  if (organization.priority === "high") return "90-120 days";
  return "120+ days";
}

function riskFor(organization: Organization): RevenueRisk {
  if (organization.status === "rejected") return "High";
  if (organization.priority === "high" && organization.status === "research") return "Medium";
  if (!organization.email || organization.email === "Not found") return "Medium";
  if (organization.status === "partner" || organization.status === "in-discussion") return "Low";
  return "Medium";
}

function countByRevenue(items: RevenuePipelineItem[], field: "country" | "category" | "expectedTimeline" | "risk") {
  const counts = items.reduce<Record<string, number>>((accumulator, item) => {
    const label = item[field];
    accumulator[label] = (accumulator[label] ?? 0) + item.potentialRevenue;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export function buildRevenuePipeline(organizations: Organization[]): RevenuePipelineData {
  const items = organizations.map((organization) => {
    const referralBase = categoryReferralBase(organization.category);
    const estimatedReferrals = Math.max(
      0,
      Math.round(referralBase * priorityMultiplier(organization.priority) * statusMultiplier(organization.status)),
    );
    const conversionRate = organization.status === "partner" ? 0.45 : organization.status === "in-discussion" ? 0.32 : 0.2;
    const estimatedPatients = Math.max(0, Math.round(estimatedReferrals * conversionRate));
    const averageCaseValue = averageCaseValueByCategory[organization.category] ?? 4000;
    const potentialRevenue = Math.round(estimatedPatients * averageCaseValue);
    const estimatedSeoValue = Math.round(
      organization.domainRating * (organization.opportunityType === "Backlink" ? 160 : 95) * priorityMultiplier(organization.priority),
    );
    const estimatedPartnershipValue = Math.round(
      (potentialRevenue * 0.28 + estimatedReferrals * 250) * statusMultiplier(organization.status),
    );

    return {
      organizationId: organization.id,
      organizationName: organization.name,
      country: organization.country,
      category: organization.category,
      potentialRevenue,
      estimatedReferrals,
      estimatedPatients,
      estimatedSeoValue,
      estimatedPartnershipValue,
      expectedTimeline: expectedTimelineFor(organization),
      risk: riskFor(organization),
      priority: organization.priority,
    };
  });

  const totals = items.reduce<RevenuePipelineTotals>(
    (accumulator, item) => ({
      potentialRevenue: accumulator.potentialRevenue + item.potentialRevenue,
      estimatedReferrals: accumulator.estimatedReferrals + item.estimatedReferrals,
      estimatedPatients: accumulator.estimatedPatients + item.estimatedPatients,
      estimatedSeoValue: accumulator.estimatedSeoValue + item.estimatedSeoValue,
      estimatedPartnershipValue: accumulator.estimatedPartnershipValue + item.estimatedPartnershipValue,
      highPriorityCount: accumulator.highPriorityCount + (item.priority === "high" ? 1 : 0),
      highRiskCount: accumulator.highRiskCount + (item.risk === "High" ? 1 : 0),
    }),
    {
      potentialRevenue: 0,
      estimatedReferrals: 0,
      estimatedPatients: 0,
      estimatedSeoValue: 0,
      estimatedPartnershipValue: 0,
      highPriorityCount: 0,
      highRiskCount: 0,
    },
  );

  return {
    items,
    totals,
    byCountry: countByRevenue(items, "country"),
    byCategory: countByRevenue(items, "category"),
    byTimeline: countByRevenue(items, "expectedTimeline"),
    byRisk: countByRevenue(items, "risk"),
  };
}
