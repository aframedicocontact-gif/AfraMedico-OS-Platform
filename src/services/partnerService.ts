import { callSupabaseFunction, querySupabaseTable } from "../lib/supabaseClient";
import type { LiveNetworkIntake, LivePartner, PartnerAuthLink } from "../types/partnerRecord";

export type PartnerServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const LIVE_PARTNER_FIELDS =
  "id,partner_code,name,country,type,status,acquisition_source,lifecycle_stage,created_at";
const LIVE_PARTNER_LIMIT = 100;

const LIVE_INTAKE_FIELDS =
  "id,partner_id,full_name,email,phone,country,city,organization_name,professional_title,applicant_category,years_experience,languages,target_countries,network_description,relevant_experience,motivation,linkedin,application_date,created_at";

const PARTNER_AUTH_LINK_FIELDS = "id,partner_id,status,invited_at,activated_at";

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

// Admin-only: shows whether a "Send Activation Invite" action has already
// been used for this partner, so the button can switch to a resend affordance.
export async function getPartnerAuthLinkByPartnerId(
  partnerId: string,
): Promise<PartnerServiceResult<PartnerAuthLink>> {
  const result = await querySupabaseTable<PartnerAuthLink[]>("partner_auth_links", {
    select: PARTNER_AUTH_LINK_FIELDS,
    partner_id: `eq.${partnerId}`,
    limit: 1,
  });

  if (result.error) {
    logPartnerServiceWarning("getPartnerAuthLinkByPartnerId", result.error);
    return { data: null, error: "Unable to load activation status right now." };
  }

  return { data: result.data?.[0] ?? null, error: null };
}

// Admin-only: triggers the native Supabase invite/magic-link email for an
// approved_activation_pending live partner. Calls the
// send-partner-activation-invite Edge Function, which enforces eligibility
// and idempotency server-side.
export type SendPartnerActivationInviteResponse = {
  success: boolean;
  partner_id: string;
  already_invited: boolean;
  message: string;
};

export async function sendPartnerActivationInvite(
  partnerId: string,
): Promise<PartnerServiceResult<SendPartnerActivationInviteResponse>> {
  const result = await callSupabaseFunction<SendPartnerActivationInviteResponse>(
    "send-partner-activation-invite",
    { partner_id: partnerId },
  );

  if (result.error) {
    logPartnerServiceWarning("sendPartnerActivationInvite", result.error);
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}
