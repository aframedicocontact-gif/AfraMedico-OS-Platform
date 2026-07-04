export type LeadSource =
  | "Website"
  | "WhatsApp"
  | "Facebook"
  | "Instagram"
  | "Google Search"
  | "Google Ads"
  | "YouTube"
  | "Referral Partner"
  | "Hospital"
  | "Doctor"
  | "NGO"
  | "Conference"
  | "University"
  | "Phone Call"
  | "Email"
  | "Walk-in"
  | "Other";

export type LeadStatus =
  | "New"
  | "New Lead"
  | "Contacted"
  | "Medical Documents Requested"
  | "Medical Records Requested"
  | "Documents Received"
  | "Medical Records Received"
  | "Medical Review"
  | "Medical Review Requested"
  | "Hospital Quotes Requested"
  | "Quotation Requested"
  | "Hospital Quotes Received"
  | "Quotation Received"
  | "Patient Decision Pending"
  | "Patient Decision"
  | "Treatment Scheduled"
  | "Travel Planning"
  | "Completed"
  | "Closed"
  | "Accepted"
  | "Lost";

export type LeadPipelineStage =
  | "New Lead"
  | "Initial Contact"
  | "Documents Requested"
  | "Documents Received"
  | "Medical Review"
  | "Hospital Selection"
  | "Quotation Sent"
  | "Decision Pending"
  | "Confirmed"
  | "Lost";

export type LeadPriority = "Low" | "Medium" | "High" | "Urgent";

export type CaseStatus = "Active" | "Closed" | "Reopened" | "Future" | "Lost";

export type PatientOwnershipStatus =
  | "Pending Review"
  | "Confirmed First Referrer"
  | "Transferred by Manager"
  | "Split Commission"
  | "No Commission";

export type MedicalReviewStatus =
  | "Not Started"
  | "Pending Documents"
  | "In Review"
  | "Completed";

export type HospitalQuoteStatus =
  | "Not Requested"
  | "Requested"
  | "Received"
  | "Sent to Patient";

export type LeadActivityItem = {
  date: string;
  title: string;
  detail: string;
};

export type LeadAttachment = {
  id: string;
  name: string;
  category: string;
  notes: string;
  createdAt: string;
};

export type LeadCommunication = {
  id: string;
  type: "Email" | "WhatsApp";
  subject: string;
  summary: string;
  createdAt: string;
};

export type LeadReminder = {
  id: string;
  title: string;
  dueDate: string;
  priority: LeadPriority;
  status: "Open" | "Completed";
  createdAt: string;
};

export type PatientCaseSummary = {
  caseId: string;
  treatmentRequested: string;
  caseStatus: CaseStatus;
  createdDate: string;
  closedDate: string;
  reopenedDate: string;
};

export type Lead = {
  id: string;
  patientId: string;
  caseId: string;
  patientName: string;
  dateOfBirth: string;
  country: string;
  city: string;
  nationality: string;
  phone: string;
  phoneCountryCode?: string;
  phoneLocalNumber?: string;
  phoneInternationalNumber?: string;
  whatsapp: string;
  whatsappCountryCode?: string;
  whatsappLocalNumber?: string;
  whatsappInternationalNumber?: string;
  email: string;
  primaryEmail?: string;
  confirmEmail?: string;
  emailVerified?: boolean;
  emailVerificationStatus?: "Unverified" | "Mismatch" | "Verified";
  age: number;
  gender: string;
  preferredLanguage: string;
  leadSource: LeadSource;
  interestedTreatment: string;
  medicalCondition: string;
  medicalHistory?: string;
  urgency: LeadPriority;
  preferredDestination: string;
  assignedCoordinator: string;
  currentStatus: LeadStatus;
  pipelineStage: LeadPipelineStage;
  caseStatus: CaseStatus;
  createdDate: string;
  closedDate: string;
  reopenedDate: string;
  referralPartner: string;
  primaryPartnerAttribution: string;
  firstReferralDate: string;
  lifetimePartnerOwner: string;
  ownershipStatus: PatientOwnershipStatus;
  adminOverrideReason: string;
  possibleDuplicate: boolean;
  hospital: string;
  documentsReceived: boolean;
  medicalReviewStatus: MedicalReviewStatus;
  hospitalQuoteStatus: HospitalQuoteStatus;
  estimatedTreatmentCost: number;
  expectedTravelDate: string;
  relatedHospitalReferrals: string[];
  relatedQuotes: string[];
  relatedMedicalReview: string;
  relatedPatientJourney: string;
  priority: LeadPriority;
  responseTimeHours: number;
  lastContact: string;
  nextFollowUp: string;
  internalNotes: string;
  patientCases: PatientCaseSummary[];
  activity: LeadActivityItem[];
  attachments?: LeadAttachment[];
  communications?: LeadCommunication[];
  reminders?: LeadReminder[];
  createdAt?: string;
  updatedAt?: string;
};
