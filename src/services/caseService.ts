import { querySupabaseTable } from "../lib/supabaseClient";

export type CaseRecord = {
  id: string;
  organization_id: string;
  patient_id: string;
  case_code: string;
  treatment: string | null;
  specialty: string | null;
  country: string | null;
  status: string;
  priority: string;
  urgency: string;
  current_stage: string | null;
  current_owner_id: string | null;
  current_department: string | null;
  created_at: string;
  updated_at: string;
};

export async function listCases(limit = 20) {
  return querySupabaseTable<CaseRecord[]>("cases", {
    select: "*",
    limit,
    order: "created_at.desc",
  });
}

export async function getCaseById(id: string) {
  return querySupabaseTable<CaseRecord[]>("cases", {
    select: "*",
    id: `eq.${id}`,
    limit: 1,
  });
}
