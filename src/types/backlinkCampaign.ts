import type { OrganizationPriority } from "./organization";

export type BacklinkCampaignType =
  | "Resource Page Backlink"
  | "Guest Article"
  | "Partner Page Listing"
  | "Medical Directory Listing"
  | "Conference Collaboration"
  | "Academic Collaboration"
  | "NGO Awareness Partnership"
  | "Referral Partnership";

export type BacklinkCampaignStatus = "Draft" | "Active" | "Paused" | "Completed" | "Archived";

export type BacklinkOutreachStatus =
  | "Not Started"
  | "Website Checked"
  | "Contact Found"
  | "Message Prepared"
  | "Sent"
  | "Follow-up Needed"
  | "Replied"
  | "Backlink Won"
  | "Partnership Won"
  | "Rejected"
  | "Archived";

export type BacklinkStatus =
  | "Not Requested"
  | "Requested"
  | "Under Review"
  | "Won"
  | "Rejected"
  | "Needs Follow-up";

export type BacklinkTemplateChannel = "Email" | "LinkedIn" | "Facebook" | "Instagram" | "Contact Form";

export type BacklinkCampaignTarget = {
  organizationId: string;
  outreachStatus: BacklinkOutreachStatus;
  backlinkStatus: BacklinkStatus;
  requestedUrl: string;
  targetPage: string;
  anchorText: string;
  dateRequested: string;
  dateWon: string;
  backlinkUrl: string;
  notes: string;
};

export type BacklinkCampaignTemplates = Record<BacklinkTemplateChannel, string>;

export type BacklinkCampaign = {
  id: string;
  campaignName: string;
  targetCountry: string;
  treatmentFocus: string;
  campaignType: BacklinkCampaignType;
  goal: string;
  targetBacklinkUrl: string;
  anchorText: string;
  priority: OrganizationPriority;
  status: BacklinkCampaignStatus;
  startDate: string;
  followUpDate: string;
  notes: string;
  targets: BacklinkCampaignTarget[];
  templates: BacklinkCampaignTemplates;
  createdAt: string;
  updatedAt: string;
};

export type CreateBacklinkCampaignInput = {
  campaignName: string;
  targetCountry: string;
  treatmentFocus: string;
  campaignType: BacklinkCampaignType;
  goal: string;
  targetBacklinkUrl: string;
  anchorText: string;
  priority: OrganizationPriority;
  status: BacklinkCampaignStatus;
  startDate: string;
  followUpDate: string;
  notes: string;
  targetOrganizationIds: string[];
};
