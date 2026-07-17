import { querySupabaseTable } from "../lib/supabaseClient";
import type { LiveNetworkIntake, LivePartner } from "../types/partnerRecord";

export type PartnerServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const LIVE_PARTNER_FIELDS =
  "id,partner_code,name,country,type,status,acquisition_source,lifecycle_stage,created_at";
const LIVE_PARTNER_LIMIT = 100;

const LIVE_INTAKE_FIELDS =
  "id,partner_id,full_name,email,phone,country,city,organization_name,professional_title,applicant_category,years_experience,languages,target_countries,network_description,relevant_experience,motivation,linkedin,application_date,created_at";

function logPartnerServiceWarning(context: string, message: string) {
  console.warn(`[partnerService] ${context}: ${message}`);
}

export async function getLivePartners(): Promise<PartnerServiceResult<LivePartner[]>> {
  const result = await querySupabaseTable<LivePartner[]>("partners", {
    select: LIVE_PARTNER_FIELDS,
    order: "created_at.desc",
    limit: LIVE_PARTNER_LIMIT,
  });

  if (result.error) {
    logPartnerServiceWarning("getLivePartners", result.error);
    return { data: null, error: "Unable to load live partner records right now." };
  }

  return { data: result.data ?? [], error: null };
}

export async function getLivePartnerById(id: string): Promise<PartnerServiceResult<LivePartner>> {
  const result = await querySupabaseTable<LivePartner[]>("partners", {
    select: LIVE_PARTNER_FIELDS,
    id: `eq.${id}`,
    limit: 1,
  });

  if (result.error) {
    logPartnerServiceWarning("getLivePartnerById", result.error);
    return { data: null, error: "Unable to load this partner profile right now." };
  }

  return { data: result.data?.[0] ?? null, error: null };
}

export async function getPartnerNetworkIntakeByPartnerId(
  partnerId: string,
): Promise<PartnerServiceResult<LiveNetworkIntake>> {
  const result = await querySupabaseTable<LiveNetworkIntake[]>("partner_network_intake", {
    select: LIVE_INTAKE_FIELDS,
    partner_id: `eq.${partnerId}`,
    limit: 1,
  });

  if (result.error) {
    logPartnerServiceWarning("getPartnerNetworkIntakeByPartnerId", result.error);
    return { data: null, error: "Unable to load transferred application details right now." };
  }

  return { data: result.data?.[0] ?? null, error: null };
}
