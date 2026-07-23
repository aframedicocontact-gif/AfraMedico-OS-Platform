export type PartnerProspectOutreachStatus =
  | "new"
  | "email_sent"
  | "applied"
  | "approved"
  | "active"
  | "declined"
  | "held";

export type PartnerProspectCampaignGroup =
  | "Executive Invitation"
  | "Professional Invitation"
  | "Standard Invitation"
  | "Talent Pool (Do Not Contact)";

export type PartnerProspect = {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  profession: string | null;
  recommended_role: string | null;
  overall_suitability_score: number | null;
  email_campaign_group: string | null;
  contact_priority: string | null;
  personalized_email_type: string | null;
  reason_for_assignment: string | null;
  source: string;
  outreach_status: PartnerProspectOutreachStatus;
  invitation_sent_at: string | null;
  last_email_status: string | null;
  partner_id?: string | null;
  partner_network_intake_id?: string | null;
  applied_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnerProspectImportCandidate = Omit<
  PartnerProspect,
  | "id"
  | "organization_id"
  | "outreach_status"
  | "invitation_sent_at"
  | "last_email_status"
  | "partner_id"
  | "partner_network_intake_id"
  | "applied_at"
  | "created_at"
  | "updated_at"
> & {
  outreach_status?: PartnerProspectOutreachStatus;
  invitation_sent_at?: string | null;
  last_email_status?: string | null;
};

export type PartnerProspectImportPreview = {
  totalRows: number;
  validRecords: number;
  duplicateRecords: number;
  missingEmailRecords: number;
  invalidRecords: number;
  importableRecords: PartnerProspectImportCandidate[];
  duplicateEmails: string[];
  invalidReasons: string[];
};

export type PartnerProspectImportSummary = {
  imported: number;
  duplicates: number;
  skipped: number;
  errors: string[];
};

export type PartnerProspectEmailTemplateType =
  | "executive"
  | "professional"
  | "standard";

export type PartnerProspectEmailRender = {
  subject: string;
  previewText: string;
  html: string;
  text: string;
  variablesUsed: string[];
};

export type PartnerProspectSendResult = {
  sent: number;
  failed: number;
  excluded: number;
  duplicateWarnings: number;
  message: string;
};
