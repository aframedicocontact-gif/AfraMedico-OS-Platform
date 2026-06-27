export type ProviderType =
  | "Hospital Group"
  | "Hospital Branch"
  | "Department"
  | "Treatment Program"
  | "Physician"
  | "International Office"
  | "Regional Coordinator"
  | "Financial Office"
  | "Imaging Center"
  | "IVF Center"
  | "Rehab Center"
  | "Air Ambulance Provider"
  | "Hotel Partner"
  | "Other";

export type EvidenceSource =
  | "Hospital Referral"
  | "Medical Review"
  | "MSO Request"
  | "MSO Response"
  | "Quote"
  | "Treatment Outcome"
  | "Coordinator Note"
  | "Patient Feedback"
  | "Commission Experience";

export type ProviderOrganization = {
  id: string;
  name: string;
  type: ProviderType;
  country: string;
  city: string;
  treatmentAreas: string[];
  primaryContact: string;
  dataCompleteness: number;
  lightweight: boolean;
  dataGrowthNote: string;
  activeCases: number;
  completedCases: number;
  linkedCases: string[];
};

export type HospitalBranch = {
  id: string;
  providerId: string;
  name: string;
  city: string;
  country: string;
  strengths: string[];
  linkedCases: string[];
};

export type ProviderDepartment = {
  id: string;
  providerId: string;
  branchId: string;
  name: string;
  specialty: string;
  linkedCases: string[];
};

export type TreatmentProgram = {
  id: string;
  providerId: string;
  branchId: string;
  departmentId: string;
  name: string;
  treatmentArea: string;
  evidenceCount: number;
  linkedCases: string[];
};

export type Physician = {
  id: string;
  providerId: string;
  branchId: string;
  departmentId: string;
  programId: string;
  name: string;
  specialty: string;
  languages: string[];
  linkedCases: string[];
};

export type CoordinatorContact = {
  id: string;
  providerId: string;
  name: string;
  role: string;
  office: string;
  languages: string[];
  reliability: number;
  linkedCases: string[];
};

export type RegionalContact = {
  id: string;
  providerId: string;
  name: string;
  region: string;
  countriesCovered: string[];
  languages: string[];
  responsiveness: number;
  linkedCases: string[];
};

export type ProviderPerformanceRecord = {
  providerId: string;
  averageMsoResponseTime: string;
  averageQuoteResponseTime: string;
  averageSurgerySchedulingTime: string;
  averageAdmissionTime: string;
  acceptanceRate: number;
  caseSuccessRate: number;
  casesCompleted: number;
  specialtyStrength: string;
  regionalResponsiveness: number;
  coordinatorResponsiveness: number;
  coordinatorReliability: number;
  patientSatisfaction: number;
  commissionReliability: number;
  clinicalCommunication: number;
  followUpQuality: number;
  treatmentStrength: number;
  evidenceCases: string[];
};

export type ProviderRelationshipNote = {
  id: string;
  providerId: string;
  date: string;
  author: string;
  source: EvidenceSource;
  linkedCase: string;
  note: string;
};

export type CaseLinkedProviderIntelligence = {
  id: string;
  providerId: string;
  caseId: string;
  patientName: string;
  treatment: string;
  evidenceSource: EvidenceSource;
  eventDate: string;
  referralStatus: string;
  msoStatus: string;
  quoteStatus: string;
  treatmentOutcome: string;
  coordinatorNote: string;
};

export type ProviderRelationshipActivity = {
  id: string;
  providerId: string;
  date: string;
  type:
    | "Visit"
    | "Meeting"
    | "Email"
    | "Conference Meeting"
    | "Contract"
    | "Operational Note"
    | "Important Conversation";
  owner: string;
  summary: string;
  relationshipScore: number;
  linkedCase: string;
};

export type HpnData = {
  providerOrganizations: ProviderOrganization[];
  hospitalBranches: HospitalBranch[];
  departments: ProviderDepartment[];
  treatmentPrograms: TreatmentProgram[];
  physicians: Physician[];
  coordinators: CoordinatorContact[];
  regionalContacts: RegionalContact[];
  performanceRecords: ProviderPerformanceRecord[];
  relationshipNotes: ProviderRelationshipNote[];
  relationshipActivities: ProviderRelationshipActivity[];
  caseLinkedIntelligence: CaseLinkedProviderIntelligence[];
};
