export type MedicalReviewStatus =
  | "Pending"
  | "Under Review"
  | "Waiting for Documents"
  | "Ready for Referral"
  | "Completed";

export type MedicalReviewPriority = "Low" | "Medium" | "High" | "Urgent";

export type DocumentStatus = "Received" | "Missing" | "Requested";

export type ReviewOutcome =
  | "Ready for Hospital Referral"
  | "Need More Documents"
  | "Rejected"
  | "Emergency";

export type MedicalDocument = {
  category: string;
  fileName: string;
  uploadDate: string;
  status: DocumentStatus;
};

export type MissingDocument = {
  item: string;
  status: DocumentStatus;
};

export type HospitalRecommendation = {
  hospital: string;
  reason: string;
  priority: MedicalReviewPriority;
};

export type MedicalReviewTimelineItem = {
  date: string;
  time: string;
  user: string;
  action: string;
  evidence: string;
  notes: string;
};

export type MedicalReviewRecord = {
  id: string;
  caseId: string;
  patientId: string;
  patientName: string;
  country: string;
  age: number;
  gender: string;
  treatment: string;
  priority: MedicalReviewPriority;
  assignedReviewer: string;
  coordinator: string;
  submissionDate: string;
  status: MedicalReviewStatus;
  reviewTimeHours: number;
  patientSummary: string;
  caseSummary: string;
  diagnosis: string;
  chiefComplaint: string;
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
  vitalInformation: string;
  documents: MedicalDocument[];
  aiSummary: {
    keyFindings: string[];
    possibleDiagnosis: string;
    redFlags: string[];
    missingInformation: string[];
    suggestedQuestions: string[];
  };
  missingDocuments: MissingDocument[];
  clinicalRecommendation: {
    suggestedTreatment: string;
    suggestedSpecialty: string;
    urgency: MedicalReviewPriority;
    estimatedTimeline: string;
  };
  destinationRecommendation: {
    recommendedCountries: string[];
    reason: string;
  };
  hospitalRecommendations: HospitalRecommendation[];
  outcome: ReviewOutcome;
  timeline: MedicalReviewTimelineItem[];
  internalNotes: {
    reviewerNotes: string;
    coordinatorNotes: string;
    managerNotes: string;
  };
};
