import { querySupabaseTable } from "../lib/supabaseClient";
import type { LivePartner } from "../types/partnerRecord";

export type PartnerServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const LIVE_PARTNER_FIELDS =
  "id,partner_code,name,country,type,status,acquisition_source,lifecycle_stage,created_at";
const LIVE_PARTNER_LIMIT = 100;

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
