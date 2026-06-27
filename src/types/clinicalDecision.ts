export type ClinicalStatus =
  | "Documents Incomplete"
  | "Waiting for Documents"
  | "AI Draft Generated"
  | "Internal Review Required"
  | "Preliminary Opinion Approved"
  | "Preliminary Opinion Sent"
  | "Ready for Hospital Submission"
  | "Hospital Review Requested"
  | "Hospital Opinion Received"
  | "Final Recommendation Sent"
  | "Not Recommended for Travel"
  | "Emergency Escalation";

export type ClinicalPriority = "Low" | "Medium" | "High" | "Urgent";
export type UrgencyLevel = "Routine" | "Soon" | "Urgent" | "Emergency";
export type ChecklistStatus = "Received" | "Missing" | "Requested" | "Not Applicable";
export type AiDraftStatus = "Not Generated" | "Generated" | "Corrected" | "Approved" | "Returned for Revision";
export type InternalReviewStatus = "Not Started" | "Required" | "In Review" | "Approved" | "Returned";

export type ClinicalChecklistItem = {
  category: string;
  item: string;
  status: ChecklistStatus;
  lastRequestedDate: string;
  requestRecipient: string;
  copiedPartner: boolean;
  notes: string;
};

export type ClinicalTimelineItem = {
  timestamp: string;
  user: string;
  action: string;
  evidence: string;
  notes: string;
};

export type ClinicalAuditItem = {
  timestamp: string;
  user: string;
  action: string;
  oldValue: string;
  newValue: string;
  reason: string;
  evidence: string;
};

export type HospitalMsoRecord = {
  hospital: string;
  hospitalReferralId: string;
  hospitalCaseId: string;
  specialist: string;
  submissionDate: string;
  responseDeadline: string;
  msoStatus: string;
  treatmentPlanReceived: boolean;
  estimatedCostReceived: boolean;
  lengthOfStay: string;
  quoteId: string;
  nextFollowUp: string;
  status: string;
};

export type ClinicalReviewRecord = {
  id: string;
  caseId: string;
  patientId: string;
  patientName: string;
  country: string;
  treatmentRequested: string;
  specialty: string;
  priority: ClinicalPriority;
  urgency: UrgencyLevel;
  assignedReviewer: string;
  clinicalLead: string;
  submittedDate: string;
  slaDeadline: string;
  status: ClinicalStatus;
  documentStatus: string;
  aiDraftStatus: AiDraftStatus;
  internalReviewStatus: InternalReviewStatus;
  reviewTimeHours: number;
  communication: {
    patientNotified: boolean;
    familyNotified: boolean;
    partnerCopied: boolean;
    hospitalContacted: boolean;
    internalReviewerAssigned: boolean;
    clinicalLeadApproved: boolean;
  };
  clinicalProfile: {
    patientSummary: string;
    caseSummary: string;
    medicalProblem: string;
    chiefComplaint: string;
    diagnosis: string;
    medicalHistory: string;
    currentTreatment: string;
    medications: string;
    allergies: string;
    comorbidities: string;
    functionalStatus: string;
    travelFitness: string;
  };
  checklist: ClinicalChecklistItem[];
  preliminaryOpinion: {
    aiDraftSummary: string;
    keyFindings: string[];
    possibleDiagnosis: string;
    redFlags: string[];
    missingInformation: string[];
    suggestedQuestions: string[];
    travelSuitability: string;
    localTreatmentRecommendation: string;
    emergencyRecommendation: string;
    clinicalLeadReview: string;
    correctionNotes: string;
    approvalStatus: string;
    patientFacingOpinion: string;
    disclaimer: string;
  };
  hospitalPackage: {
    medicalSummary: string;
    clinicalCaseSummary: string;
    caseBrief: string;
    documentsIncluded: string[];
    clinicalQuestions: string[];
    requestedSpecialistReview: string;
    requestedTreatmentPlan: string;
    requestedEstimatedCost: string;
    requestedLengthOfStay: string;
    urgency: UrgencyLevel;
    notesToHospital: string;
    selectedHospitals: string[];
    submissionStatus: string;
  };
  msoTracker: HospitalMsoRecord[];
  timeline: ClinicalTimelineItem[];
  auditTrail: ClinicalAuditItem[];
};
