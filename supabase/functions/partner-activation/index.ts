import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Partner-triggered: called by the authenticated partner from
// /partner/activate. Three actions:
//  - "get_profile" returns the allowlisted read model for the activation
//               page (partner, intake, onboarding_profile, auth_link).
//  - "touch"    marks the partner's activation link active on first login.
//  - "complete" saves the missing onboarding fields and marks
//               partners.lifecycle_stage = 'profile_completed'.
// Every read and write is scoped to the caller's own linked partner_id,
// resolved server-side from partner_auth_links -- never trusted from the
// request body. This is the only entry point a partner-portal session ever
// reads or writes partner data through: there is no partner-facing
// PostgREST policy on any table.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ENTITY_TYPES = ['individual', 'organization'] as const;
const COMMUNICATION_METHODS = ['email', 'phone', 'whatsapp'] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!callerToken) {
      return json({ error: 'Missing Authorization bearer token' }, 401);
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser(callerToken);
    if (callerError || !callerData?.user) {
      return json({ error: 'invalid_session', message: 'Your session is invalid or has expired.' }, 401);
    }

    const callerAppMetadata = (callerData.user.app_metadata ?? {}) as Record<string, unknown>;
    if (callerAppMetadata.partner_portal !== true) {
      return json({ error: 'Forbidden' }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }

    const action = body.action;
    if (action !== 'get_profile' && action !== 'touch' && action !== 'complete') {
      return json({ error: 'Invalid action' }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve the caller's own link server-side. The partner_id in
    // app_metadata is never trusted on its own -- it must match a live
    // partner_auth_links row for this exact auth user.
    const { data: link, error: linkErr } = await adminClient
      .from('partner_auth_links')
      .select('id, partner_id, organization_id, status, invited_at, activated_at')
      .eq('auth_user_id', callerData.user.id)
      .maybeSingle();

    if (linkErr) {
      console.error('auth link lookup error:', linkErr);
      return json({ error: 'Failed to load activation link' }, 500);
    }
    if (!link) {
      return json({ error: 'invalid_session', message: 'No activation link found for this account.' }, 404);
    }
    if (link.status === 'revoked') {
      return json({ error: 'invite_revoked', message: 'This activation invite has been revoked.' }, 403);
    }

    const { data: partner, error: partnerErr } = await adminClient
      .from('partners')
      .select('id, partner_code, name, country, type, status, lifecycle_stage')
      .eq('id', link.partner_id)
      .maybeSingle();

    if (partnerErr || !partner) {
      console.error('partner lookup error:', partnerErr);
      return json({ error: 'Failed to load partner' }, 500);
    }

    if (action === 'get_profile') {
      const { data: intake, error: intakeErr } = await adminClient
        .from('partner_network_intake')
        .select(
          'full_name, email, phone, country, city, organization_name, professional_title, applicant_category, years_experience, languages, target_countries, network_description, relevant_experience, motivation, linkedin',
        )
        .eq('partner_id', partner.id)
        .maybeSingle();
      if (intakeErr) {
        console.error('intake lookup error:', intakeErr);
        return json({ error: 'Failed to load application details' }, 500);
      }

      const { data: onboardingProfile, error: onboardingErr } = await adminClient
        .from('partner_onboarding_profiles')
        .select(
          'legal_full_name, legal_address, entity_type, authorized_representative_name, preferred_communication_method, completed_at',
        )
        .eq('partner_id', partner.id)
        .maybeSingle();
      if (onboardingErr) {
        console.error('onboarding profile lookup error:', onboardingErr);
        return json({ error: 'Failed to load onboarding profile' }, 500);
      }

      return json({
        partner: {
          id: partner.id,
          partner_code: partner.partner_code,
          name: partner.name,
          country: partner.country,
          type: partner.type,
          status: partner.status,
          lifecycle_stage: partner.lifecycle_stage,
        },
        intake: intake ?? null,
        onboarding_profile: onboardingProfile ?? null,
        auth_link: {
          status: link.status,
          invited_at: link.invited_at,
          activated_at: link.activated_at,
        },
      });
    }

    if (action === 'touch') {
      if (link.status === 'invited') {
        const { error: touchErr } = await adminClient
          .from('partner_auth_links')
          .update({ status: 'active', activated_at: new Date().toISOString() })
          .eq('id', link.id);
        if (touchErr) {
          console.error('partner_auth_links touch error:', touchErr);
          return json({ error: 'Failed to record activation' }, 500);
        }
      }

      return json({
        success: true,
        lifecycle_stage: partner.lifecycle_stage,
        already_completed: partner.lifecycle_stage === 'profile_completed',
      });
    }

    // action === 'complete'
    if (partner.lifecycle_stage === 'profile_completed') {
      return json(
        { error: 'already_completed', message: 'This partner profile has already been completed.' },
        409,
      );
    }

    const legalFullName = body.legal_full_name;
    const legalAddress = body.legal_address;
    const entityType = body.entity_type;
    const authorizedRepresentativeName = body.authorized_representative_name;
    const preferredCommunicationMethod = body.preferred_communication_method;

    if (!isNonEmptyString(legalFullName)) {
      return json({ error: 'legal_full_name is required' }, 400);
    }
    if (!isNonEmptyString(legalAddress)) {
      return json({ error: 'legal_address is required' }, 400);
    }
    if (!ENTITY_TYPES.includes(entityType as (typeof ENTITY_TYPES)[number])) {
      return json({ error: 'entity_type must be individual or organization' }, 400);
    }
    if (
      entityType === 'organization' &&
      !isNonEmptyString(authorizedRepresentativeName)
    ) {
      return json({ error: 'authorized_representative_name is required for organization partners' }, 400);
    }
    if (
      !COMMUNICATION_METHODS.includes(
        preferredCommunicationMethod as (typeof COMMUNICATION_METHODS)[number],
      )
    ) {
      return json({ error: 'preferred_communication_method must be email, phone, or whatsapp' }, 400);
    }

    const { error: upsertErr } = await adminClient.from('partner_onboarding_profiles').upsert(
      {
        organization_id: link.organization_id,
        partner_id: partner.id,
        legal_full_name: legalFullName,
        legal_address: legalAddress,
        entity_type: entityType,
        authorized_representative_name:
          entityType === 'organization' ? authorizedRepresentativeName : null,
        preferred_communication_method: preferredCommunicationMethod,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'partner_id' },
    );
    if (upsertErr) {
      console.error('partner_onboarding_profiles upsert error:', upsertErr);
      return json({ error: 'Failed to save onboarding profile' }, 500);
    }

    // status is intentionally left untouched -- it stays 'prospect' until a
    // later, separate contract-signing phase.
    const { error: lifecycleErr } = await adminClient
      .from('partners')
      .update({ lifecycle_stage: 'profile_completed' })
      .eq('id', partner.id);
    if (lifecycleErr) {
      console.error('partners lifecycle update error:', lifecycleErr);
      return json({ error: 'Failed to update partner lifecycle stage' }, 500);
    }

    await adminClient
      .from('partner_auth_links')
      .update({ status: 'active', activated_at: new Date().toISOString() })
      .eq('id', link.id);

    return json({ success: true, lifecycle_stage: 'profile_completed' });
  } catch (error) {
    console.error('Error in partner-activation:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
