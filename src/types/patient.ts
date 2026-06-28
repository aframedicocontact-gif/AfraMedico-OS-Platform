export type PatientStatus = "active" | "inactive" | "archived" | "prospect";

export type PatientGender = "female" | "male" | "other" | "unknown";

export type Patient = {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: PatientGender;
  country: string | null;
  phone: string | null;
  email: string | null;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
};

export type CreatePatientInput = {
  organization_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender?: PatientGender;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: PatientStatus;
};

export type UpdatePatientInput = Partial<Omit<CreatePatientInput, "organization_id">>;

export type BackendPatientRow = {
  id: string;
  organization_id: string;
  patient_code?: string;
  full_name?: string;
  country: string | null;
  phone: string | null;
  email: string | null;
  whatsapp?: string | null;
  preferred_language?: string | null;
  created_at: string;
  updated_at: string;
};
