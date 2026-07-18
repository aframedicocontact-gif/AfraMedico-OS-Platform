import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateExecutedAgreementPdf } from "../_shared/partnerAgreementPdf.ts";
import { sendExecutedAgreementEmail } from "../_shared/partnerAgreementEmail.ts";

// Internal-admin-only counterpart to partner-portal. Every action here
// requires an authenticated organization_administrator session (never a
// partner-portal session) and only ever operates within the caller's own
// organization_id. Countersignature is the sole path that can move an
// agreement to fully_executed -- there is no pre-stored company signature
// anywhere in this schema; the admin must draw one on every countersign.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FRONTEND_URL = 'https://afra-medico-os-platform.vercel.app';
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

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

type StrokePoint = { x: number; y: number; t: number };

function isValidStrokes(value: unknown): value is StrokePoint[][] {
  if (!Array.isArray(value) || value.length === 0) return false;
  for (const stroke of value) {
    if (!Array.isArray(stroke) || stroke.length === 0) return false;
    for (const point of stroke) {
      if (
        typeof point !== 'object' || point === null ||
        typeof (point as StrokePoint).x !== 'number' || typeof (point as StrokePoint).y !== 'number' ||
        typeof (point as StrokePoint).t !== 'number' ||
        !Number.isFinite((point as StrokePoint).x) || !Number.isFinite((point as StrokePoint).y) ||
        !Number.isFinite((point as StrokePoint).t) ||
        (point as StrokePoint).x < -1 || (point as StrokePoint).x > 100000 ||
        (point as StrokePoint).y < -1 || (point as StrokePoint).y > 100000
      ) {
        return false;
      }
    }
  }
  return true;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Bytes(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

type AdminClient = ReturnType<typeof createClient>;

// deno-lint-ignore no-explicit-any
async function latestEventId(admin: AdminClient, agreementId: string, eventType: string): Promise<string | null> {
  const { data } = await admin
    .from('partner_agreement_events')
    .select('id')
    .eq('agreement_id', agreementId)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// Idempotent PDF-generation + email-delivery pipeline. Safe to call
// repeatedly for the same fully_executed agreement: claim_agreement_pdf_generation
// ensures only one caller ever renders/uploads the PDF, and the email leg is
// re-attempted (never re-generates a different PDF) whenever delivery status
// isn't already 'sent'.
// deno-lint-ignore no-explicit-any
async function finalizePdfAndEmail(admin: AdminClient, agreementRow: any, partner: any) {
  const result: { pdf_generated_now: boolean; email_status: string } = {
    pdf_generated_now: false,
    email_status: agreementRow.final_pdf_email_status ?? 'not_sent',
  };

  let storagePath: string | null = agreementRow.final_pdf_storage_path ?? null;

  if (!storagePath) {
    const { data: claimed, error: claimError } = await admin.rpc('claim_agreement_pdf_generation', {
      p_agreement_id: agreementRow.id,
    });
    if (claimError) {
      console.error('claim_agreement_pdf_generation failed', claimError);
      return result;
    }
    if (claimed === true) {
      try {
        const [partnerEventId, companyEventId] = await Promise.all([
          latestEventId(admin, agreementRow.id, 'signed'),
          latestEventId(admin, agreementRow.id, 'countersigned'),
        ]);
        const contractId = `AFM-${partner.partner_code}-${agreementRow.template_version}`;
        const verificationUrl = `${FRONTEND_URL}/verify/${agreementRow.verification_code}`;
        const pdfGeneratedAt = new Date().toISOString();

        const pdfBytes = await generateExecutedAgreementPdf({
          contractId,
          partnerCode: partner.partner_code,
          partnerName: partner.name,
          agreementVersion: agreementRow.template_version,
          agreementText: agreementRow.agreement_snapshot,
          agreementSha256: agreementRow.agreement_sha256,
          commissionRate: Number(agreementRow.commission_rate),
          partnerSignerName: agreementRow.signer_name,
          partnerSignerTitle: agreementRow.signer_title,
          partnerSignedAt: agreementRow.partner_signed_at,
          partnerSignatureStrokes: agreementRow.partner_signature_strokes ?? [],
          partnerAuthMethod: 'partner_portal_session',
          partnerSignatureEventId: partnerEventId,
          companySignerName: agreementRow.company_signer_name,
          companySignerTitle: agreementRow.company_signer_title,
          companySignedAt: agreementRow.company_signed_at,
          companySignatureStrokes: agreementRow.company_signature_strokes ?? [],
          companyAuthMethod: 'organization_administrator_session',
          companySignatureEventId: companyEventId,
          verificationCode: agreementRow.verification_code,
          verificationUrl,
          pdfGeneratedAt,
        });

        storagePath = `agreements/${agreementRow.organization_id}/${agreementRow.id}/executed-${agreementRow.verification_code}.pdf`;
        const { error: uploadError } = await admin.storage
          .from('partner-agreements')
          .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: false });
        if (uploadError) {
          console.error('executed agreement PDF upload failed', uploadError);
          storagePath = null;
        } else {
          const pdfSha256 = await sha256Bytes(pdfBytes);
          await admin
            .from('partner_agreements')
            .update({ final_pdf_storage_path: storagePath, final_pdf_sha256: pdfSha256 })
            .eq('id', agreementRow.id);
          await admin.from('partner_agreement_events').insert({
            organization_id: agreementRow.organization_id,
            agreement_id: agreementRow.id,
            partner_id: agreementRow.partner_id,
            auth_user_id: agreementRow.countersigned_by,
            event_type: 'pdf_generated',
            event_data: { storage_path: storagePath, sha256: pdfSha256 },
          });
          await admin.from('partner_agreement_pdf_audit').insert({
            agreement_id: agreementRow.id,
            organization_id: agreementRow.organization_id,
            partner_signature_event_id: partnerEventId,
            company_signature_event_id: companyEventId,
            partner_auth_method: 'partner_portal_session',
            company_auth_method: 'organization_administrator_session',
          });
          result.pdf_generated_now = true;
          agreementRow.final_pdf_storage_path = storagePath;
        }
      } catch (renderError) {
        console.error('executed agreement PDF generation failed', renderError);
        storagePath = null;
      }
    }
  }

  if (storagePath && result.email_status !== 'sent') {
    result.email_status = await attemptEmailDelivery(admin, agreementRow, partner, storagePath);
  }

  return result;
}

// deno-lint-ignore no-explicit-any
async function attemptEmailDelivery(admin: AdminClient, agreementRow: any, partner: any, storagePath: string): Promise<string> {
  try {
    const { data: intake } = await admin
      .from('partner_network_intake')
      .select('email, full_name')
      .eq('partner_id', agreementRow.partner_id)
      .maybeSingle();
    if (!intake?.email) throw new Error('No partner contact email on file');

    const { data: pdfDownload, error: downloadError } = await admin.storage
      .from('partner-agreements')
      .download(storagePath);
    if (downloadError || !pdfDownload) throw downloadError ?? new Error('Executed PDF not found in storage');
    const pdfBytes = new Uint8Array(await pdfDownload.arrayBuffer());

    const contractId = `AFM-${partner.partner_code}-${agreementRow.template_version}`;
    await sendExecutedAgreementEmail({
      toEmail: intake.email,
      toName: intake.full_name ?? null,
      contractId,
      partnerOrganizationName: partner.name,
      pdfBytes,
      dashboardUrl: `${FRONTEND_URL}/partner/dashboard`,
    });

    await admin
      .from('partner_agreements')
      .update({ final_pdf_email_status: 'sent', final_pdf_email_last_attempt_at: new Date().toISOString() })
      .eq('id', agreementRow.id);
    await admin.from('partner_agreement_events').insert({
      organization_id: agreementRow.organization_id,
      agreement_id: agreementRow.id,
      partner_id: agreementRow.partner_id,
      auth_user_id: agreementRow.countersigned_by,
      event_type: 'email_sent',
      event_data: { to: intake.email },
    });
    return 'sent';
  } catch (emailError) {
    console.error('executed agreement email delivery failed', emailError);
    await admin
      .from('partner_agreements')
      .update({ final_pdf_email_status: 'failed', final_pdf_email_last_attempt_at: new Date().toISOString() })
      .eq('id', agreementRow.id);
    await admin.from('partner_agreement_events').insert({
      organization_id: agreementRow.organization_id,
      agreement_id: agreementRow.id,
      partner_id: agreementRow.partner_id,
      auth_user_id: agreementRow.countersigned_by,
      event_type: 'email_failed',
      event_data: { error: String(emailError) },
    });
    return 'failed';
  }
}

const AGREEMENT_COLUMNS = 'id, organization_id, partner_id, template_id, template_version, agreement_snapshot, agreement_sha256, commission_rate, status, issued_at, signer_name, signer_title, partner_signed_at, partner_signature_strokes, company_signer_name, company_signer_title, company_signed_at, company_signature_strokes, fully_executed_at, countersigned_by, verification_code, final_pdf_storage_path, final_pdf_sha256, final_pdf_generated_at, final_pdf_email_status';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!callerToken) return json({ error: 'Missing Authorization bearer token' }, 401);

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser(callerToken);
    if (callerError || !callerData?.user) {
      return json({ error: 'Invalid or expired session' }, 401);
    }

    const callerAppMetadata = (callerData.user.app_metadata ?? {}) as Record<string, unknown>;
    const callerOrganizationId = callerAppMetadata.organization_id;
    const callerIsPartnerPortal = callerAppMetadata.partner_portal === true;
    if (callerIsPartnerPortal || !isValidUUID(callerOrganizationId)) {
      return json({ error: 'Forbidden' }, 403);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: isAdmin, error: adminCheckErr } = await admin.rpc('is_active_org_admin', {
      p_auth_user_id: callerData.user.id,
      p_organization_id: callerOrganizationId,
    });
    if (adminCheckErr) {
      console.error('is_active_org_admin check error', adminCheckErr);
      return json({ error: 'Failed to verify caller authorization' }, 500);
    }
    if (!isAdmin) return json({ error: 'Forbidden' }, 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }

    const action = body.action;
    if (!['get_agreement', 'countersign_agreement', 'get_download_url', 'resend_email'].includes(String(action))) {
      return json({ error: 'Invalid action' }, 400);
    }

    const partnerId = body.partner_id;
    if (!isValidUUID(partnerId)) return json({ error: 'Invalid partner_id' }, 400);

    const { data: partner, error: partnerError } = await admin
      .from('partners')
      .select('id, organization_id, partner_code, name, status, lifecycle_stage')
      .eq('id', partnerId)
      .maybeSingle();
    if (partnerError || !partner) {
      console.error('partner lookup failed', partnerError);
      return json({ error: 'Partner not found' }, 404);
    }
    if (partner.organization_id !== callerOrganizationId) {
      return json({ error: 'Forbidden' }, 403);
    }

    const { data: agreement, error: agreementError } = await admin
      .from('partner_agreements')
      .select(AGREEMENT_COLUMNS)
      .eq('partner_id', partnerId)
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (agreementError) {
      console.error('agreement lookup failed', agreementError);
      return json({ error: 'Unable to load agreement' }, 500);
    }
    if (!agreement) {
      return json({ error: 'No agreement found for this partner yet.' }, 404);
    }

    if (action === 'get_agreement') {
      const { data: adminProfile } = await admin
        .from('user_profiles')
        .select('full_name')
        .eq('id', callerData.user.id)
        .maybeSingle();
      return json({
        partner: {
          id: partner.id,
          partner_code: partner.partner_code,
          name: partner.name,
          status: partner.status,
          lifecycle_stage: partner.lifecycle_stage,
        },
        agreement: {
          id: agreement.id,
          template_version: agreement.template_version,
          status: agreement.status,
          issued_at: agreement.issued_at,
          signer_name: agreement.signer_name,
          signer_title: agreement.signer_title,
          partner_signed_at: agreement.partner_signed_at,
          company_signer_name: agreement.company_signer_name,
          company_signer_title: agreement.company_signer_title,
          company_signed_at: agreement.company_signed_at,
          fully_executed_at: agreement.fully_executed_at,
          commission_rate: agreement.commission_rate,
          agreement_text: agreement.agreement_snapshot,
          has_final_pdf: Boolean(agreement.final_pdf_storage_path),
          final_pdf_email_status: agreement.final_pdf_email_status,
        },
        admin_full_name: (adminProfile as { full_name: string } | null)?.full_name ?? null,
      });
    }

    if (action === 'countersign_agreement') {
      if (agreement.status !== 'fully_executed') {
        if (agreement.status !== 'pending_aframedico_signature') {
          return json({ error: 'Agreement is not awaiting AfraMedico countersignature.' }, 409);
        }

        const signerTitle = clean(body.signer_title, 160);
        const strokes = body.signature_strokes;
        if (!signerTitle || !isValidStrokes(strokes)) {
          return json({ error: 'Provide your title and draw a signature to countersign.' }, 400);
        }

        const { data: adminProfile, error: adminProfileError } = await admin
          .from('user_profiles')
          .select('full_name')
          .eq('id', callerData.user.id)
          .eq('organization_id', callerOrganizationId)
          .maybeSingle();
        if (adminProfileError || !adminProfile?.full_name) {
          console.error('admin profile lookup failed', adminProfileError);
          return json({ error: 'Unable to load your verified legal name' }, 500);
        }

        const signatureHash = await sha256(JSON.stringify(strokes));
        const verificationCode = crypto.randomUUID().replaceAll('-', '');

        const { data: countersigned, error: countersignError } = await admin.rpc('countersign_partner_agreement', {
          p_agreement_id: agreement.id,
          p_countersigned_by: callerData.user.id,
          p_organization_id: callerOrganizationId,
          p_signer_name: adminProfile.full_name,
          p_signer_title: signerTitle,
          p_signature_strokes: strokes,
          p_signature_sha256: signatureHash,
          p_verification_code: verificationCode,
        });
        if (countersignError || !countersigned) {
          console.error('countersign_partner_agreement failed', countersignError);
          return json({ error: 'Unable to countersign agreement' }, 409);
        }
        Object.assign(agreement, countersigned);
      }

      const pipelineResult = await finalizePdfAndEmail(admin, agreement, partner);
      return json({
        success: true,
        agreement: {
          id: agreement.id,
          status: agreement.status,
          fully_executed_at: agreement.fully_executed_at,
          has_final_pdf: Boolean(agreement.final_pdf_storage_path),
        },
        pdf_generated_now: pipelineResult.pdf_generated_now,
        email_status: pipelineResult.email_status,
      });
    }

    if (action === 'resend_email') {
      if (agreement.status !== 'fully_executed' || !agreement.final_pdf_storage_path) {
        return json({ error: 'No executed agreement PDF is available to send yet.' }, 409);
      }
      const emailStatus = await attemptEmailDelivery(admin, agreement, partner, agreement.final_pdf_storage_path);
      return json({ success: true, email_status: emailStatus });
    }

    if (action === 'get_download_url') {
      if (!agreement.final_pdf_storage_path) {
        return json({ error: 'No executed agreement PDF is available yet.' }, 409);
      }
      const { data: signedUrl, error: signedUrlError } = await admin.storage
        .from('partner-agreements')
        .createSignedUrl(agreement.final_pdf_storage_path, 300);
      if (signedUrlError || !signedUrl) {
        console.error('signed url creation failed', signedUrlError);
        return json({ error: 'Unable to generate download link' }, 500);
      }
      return json({ success: true, url: signedUrl.signedUrl, expires_in: 300 });
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('partner-agreement-admin failure', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
