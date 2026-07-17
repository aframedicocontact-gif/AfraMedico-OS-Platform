import { callSupabaseFunction } from "../lib/supabaseClient";
import type {
  PartnerActivationProfile,
  PartnerCommunicationMethod,
  PartnerEntityType,
} from "../types/partnerRecord";

export type PartnerActivationServiceResult<T> = {
  data: T | null;
  error: string | null;
};

function logWarning(context: string, message: string) {
  console.warn(`[partnerActivationService] ${context}: ${message}`);
}

// The only read path a partner-portal session uses. There is no
// partner-facing PostgREST policy on any table -- every field here comes
// from the partner-activation Edge Function's allowlisted get_profile
// action, resolved server-side from the caller's own linked partner_id.
export async function getOwnActivationProfile(): Promise<
  PartnerActivationServiceResult<PartnerActivationProfile>
> {
  const result = await callSupabaseFunction<PartnerActivationProfile>("partner-activation", {
    action: "get_profile",
  });

  if (result.error) {
    logWarning("getOwnActivationProfile", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

// Marks the activation link active on first login. Safe to call every time
// the page loads: the Edge Function only writes when status is still
// "invited".
export async function touchPartnerActivation(): Promise<
  PartnerActivationServiceResult<{ success: boolean; lifecycle_stage: string; already_completed: boolean }>
> {
  const result = await callSupabaseFunction<{
    success: boolean;
    lifecycle_stage: string;
    already_completed: boolean;
  }>("partner-activation", { action: "touch" });

  if (result.error) {
    logWarning("touchPartnerActivation", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

export type CompletePartnerActivationProfileInput = {
  legal_full_name: string;
  legal_address: string;
  entity_type: PartnerEntityType;
  authorized_representative_name: string | null;
  preferred_communication_method: PartnerCommunicationMethod;
};

export async function completePartnerActivationProfile(
  input: CompletePartnerActivationProfileInput,
): Promise<PartnerActivationServiceResult<{ success: boolean; lifecycle_stage: string }>> {
  const result = await callSupabaseFunction<{ success: boolean; lifecycle_stage: string }>(
    "partner-activation",
    { action: "complete", ...input },
  );

  if (result.error) {
    logWarning("completePartnerActivationProfile", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}
