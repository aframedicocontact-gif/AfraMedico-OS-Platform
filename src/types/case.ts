export type CaseStatus =
  | "new"
  | "active"
  | "waiting_documents"
  | "waiting_quotes"
  | "treatment_approved"
  | "travel_planned"
  | "under_treatment"
  | "recovery"
  | "closed"
  | "reopened"
  | "lost";

export type CasePriority = "critical" | "high" | "medium" | "low";

export type CaseUrgency = "emergency" | "urgent" | "standard" | "future";

export type PatientCase = {
  id: string;
  organization_id: string;
  patient_id: string;
  case_code: string;
  treatment: string | null;
  specialty: string | null;
  country: string | null;
  status: CaseStatus;
  priority: CasePriority;
  urgency: CaseUrgency;
  current_stage: string | null;
  current_owner_id: string | null;
  current_department: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateCaseInput = {
  organization_id: string;
  patient_id: string;
  case_code: string;
  treatment?: string | null;
  specialty?: string | null;
  country?: string | null;
  status?: CaseStatus;
  priority?: CasePriority;
  urgency?: CaseUrgency;
  current_stage?: string | null;
  current_owner_id?: string | null;
  current_department?: string | null;
};

export type UpdateCaseInput = Partial<Omit<CreateCaseInput, "organization_id" | "patient_id">>;
