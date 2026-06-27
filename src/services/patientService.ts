import { querySupabaseTable } from "../lib/supabaseClient";

export type PatientRecord = {
  id: string;
  organization_id: string;
  patient_code: string;
  full_name: string;
  country: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  preferred_language: string | null;
  created_at: string;
  updated_at: string;
};

export async function listPatients(limit = 20) {
  return querySupabaseTable<PatientRecord[]>("patients", {
    select: "*",
    limit,
    order: "created_at.desc",
  });
}

export async function getPatientById(id: string) {
  return querySupabaseTable<PatientRecord[]>("patients", {
    select: "*",
    id: `eq.${id}`,
    limit: 1,
  });
}
