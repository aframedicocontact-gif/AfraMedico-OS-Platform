import { callSupabaseFunction } from "../lib/supabaseClient";

export type PartnerAgreementAdminResult<T> = { data: T | null; error: string | null };

type StrokePoint = { x: number; y: number; t: number };

function logPartnerAgreementAdminWarning(context: string, message: string) {
  console.warn(`[partnerAgreementAdminService] ${context}: ${message}`);
}

export type PartnerAgreementAdminAgreement = {
  id: string;
  template_version: string;
  status: string;
  issued_at: string;
  signer_name: string | null;
  signer_title: string | null;
  partner_signed_at: string | null;
  company_signer_name: string | null;
  company_signer_title: string | null;
  company_signed_at: string | null;
  fully_executed_at: string | null;
  commission_rate: number;
  agreement_text: string;
  has_final_pdf: boolean;
  final_pdf_email_status: string;
};

export type GetPartnerAgreementForAdminResponse = {
  partner: { id: string; partner_code: string; name: string; status: string; lifecycle_stage: string | null };
  agreement: PartnerAgreementAdminAgreement;
  admin_full_name: string | null;
};

export async function getPartnerAgreementForAdmin(
  partnerId: string,
): Promise<PartnerAgreementAdminResult<GetPartnerAgreementForAdminResponse>> {
  const result = await callSupabaseFunction<GetPartnerAgreementForAdminResponse>(
    "partner-agreement-admin",
    { action: "get_agreement", partner_id: partnerId },
  );

  if (result.error) {
    logPartnerAgreementAdminWarning("getPartnerAgreementForAdmin", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

export type CountersignPartnerAgreementResponse = {
  success: boolean;
  agreement: { id: string; status: string; fully_executed_at: string | null; has_final_pdf: boolean };
  pdf_generated_now: boolean;
  email_status: string;
};

export async function countersignPartnerAgreement(input: {
  partner_id: string;
  signer_title: string;
  signature_strokes: StrokePoint[][];
}): Promise<PartnerAgreementAdminResult<CountersignPartnerAgreementResponse>> {
  const result = await callSupabaseFunction<CountersignPartnerAgreementResponse>(
    "partner-agreement-admin",
    { action: "countersign_agreement", ...input },
  );

  if (result.error) {
    logPartnerAgreementAdminWarning("countersignPartnerAgreement", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

export async function resendPartnerAgreementEmail(
  partnerId: string,
): Promise<PartnerAgreementAdminResult<{ success: boolean; email_status: string }>> {
  const result = await callSupabaseFunction<{ success: boolean; email_status: string }>(
    "partner-agreement-admin",
    { action: "resend_email", partner_id: partnerId },
  );

  if (result.error) {
    logPartnerAgreementAdminWarning("resendPartnerAgreementEmail", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

export type GenerateCorrectedAgreementPdfResponse = {
  success: boolean;
  artifact: { id: string; storage_path: string; sha256: string; renderer_version: string; generated_at: string };
};

export async function generateCorrectedAgreementPdf(
  partnerId: string,
): Promise<PartnerAgreementAdminResult<GenerateCorrectedAgreementPdfResponse>> {
  const result = await callSupabaseFunction<GenerateCorrectedAgreementPdfResponse>(
    "partner-agreement-admin",
    { action: "generate_corrected_pdf", partner_id: partnerId },
  );

  if (result.error) {
    logPartnerAgreementAdminWarning("generateCorrectedAgreementPdf", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

export async function sendCorrectedAgreementPdf(
  partnerId: string,
): Promise<PartnerAgreementAdminResult<{ success: boolean; email_status: string }>> {
  const result = await callSupabaseFunction<{ success: boolean; email_status: string }>(
    "partner-agreement-admin",
    { action: "send_corrected_pdf", partner_id: partnerId },
  );

  if (result.error) {
    logPartnerAgreementAdminWarning("sendCorrectedAgreementPdf", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

export async function getPartnerAgreementAdminDownloadUrl(
  partnerId: string,
): Promise<PartnerAgreementAdminResult<{ success: boolean; url: string; expires_in: number }>> {
  const result = await callSupabaseFunction<{ success: boolean; url: string; expires_in: number }>(
    "partner-agreement-admin",
    { action: "get_download_url", partner_id: partnerId },
  );

  if (result.error) {
    logPartnerAgreementAdminWarning("getPartnerAgreementAdminDownloadUrl", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}
