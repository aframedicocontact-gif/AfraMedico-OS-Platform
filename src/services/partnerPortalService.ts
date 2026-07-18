import { callSupabaseFunction } from "../lib/supabaseClient";
import type { PartnerPortalDashboard } from "../types/partnerRecord";

type Result<T> = { data: T | null; error: string | null };

export async function getPartnerDashboard(): Promise<Result<PartnerPortalDashboard>> {
  const result = await callSupabaseFunction<PartnerPortalDashboard>("partner-portal", {
    action: "get_dashboard",
  });
  return { data: result.data, error: result.error };
}

export async function signPartnerAgreement(input: {
  signer_name: string;
  signer_title: string;
  accepted_agreement: boolean;
  accepted_electronic_signature: boolean;
  accepted_privacy: boolean;
}): Promise<Result<{ success: boolean; already_signed: boolean; lifecycle_stage: string }>> {
  const result = await callSupabaseFunction<{
    success: boolean;
    already_signed: boolean;
    lifecycle_stage: string;
  }>("partner-portal", { action: "sign_agreement", ...input });
  return { data: result.data, error: result.error };
}

type StrokePoint = { x: number; y: number; t: number };

export async function signPartnerAgreementV2(input: {
  signature_strokes: StrokePoint[][];
  accepted_agreement: boolean;
  accepted_electronic_signature: boolean;
  accepted_privacy: boolean;
}): Promise<Result<{ success: boolean; already_signed: boolean; status: string }>> {
  const result = await callSupabaseFunction<{
    success: boolean;
    already_signed: boolean;
    status: string;
  }>("partner-portal", { action: "sign_agreement_v2", ...input });
  return { data: result.data, error: result.error };
}

export async function getPartnerAgreementDownloadUrl(
  agreement_id: string,
): Promise<Result<{ success: boolean; url: string; expires_in: number }>> {
  const result = await callSupabaseFunction<{ success: boolean; url: string; expires_in: number }>(
    "partner-portal",
    { action: "get_download_url", agreement_id },
  );
  return { data: result.data, error: result.error };
}

export async function submitPartnerPatientReferral(input: {
  patient_full_name: string;
  patient_email: string;
  patient_phone: string;
  patient_country: string;
  requested_treatment: string;
  medical_summary: string;
  initial_records_ready: boolean;
  patient_consent_confirmed: boolean;
}): Promise<Result<{ success: boolean; referral: { id: string; referral_code: string; referral_status: string; submitted_at: string } }>> {
  const result = await callSupabaseFunction<{
    success: boolean;
    referral: { id: string; referral_code: string; referral_status: string; submitted_at: string };
  }>("partner-portal", { action: "submit_referral", ...input });
  return { data: result.data, error: result.error };
}
