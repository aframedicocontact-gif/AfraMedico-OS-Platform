export type OrganizationStatus =
  | "research"
  | "contacted"
  | "in-discussion"
  | "partner"
  | "backlink-secured"
  | "rejected";

export type OrganizationPriority = "low" | "medium" | "high";

export type OrganizationCategory =
  | "Universities"
  | "Teaching Hospitals"
  | "Medical Associations"
  | "NGOs"
  | "Health Blogs"
  | "News Media"
  | "Business Directories";

export type OpportunityType =
  | "Expert citation"
  | "Backlink"
  | "Directory listing"
  | "Editorial mention"
  | "Partnership"
  | "Research collaboration";

export type ActivityItem = {
  date: string;
  title: string;
  detail: string;
};

export type Organization = {
  id: string;
  name: string;
  country: string;
  category: OrganizationCategory;
  status: OrganizationStatus;
  priority: OrganizationPriority;
  owner: string;
  contactName: string;
  email: string;
  website: string;
  linkedin: string;
  opportunityType: OpportunityType;
  domainRating: number;
  nextStep: string;
  nextFollowUp: string;
  notes: string;
  activity: ActivityItem[];
  description?: string;
  medicalSpecialty?: string;
  treatmentFocus?: string;
  organizationType?: string;
  partnershipType?: string;
  confidence?: string;
  verificationStatus?: string;
  sourceUrl?: string;
  contactPage?: string;
  aiSummary?: string;
};

export type OrganizationPlan = "cloud" | "enterprise" | "trial" | "internal";

export type OrganizationLifecycleStatus = "active" | "inactive" | "suspended" | "archived";

export type PlatformOrganization = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  timezone: string;
  currency: string;
  plan: OrganizationPlan;
  status: OrganizationLifecycleStatus;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  country?: string | null;
  timezone?: string;
  currency?: string;
  plan?: OrganizationPlan;
  status?: OrganizationLifecycleStatus;
  logo_url?: string | null;
};

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;
