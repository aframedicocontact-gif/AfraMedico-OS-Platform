import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ error: 'Missing Authorization bearer token' }, 401);

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser(token);
    if (callerError || !callerData?.user) {
      return json({ error: 'invalid_session', message: 'Your session is invalid or expired.' }, 401);
    }
    if (callerData.user.app_metadata?.partner_portal !== true) {
      return json({ error: 'Forbidden' }, 403);
    }

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const action = body?.action;
    if (!['get_dashboard', 'sign_agreement', 'submit_referral'].includes(String(action))) {
      return json({ error: 'Invalid action' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: link, error: linkError } = await admin
      .from('partner_auth_links')
      .select('id, partner_id, organization_id, status')
      .eq('auth_user_id', callerData.user.id)
      .maybeSingle();
    if (linkError) {
      console.error('partner link lookup failed', linkError);
      return json({ error: 'Unable to load partner account' }, 500);
    }
    if (!link || link.status === 'revoked') return json({ error: 'Partner access is not active' }, 403);

    const [{ data: partner, error: partnerError }, { data: profile, error: profileError }] = await Promise.all([
      admin.from('partners').select('id, partner_code, name, country, type, status, lifecycle_stage').eq('id', link.partner_id).maybeSingle(),
      admin.from('partner_onboarding_profiles').select('legal_full_name, legal_address, entity_type, authorized_representative_name, preferred_communication_method, completed_at').eq('partner_id', link.partner_id).maybeSingle(),
    ]);
    if (partnerError || profileError || !partner) {
      console.error('partner portal account lookup failed', partnerError ?? profileError);
      return json({ error: 'Unable to load partner account' }, 500);
    }
    if (!profile?.completed_at) {
      return json({ error: 'profile_incomplete', message: 'Complete your partner profile first.' }, 409);
    }

    const { data: template, error: templateError } = await admin
      .from('partner_agreement_templates')
      .select('id, version, title, agreement_text, commission_rate')
      .eq('organization_id', link.organization_id)
      .eq('status', 'approved')
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (templateError || !template) {
      console.error('approved agreement template lookup failed', templateError);
      return json({ error: 'No approved partner agreement is available' }, 503);
    }

    let { data: agreement, error: agreementError } = await admin
      .from('partner_agreements')
      .select('id, template_version, agreement_snapshot, commission_rate, status, issued_at, signed_at, signer_name, signer_title')
      .eq('partner_id', partner.id)
      .eq('template_id', template.id)
      .maybeSingle();
    if (agreementError) {
      console.error('agreement lookup failed', agreementError);
      return json({ error: 'Unable to load agreement' }, 500);
    }

    if (!agreement) {
      const { data: created, error: createError } = await admin
        .from('partner_agreements')
        .insert({
          organization_id: link.organization_id,
          partner_id: partner.id,
          template_id: template.id,
          template_version: template.version,
          agreement_snapshot: template.agreement_text,
          commission_rate: template.commission_rate,
          status: 'pending_signature',
        })
        .select('id, template_version, agreement_snapshot, commission_rate, status, issued_at, signed_at, signer_name, signer_title')
        .single();
      if (createError || !created) {
        console.error('agreement creation failed', createError);
        return json({ error: 'Unable to prepare agreement' }, 500);
      }
      agreement = created;
      await admin.from('partner_agreement_events').insert({
        organization_id: link.organization_id,
        agreement_id: agreement.id,
        partner_id: partner.id,
        auth_user_id: callerData.user.id,
        event_type: 'issued',
        event_data: { template_version: template.version },
      });
      if (partner.lifecycle_stage === 'profile_completed') {
        await admin.from('partners').update({ lifecycle_stage: 'agreement_pending' }).eq('id', partner.id);
        partner.lifecycle_stage = 'agreement_pending';
      }
    }

    if (action === 'sign_agreement') {
      if (agreement.status === 'signed') {
        return json({ success: true, already_signed: true, lifecycle_stage: 'active_partner' });
      }
      const signerName = clean(body?.signer_name, 200);
      const signerTitle = clean(body?.signer_title, 160);
      const acceptedAgreement = body?.accepted_agreement === true;
      const acceptedElectronicSignature = body?.accepted_electronic_signature === true;
      const acceptedPrivacy = body?.accepted_privacy === true;
      if (!signerName || !acceptedAgreement || !acceptedElectronicSignature || !acceptedPrivacy) {
        return json({ error: 'Complete the signature name and all acceptance confirmations.' }, 400);
      }
      const permittedNames = [profile.legal_full_name, profile.authorized_representative_name]
        .filter((value): value is string => Boolean(value));
      if (!permittedNames.some((value) => normalize(value) === normalize(signerName))) {
        return json({ error: 'Signer name must match the legal name or authorized representative.' }, 400);
      }

      const signedAt = new Date().toISOString();
      const agreementHash = await sha256(agreement.agreement_snapshot);
      const userAgentHash = await sha256(req.headers.get('user-agent') ?? 'not-provided');
      const { data: signed, error: signError } = await admin.rpc('activate_partner_agreement', {
        p_agreement_id: agreement.id,
        p_partner_id: partner.id,
        p_auth_user_id: callerData.user.id,
        p_signer_name: signerName,
        p_signer_title: signerTitle || null,
        p_signer_email: callerData.user.email ?? null,
        p_agreement_sha256: agreementHash,
        p_signature_evidence: {
          accepted_agreement: true,
          accepted_electronic_signature: true,
          accepted_privacy: true,
          authenticated_user_id: callerData.user.id,
          user_agent_sha256: userAgentHash,
          signed_at: signedAt,
        },
      });
      if (signError || signed !== true) {
        console.error('agreement signature update failed', signError);
        return json({ error: 'Unable to sign agreement' }, 409);
      }
      return json({ success: true, already_signed: false, lifecycle_stage: 'active_partner' });
    }

    if (action === 'submit_referral') {
      if (agreement.status !== 'signed' || partner.status !== 'active') {
        return json({ error: 'Sign the Partner Agreement before introducing a patient.' }, 403);
      }
      const patientFullName = clean(body?.patient_full_name, 200);
      const patientEmail = clean(body?.patient_email, 254).toLocaleLowerCase();
      const patientPhone = clean(body?.patient_phone, 60);
      const patientCountry = clean(body?.patient_country, 120);
      const requestedTreatment = clean(body?.requested_treatment, 300);
      const medicalSummary = clean(body?.medical_summary, 4000);
      if (!patientFullName || !patientPhone || !patientCountry || !requestedTreatment || !medicalSummary) {
        return json({ error: 'Complete all required patient referral fields.' }, 400);
      }
      if (body?.patient_consent_confirmed !== true) {
        return json({ error: 'Patient consent must be confirmed.' }, 400);
      }
      const referralCode = `PR-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
      const { data: referral, error: referralError } = await admin
        .from('partner_patient_referrals')
        .insert({
          organization_id: link.organization_id,
          partner_id: partner.id,
          agreement_id: agreement.id,
          referral_code: referralCode,
          patient_full_name: patientFullName,
          patient_email: patientEmail || null,
          patient_phone: patientPhone,
          patient_country: patientCountry,
          requested_treatment: requestedTreatment,
          medical_summary: medicalSummary,
          initial_records_ready: body?.initial_records_ready === true,
          patient_consent_confirmed: true,
          referral_status: body?.initial_records_ready === true ? 'under_review' : 'documents_requested',
        })
        .select('id, referral_code, referral_status, submitted_at')
        .single();
      if (referralError || !referral) {
        console.error('partner referral insert failed', referralError);
        return json({ error: 'Unable to submit patient referral' }, 500);
      }
      return json({ success: true, referral });
    }

    const { data: referrals, error: referralsError } = await admin
      .from('partner_patient_referrals')
      .select('id, referral_code, patient_full_name, patient_country, requested_treatment, referral_status, submitted_at')
      .eq('partner_id', partner.id)
      .order('submitted_at', { ascending: false })
      .limit(20);
    if (referralsError) {
      console.error('partner referral list failed', referralsError);
      return json({ error: 'Unable to load referrals' }, 500);
    }

    return json({
      partner: {
        partner_code: partner.partner_code,
        name: partner.name,
        country: partner.country,
        type: partner.type,
        status: partner.status,
        lifecycle_stage: partner.lifecycle_stage,
      },
      profile: {
        legal_full_name: profile.legal_full_name,
        entity_type: profile.entity_type,
        authorized_representative_name: profile.authorized_representative_name,
      },
      agreement: {
        id: agreement.id,
        title: template.title,
        template_version: agreement.template_version,
        agreement_text: agreement.agreement_snapshot,
        commission_rate: agreement.commission_rate,
        status: agreement.status,
        issued_at: agreement.issued_at,
        signed_at: agreement.signed_at,
        signer_name: agreement.signer_name,
        signer_title: agreement.signer_title,
      },
      can_submit_referral: agreement.status === 'signed' && partner.status === 'active',
      referrals: referrals ?? [],
    });
  } catch (error) {
    console.error('partner-portal failure', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
