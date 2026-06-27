export type MasterCaseStatus =
  | "New"
  | "Active"
  | "Waiting Documents"
  | "Waiting Quotes"
  | "Treatment Approved"
  | "Travel Planned"
  | "Under Treatment"
  | "Recovery"
  | "Closed"
  | "Reopened"
  | "Lost";

export type CaseTimelineItem = {
  date: string;
  time?: string;
  user?: string;
  title: string;
  action?: string;
  evidence?: string;
  notes?: string;
  detail: string;
};

export type CaseAuditItem = {
  date: string;
  time: string;
  user: string;
  action: string;
  reason: string;
  evidence: string;
  oldValue?: string;
  newValue?: string;
};

export type CaseHospitalReferral = {
  hospital: string;
  referralDate: string;
  registrationStatus: string;
  hospitalCaseId: string;
  coordinator: string;
  quoteStatus: string;
  treatmentCost: number;
  expectedResponse: string;
  lastContact?: string;
  nextFollowUp?: string;
  responseTime?: string;
};

export type CaseHospitalQuote = {
  hospital: string;
  quotedCost: number;
  currency: string;
  estimatedStay: string;
  doctor: string;
  notes: string;
  quoteDate: string;
  status: string;
  validityDate?: string;
  responseDeadline?: string;
  coordinator?: string;
  patientDecision?: string;
};

export type CaseTask = {
  title: string;
  owner: string;
  dueDate: string;
  status: string;
};

export type CaseProfileRecord = {
  caseId: string;
  patientId: string;
  patientName: string;
  photoInitials: string;
  dateOfBirth: string;
  country: string;
  age: number;
  gender: string;
  preferredLanguage?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  passportStatus?: string;
  returningPatient?: boolean;
  vipFlag?: boolean;
  riskFlag?: string;
  leadSource?: string;
  referralPartner?: string;
  treatmentRequested: string;
  medicalCondition: string;
  destinationCountry: string;
  coordinator: string;
  priority: string;
  caseStatus: MasterCaseStatus;
  createdDate: string;
  expectedTravelDate: string;
  lastUpdated: string;
  primaryPartner: string;
  lifetimePartnerOwner: string;
  firstReferralDate: string;
  ownershipStatus: string;
  commissionOwner: string;
  adminOverrideReason: string;
  currentStep?: string;
  partnerTimeline: CaseTimelineItem[];
  medicalReview: {
    documentsReceived: string;
    medicalReviewStatus: string;
    medicalSummary: string;
    medicalReviewer: string;
    reviewDate: string;
    aiSummaryPlaceholder: string;
  };
  hospitalReferrals: CaseHospitalReferral[];
  hospitalQuotes: CaseHospitalQuote[];
  caseTimeline: CaseTimelineItem[];
  auditTrail: CaseAuditItem[];
  attachedFiles: Array<{
    type: string;
    name: string;
    date: string;
    category?: string;
    uploadDate?: string;
    ocrStatus?: string;
    aiExtracted?: boolean;
    verified?: boolean;
  }>;
  internalNotes: {
    coordinatorNotes: string;
    medicalNotes: string;
    administrativeNotes: string;
  };
  tasks: CaseTask[];
};
