import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fully public endpoint (verify_jwt = false in config.toml). Looks a
// partner_agreements row up by its opaque, cryptographically random
// verification_code only -- never by agreement_id, partner_id, or email --
// and returns a strict allowlisted field set. No email address, Auth user
// ID, access token, session ID, signature stroke data, IP address, physical
// address, or other confidential partner information is ever selected here,
// let alone returned.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidCode(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{16,64}$/i.test(value.trim());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const code = body?.code;
    if (!isValidCode(code)) {
      return json({ error: 'invalid_code', message: 'Provide a valid verification code.' }, 400);
    }
    const verificationCode = (code as string).trim().toLowerCase();

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: agreement, error: agreementError } = await admin
      .from('partner_agreements')
      .select('id, partner_id, organization_id, template_version, status, issued_at, fully_executed_at, final_pdf_sha256')
      .eq('verification_code', verificationCode)
      .maybeSingle();
    if (agreementError) {
      console.error('verify-agreement lookup failed', agreementError);
      return json({ error: 'Unable to verify code' }, 500);
    }
    if (!agreement) {
      return json({ found: false, status: 'not_found' }, 404);
    }

    const [{ data: partner }, { data: newerAgreement }] = await Promise.all([
      admin.from('partners').select('partner_code, name').eq('id', agreement.partner_id).maybeSingle(),
      admin
        .from('partner_agreements')
        .select('id')
        .eq('partner_id', agreement.partner_id)
        .eq('status', 'fully_executed')
        .gt('issued_at', agreement.issued_at)
        .limit(1)
        .maybeSingle(),
    ]);

    let status: 'valid' | 'void' | 'superseded';
    if (agreement.status === 'void') {
      status = 'void';
    } else if (agreement.status !== 'fully_executed') {
      status = 'void';
    } else if (newerAgreement) {
      status = 'superseded';
    } else {
      status = 'valid';
    }

    const contractId = partner ? `AFM-${partner.partner_code}-${agreement.template_version}` : null;

    return json({
      found: true,
      status,
      contract_id: contractId,
      agreement_version: agreement.template_version,
      execution_date: agreement.fully_executed_at,
      partner_organization_name: partner?.name ?? null,
      aframedico_organization_name: 'AfraMedico',
      final_pdf_sha256: agreement.final_pdf_sha256,
    });
  } catch (error) {
    console.error('verify-agreement failure', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
