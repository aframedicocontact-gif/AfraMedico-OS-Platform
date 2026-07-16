import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-integration-secret, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Server-to-server only. Set as an Edge Function secret on this project; the
// same value is set (also as an Edge Function secret, never a VITE_*
// variable) on the Network Platform project's os-partner-transfer function.
const OS_TRANSFER_SHARED_SECRET = Deno.env.get('OS_TRANSFER_SHARED_SECRET');

// The Growth OS organization new Network-sourced partners are attached to.
// Phase 1A has no concept of "which org does this partner belong to" coming
// from the Network side, so this is pinned via config rather than accepted
// from the caller.
const GROWTH_OS_DEFAULT_ORGANIZATION_ID = Deno.env.get('GROWTH_OS_DEFAULT_ORGANIZATION_ID');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidUUID(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

// Constant-time comparison: always walks a fixed minimum length and never
// short-circuits on the first differing byte, so a wrong secret can't be
// distinguished by response timing.
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const len = Math.max(aBytes.length, bBytes.length, 32);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function asNullableString(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

function asNullableStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const arr = v.filter((item): item is string => typeof item === 'string');
  return arr.length > 0 ? arr : null;
}

function asNullableInteger(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : null;
}

function makePartnerCode(sourceApplicationId: string): string {
  return `NET-${sourceApplicationId.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    if (!OS_TRANSFER_SHARED_SECRET) {
      console.error('OS_TRANSFER_SHARED_SECRET is not configured');
      return json({ error: 'Integration is not configured on this project' }, 500);
    }
    if (!GROWTH_OS_DEFAULT_ORGANIZATION_ID || !isValidUUID(GROWTH_OS_DEFAULT_ORGANIZATION_ID)) {
      console.error('GROWTH_OS_DEFAULT_ORGANIZATION_ID is not configured or invalid');
      return json({ error: 'Integration is not configured on this project' }, 500);
    }

    const providedSecret = req.headers.get('x-integration-secret') ?? '';
    if (!timingSafeEqual(providedSecret, OS_TRANSFER_SHARED_SECRET)) {
      return json({ error: 'Unauthorized' }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }

    const sourceApplicationId = body.source_application_id;
    if (!isValidUUID(sourceApplicationId)) {
      return json({ error: 'Invalid source_application_id' }, 400);
    }
    if (!isNonEmptyString(body.full_name) || !isNonEmptyString(body.email)) {
      return json({ error: 'full_name and email are required' }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Idempotency fast path: a prior successful call (or a retry after the
    // Network side lost the response) returns the same partner every time.
    const { data: existingIntake, error: existingErr } = await adminClient
      .from('partner_network_intake')
      .select('partner_id')
      .eq('source_application_id', sourceApplicationId)
      .maybeSingle();

    if (existingErr) {
      console.error('lookup error:', existingErr);
      return json({ error: 'Failed to check existing intake record' }, 500);
    }
    if (existingIntake) {
      return json({ success: true, partner_id: existingIntake.partner_id, already_existed: true });
    }

    const applicationDate = typeof body.application_date === 'string' ? body.application_date : null;

    const { data: newPartner, error: partnerErr } = await adminClient
      .from('partners')
      .insert({
        organization_id: GROWTH_OS_DEFAULT_ORGANIZATION_ID,
        partner_code: makePartnerCode(sourceApplicationId),
        name: asNullableString(body.organization_name) ?? (body.full_name as string),
        type: asNullableString(body.applicant_category),
        country: asNullableString(body.country),
        // A website applicant enters the same lifecycle as any other
        // prospect, not as an already-active partner. 'prospect' is the
        // existing partners.status value closest to that; acquisition_source
        // and lifecycle_stage track this intake path specifically.
        status: 'prospect',
        acquisition_source: 'website_application',
        lifecycle_stage: 'approved_activation_pending',
      })
      .select('id')
      .single();

    if (partnerErr || !newPartner) {
      console.error('partner insert error:', partnerErr);
      return json({ error: 'Failed to create partner' }, 500);
    }

    const { error: intakeErr } = await adminClient
      .from('partner_network_intake')
      .insert({
        organization_id: GROWTH_OS_DEFAULT_ORGANIZATION_ID,
        partner_id: newPartner.id,
        source_application_id: sourceApplicationId,
        full_name: body.full_name,
        email: body.email,
        phone: asNullableString(body.phone),
        country: asNullableString(body.country),
        city: asNullableString(body.city),
        organization_name: asNullableString(body.organization_name),
        professional_title: asNullableString(body.professional_title),
        applicant_category: asNullableString(body.applicant_category),
        years_experience: asNullableInteger(body.years_experience),
        languages: asNullableStringArray(body.languages),
        target_countries: asNullableStringArray(body.target_countries),
        network_description: asNullableString(body.network_description),
        relevant_experience: asNullableString(body.relevant_experience),
        motivation: asNullableString(body.motivation),
        linkedin: asNullableString(body.linkedin),
        application_date: applicationDate,
      });

    if (intakeErr) {
      // Unique-violation on source_application_id means a concurrent request
      // won the race and already created the partner. Roll back the partner
      // row we just (redundantly) created and return the winner's partner_id
      // so the caller never sees more than one partner per application.
      if (intakeErr.code === '23505') {
        await adminClient.from('partners').delete().eq('id', newPartner.id);

        const { data: winner, error: winnerErr } = await adminClient
          .from('partner_network_intake')
          .select('partner_id')
          .eq('source_application_id', sourceApplicationId)
          .single();

        if (winnerErr || !winner) {
          console.error('winner lookup error after race:', winnerErr);
          return json({ error: 'Failed to resolve concurrent transfer' }, 500);
        }

        return json({ success: true, partner_id: winner.partner_id, already_existed: true });
      }

      console.error('intake insert error:', intakeErr);
      await adminClient.from('partners').delete().eq('id', newPartner.id);
      return json({ error: 'Failed to record partner intake' }, 500);
    }

    return json({ success: true, partner_id: newPartner.id });
  } catch (error) {
    console.error('Error in partner-network-intake:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
