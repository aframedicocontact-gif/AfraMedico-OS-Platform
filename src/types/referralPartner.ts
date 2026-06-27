export type PartnerType =
  | "Physicians"
  | "Specialist Clinics"
  | "Diagnostic Centers"
  | "NGOs"
  | "HMOs / Insurance"
  | "Travel Agencies"
  | "Medical Facilitators"
  | "Corporate Organizations";

export type ReferralStatus =
  | "Prospect"
  | "Contacted"
  | "Meeting Scheduled"
  | "Negotiation"
  | "Agreement Signed"
  | "Active Referrer"
  | "Inactive";

export type AgreementStatus =
  | "Not Started"
  | "Draft Sent"
  | "Under Review"
  | "Signed"
  | "Paused";

export type CommissionModel =
  | "Flat referral fee"
  | "Percentage of net revenue"
  | "No commission"
  | "Case-by-case";

export type ReferralActivityItem = {
  date: string;
  title: string;
  detail: string;
};

export type ReferralPartner = {
  id: string;
  organizationName: string;
  contactPerson: string;
  country: string;
  city: string;
  partnerType: PartnerType;
  specialties: string[];
  treatmentsReferred: string[];
  phone: string;
  email: string;
  website: string;
  whatsapp: string;
  referralStatus: ReferralStatus;
  agreementStatus: AgreementStatus;
  commissionModel: CommissionModel;
  patientsReferred: number;
  newReferrals: number;
  estimatedRevenue: number;
  lastContact: string;
  nextFollowUp: string;
  notes: string;
  activity: ReferralActivityItem[];
};
