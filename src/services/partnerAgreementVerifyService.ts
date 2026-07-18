import { callSupabaseFunction } from "../lib/supabaseClient";

type Result<T> = { data: T | null; error: string | null };

export type PartnerAgreementVerification = {
  found: true;
  status: "valid" | "void" | "superseded";
  contract_id: string | null;
  agreement_version: string;
  execution_date: string | null;
  partner_organization_name: string | null;
  aframedico_organization_name: string;
  final_pdf_sha256: string | null;
};

export async function verifyPartnerAgreement(code: string): Promise<Result<PartnerAgreementVerification>> {
  const result = await callSupabaseFunction<PartnerAgreementVerification>("verify-agreement", { code });

  if (result.status === 404) {
    return { data: null, error: "not_found" };
  }
  if (result.error || !result.data) {
    return { data: null, error: result.error || "Unable to verify this code right now." };
  }

  return { data: result.data, error: null };
}
