export type RegistrationStatus =
  | "Pending"
  | "Submitted"
  | "Confirmed"
  | "Duplicate Flagged"
  | "Rejected"
  | "Closed";

export type QuoteStatus =
  | "Not Requested"
  | "Requested"
  | "Received"
  | "Sent to Patient"
  | "Expired";

export type ReferralOwnership =
  | "Pending Review"
  | "Confirmed First Referrer"
  | "Transferred by Manager"
  | "Split Commission"
  | "No Commission";

export type ProtectionCaseStatus = "Active" | "Closed" | "Reopened" | "Future" | "Lost";

export type EvidenceType =
  | "Email"
  | "WhatsApp"
  | "PDF"
  | "Hospital Confirmation"
  | "Portal Screenshot"
  | "Hospital Registration Number"
  | "Voice Note"
  | "Internal Note";

export type DuplicateReviewStatus = "Pending" | "Resolved" | "Rejected";

export type DuplicateAction =
  | "Approve New Referral"
  | "Merge"
  | "Assign Commission Owner"
  | "Split Commission"
  | "Reject Duplicate";

export type EvidenceItem = {
  id: string;
  type: EvidenceType;
  label: string;
  date: string;
  notes: string;
};

export type AuditEvent = {
  id: string;
  date: string;
  time: string;
  user: string;
  action: string;
  evidence: string;
  notes: string;
};

export type PartnerReferralAttempt = {
  id: string;
  partner: string;
  referralDate: string;
  channel: string;
  ownership: ReferralOwnership;
  evidence: EvidenceItem[];
};

export type HospitalReferral = {
  id: string;
  hospital: string;
  referralDate: string;
  registrationDate: string;
  registrationStatus: RegistrationStatus;
  hospitalCaseId: string;
  contactPerson: string;
  coordinator: string;
  documentsSent: boolean;
  quoteStatus: QuoteStatus;
  quote: string;
  treatmentCost: number;
  expectedResponseDate: string;
  evidence: EvidenceItem[];
  timeline: AuditEvent[];
};

export type DuplicateReviewCase = {
  id: string;
  status: DuplicateReviewStatus;
  matchingScore: number;
  existingPatient: string;
  existingPartner: string;
  existingHospitalReferrals: string[];
  evidence: EvidenceItem[];
  recommendedAction: DuplicateAction;
};

export type CommissionOwnerDecision = {
  id: string;
  commissionOwner: string;
  ownership: ReferralOwnership;
  reason: string;
  decisionDate: string;
  decisionBy: string;
};

export type ProtectedReferralCase = {
  id: string;
  patientId: string;
  caseId: string;
  patientName: string;
  dateOfBirth: string;
  country: string;
  treatment: string;
  medicalCondition: string;
  destination: string;
  caseStatus: ProtectionCaseStatus;
  createdDate: string;
  closedDate: string;
  reopenedDate: string;
  relatedQuotes: string[];
  relatedMedicalReview: string;
  relatedPatientJourney: string;
  possibleDuplicate: boolean;
  primaryPartnerAttribution: string;
  firstReferralDate: string;
  lifetimePartnerOwner: string;
  adminOverrideReason: string;
  currentCommissionOwner: string;
  ownership: ReferralOwnership;
  conflict: boolean;
  partnerNotified: boolean;
  patientCreatedDate: string;
  partnerAttempts: PartnerReferralAttempt[];
  hospitalReferrals: HospitalReferral[];
  duplicateReviews: DuplicateReviewCase[];
  commissionDecisions: CommissionOwnerDecision[];
  auditTrail: AuditEvent[];
};
