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
};
