import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import QRCode from "https://esm.sh/qrcode@1.5.3?target=deno";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Internal-admin-only counterpart to partner-portal. Every action here
// requires an authenticated organization_administrator session (never a
// partner-portal session) and only ever operates within the caller's own
// organization_id. Countersignature is the sole path that can move an
// agreement to fully_executed -- there is no pre-stored company signature
// anywhere in this schema; the admin must draw one on every countersign.
//
// The PDF-rendering and email-delivery helpers below are inlined from
// _shared/partnerAgreementPdf.ts and _shared/partnerAgreementEmail.ts
// (single-file deployment -- see PDF_RENDERER_VERSION for the rendering
// logic's own version marker). No behavior differs from those modules.

// ---------------------------------------------------------------------
// PDF rendering (inlined from _shared/partnerAgreementPdf.ts)
// ---------------------------------------------------------------------

// Logical coordinate space that SignaturePad.tsx normalizes every captured
// stroke point into (top-left origin, y increasing downward) regardless of
// the on-screen canvas size or device pixel ratio. Must stay in sync with
// SIGNATURE_BOX in src/components/ui/SignaturePad.tsx.
const SIGNATURE_BOX = { width: 600, height: 200 };

// Bumped whenever the rendering logic (layout, signer-name resolution,
// typography) changes in a way that would make a re-render of the same
// immutable agreement/signature data look different from a prior artifact.
// Printed in the PDF footer/certificate and stored on each PDF artifact row.
const PDF_RENDERER_VERSION = "v2";

type StrokePoint = { x: number; y: number; t: number };
type Strokes = StrokePoint[][];

interface ExecutedAgreementPdfInput {
  contractId: string;
  partnerCode: string;
  partnerName: string;
  agreementVersion: string;
  agreementText: string;
  agreementSha256: string;
  commissionRate: number;
  partnerSignerName: string | null;
  partnerSignerTitle: string | null;
  partnerSignedAt: string;
  partnerSignatureStrokes: Strokes;
  partnerAuthMethod: string;
  partnerSignatureEventId: string | null;
  companySignerName: string;
  companySignerTitle: string;
  companySignedAt: string;
  companySignatureStrokes: Strokes;
  companyAuthMethod: string;
  companySignatureEventId: string | null;
  verificationCode: string;
  verificationUrl: string;
  pdfGeneratedAt: string;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;
const BODY_SIZE = 10;
const HEADING_SIZE = 14;

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const rawLine of text.split("\n")) {
    if (rawLine.trim() === "") {
      out.push("");
      continue;
    }
    const words = rawLine.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function drawSignatureBox(page: PDFPage, strokes: Strokes, x: number, yTop: number, boxWidth: number, boxHeight: number) {
  page.drawRectangle({
    x,
    y: yTop - boxHeight,
    width: boxWidth,
    height: boxHeight,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.75,
  });
  // Uniform scale (never independent X/Y) so the signature is never
  // stretched, then center the drawn strokes inside the box.
  const scale = Math.min(boxWidth / SIGNATURE_BOX.width, boxHeight / SIGNATURE_BOX.height);
  const drawnWidth = SIGNATURE_BOX.width * scale;
  const drawnHeight = SIGNATURE_BOX.height * scale;
  const originX = x + (boxWidth - drawnWidth) / 2;
  const originY = yTop - (boxHeight - drawnHeight) / 2;
  const ink = rgb(0.05, 0.05, 0.2);
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      const p0 = stroke[0];
      page.drawCircle({ x: originX + p0.x * scale, y: originY - p0.y * scale, size: 1, color: ink });
      continue;
    }
    for (let i = 1; i < stroke.length; i += 1) {
      const a = stroke[i - 1];
      const b = stroke[i];
      page.drawLine({
        start: { x: originX + a.x * scale, y: originY - a.y * scale },
        end: { x: originX + b.x * scale, y: originY - b.y * scale },
        thickness: 1.4,
        color: ink,
      });
    }
  }
}

async function generateExecutedAgreementPdf(input: ExecutedAgreementPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) newPage();
  };

  const drawHeading = (text: string) => {
    ensureSpace(HEADING_SIZE + 10);
    page.drawText(text, { x: MARGIN, y, size: HEADING_SIZE, font: boldFont, color: rgb(0.05, 0.05, 0.15) });
    y -= HEADING_SIZE + 8;
  };

  const drawParagraph = (text: string, size = BODY_SIZE, useFont = font, color = rgb(0.1, 0.1, 0.1)) => {
    const lines = wrapText(useFont, text, size, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(LINE_HEIGHT);
      if (line) page.drawText(line, { x: MARGIN, y, size, font: useFont, color });
      y -= LINE_HEIGHT;
    }
  };

  const drawLabelValue = (label: string, value: string, size = BODY_SIZE, lineHeight = LINE_HEIGHT) => {
    const valueLines = wrapText(font, value, size, CONTENT_WIDTH - boldFont.widthOfTextAtSize(label, size) - 6);
    ensureSpace(lineHeight * Math.max(1, valueLines.length));
    page.drawText(label, { x: MARGIN, y, size, font: boldFont, color: rgb(0.15, 0.15, 0.15) });
    const labelWidth = boldFont.widthOfTextAtSize(label, size);
    if (valueLines.length > 0) {
      page.drawText(valueLines[0], { x: MARGIN + labelWidth + 6, y, size, font, color: rgb(0.1, 0.1, 0.1) });
    }
    y -= lineHeight;
    for (let i = 1; i < valueLines.length; i += 1) {
      ensureSpace(lineHeight);
      page.drawText(valueLines[i], { x: MARGIN + labelWidth + 6, y, size, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }
  };

  // Signer name is a hard requirement to never render as the literal string
  // "null" -- the caller must already have resolved a verified name, but this
  // is a last-resort guard so a render never surfaces that defect visibly.
  const safeName = (name: string | null | undefined) =>
    name && name.trim() ? name.trim() : "Signer Name Unavailable";

  const partnerSignerLine = `${safeName(input.partnerSignerName)}${input.partnerSignerTitle ? " -- " + input.partnerSignerTitle : ""}`;
  const companySignerLine = `${safeName(input.companySignerName)}${input.companySignerTitle ? " -- " + input.companySignerTitle : ""}`;

  drawHeading("AfraMedico Referral Partner Agreement -- Executed Copy");
  drawLabelValue("Contract ID:", input.contractId);
  drawLabelValue("Partner ID:", input.partnerCode);
  drawLabelValue("Partner Organization:", input.partnerName);
  drawLabelValue("Agreement Version:", input.agreementVersion);
  drawLabelValue("Status:", "Fully Executed");
  drawLabelValue("Commission Rate:", `${input.commissionRate}%`);
  drawLabelValue("Agreement Content SHA-256:", input.agreementSha256);
  y -= 6;

  drawHeading("Agreement Text");
  drawParagraph(input.agreementText);

  newPage();
  drawHeading("Signatures");

  // Compact, side-by-side signature columns.
  const SIG_BOX_WIDTH = 220;
  const SIG_BOX_HEIGHT = 70;
  const SIG_COL_GAP = 32;
  const SIG_META_SIZE = 8;
  const SIG_META_LINE = 11;
  const partnerColX = MARGIN;
  const companyColX = MARGIN + SIG_BOX_WIDTH + SIG_COL_GAP;

  const drawColumnMeta = (x: number, startY: number, rows: Array<[string, string]>): number => {
    let cy = startY;
    for (const [label, value] of rows) {
      const labelWidth = boldFont.widthOfTextAtSize(label, SIG_META_SIZE);
      const valueLines = wrapText(font, value, SIG_META_SIZE, SIG_BOX_WIDTH - labelWidth - 4);
      page.drawText(label, { x, y: cy, size: SIG_META_SIZE, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
      if (valueLines.length > 0) {
        page.drawText(valueLines[0], { x: x + labelWidth + 4, y: cy, size: SIG_META_SIZE, font, color: rgb(0.15, 0.15, 0.15) });
      }
      cy -= SIG_META_LINE;
      for (let i = 1; i < valueLines.length; i += 1) {
        page.drawText(valueLines[i], { x: x + labelWidth + 4, y: cy, size: SIG_META_SIZE, font, color: rgb(0.15, 0.15, 0.15) });
        cy -= SIG_META_LINE;
      }
    }
    return cy;
  };

  const partnerMetaRows: Array<[string, string]> = [
    ["Signer:", safeName(input.partnerSignerName)],
    ["Title:", input.partnerSignerTitle ?? "N/A"],
    ["Signed (UTC):", input.partnerSignedAt],
    ["Auth Method:", input.partnerAuthMethod],
  ];
  const companyMetaRows: Array<[string, string]> = [
    ["Signer:", safeName(input.companySignerName)],
    ["Title:", input.companySignerTitle ?? "N/A"],
    ["Signed (UTC):", input.companySignedAt],
    ["Auth Method:", input.companyAuthMethod],
  ];

  // Reserve the whole two-column block up front so pagination never splits
  // a signature box from its metadata mid-column.
  ensureSpace(LINE_HEIGHT + 4 + SIG_BOX_HEIGHT + 8 + SIG_META_LINE * 4 + 10);

  page.drawText("Partner Signature", { x: partnerColX, y, size: BODY_SIZE, font: boldFont, color: rgb(0.05, 0.05, 0.15) });
  page.drawText("AfraMedico Signature", { x: companyColX, y, size: BODY_SIZE, font: boldFont, color: rgb(0.05, 0.05, 0.15) });
  y -= LINE_HEIGHT + 4;

  const boxTopY = y;
  drawSignatureBox(page, input.partnerSignatureStrokes, partnerColX, boxTopY, SIG_BOX_WIDTH, SIG_BOX_HEIGHT);
  drawSignatureBox(page, input.companySignatureStrokes, companyColX, boxTopY, SIG_BOX_WIDTH, SIG_BOX_HEIGHT);
  y -= SIG_BOX_HEIGHT + 8;

  const partnerMetaEndY = drawColumnMeta(partnerColX, y, partnerMetaRows);
  const companyMetaEndY = drawColumnMeta(companyColX, y, companyMetaRows);
  y = Math.min(partnerMetaEndY, companyMetaEndY) - 6;

  newPage();
  drawHeading("Electronic Signature Certificate");
  const CERT_SIZE = 9;
  const CERT_LINE = 12;
  drawLabelValue("Contract ID:", input.contractId, CERT_SIZE, CERT_LINE);
  drawLabelValue("Partner ID:", input.partnerCode, CERT_SIZE, CERT_LINE);
  drawLabelValue("Agreement Version:", input.agreementVersion, CERT_SIZE, CERT_LINE);
  drawLabelValue("Status:", "Fully Executed", CERT_SIZE, CERT_LINE);
  drawLabelValue("Verification Code:", input.verificationCode, CERT_SIZE, CERT_LINE);
  drawLabelValue("PDF Renderer Version:", PDF_RENDERER_VERSION, CERT_SIZE, CERT_LINE);
  y -= 2;
  drawLabelValue("Partner Signer:", partnerSignerLine, CERT_SIZE, CERT_LINE);
  drawLabelValue("Partner Signature Timestamp (UTC):", input.partnerSignedAt, CERT_SIZE, CERT_LINE);
  drawLabelValue("Partner Authentication Method:", input.partnerAuthMethod, CERT_SIZE, CERT_LINE);
  drawLabelValue("Partner Signature Event ID:", input.partnerSignatureEventId ?? "n/a", CERT_SIZE, CERT_LINE);
  y -= 2;
  drawLabelValue("AfraMedico Signer:", companySignerLine, CERT_SIZE, CERT_LINE);
  drawLabelValue("AfraMedico Countersignature Timestamp (UTC):", input.companySignedAt, CERT_SIZE, CERT_LINE);
  drawLabelValue("AfraMedico Authentication Method:", input.companyAuthMethod, CERT_SIZE, CERT_LINE);
  drawLabelValue("AfraMedico Signature Event ID:", input.companySignatureEventId ?? "n/a", CERT_SIZE, CERT_LINE);
  y -= 2;
  drawLabelValue("Agreement Content SHA-256:", input.agreementSha256, CERT_SIZE, CERT_LINE);
  drawLabelValue("PDF Generated At (UTC):", input.pdfGeneratedAt, CERT_SIZE, CERT_LINE);
  drawLabelValue("Verification URL:", input.verificationUrl, CERT_SIZE, CERT_LINE);
  y -= 4;

  try {
    const qrDataUrl: string = await QRCode.toDataURL(input.verificationUrl, { margin: 1, width: 160 });
    const base64 = qrDataUrl.split(",")[1];
    const qrBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const qrImage = await doc.embedPng(qrBytes);
    ensureSpace(86);
    page.drawImage(qrImage, { x: MARGIN, y: y - 80, width: 80, height: 80 });
    y -= 86;
  } catch (qrError) {
    console.error("QR code embed failed", qrError);
  }

  const pages = doc.getPages();
  const pageCount = pages.length;
  for (let i = 0; i < pageCount; i += 1) {
    const p = pages[i];
    const footerText = `${input.contractId} | v${input.agreementVersion} | renderer ${PDF_RENDERER_VERSION} | Page ${i + 1} of ${pageCount} | ${input.verificationCode}`;
    const footerSize = 7;
    const footerWidth = font.widthOfTextAtSize(footerText, footerSize);
    p.drawText(footerText, {
      x: (PAGE_WIDTH - footerWidth) / 2,
      y: 24,
      size: footerSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  return doc.save();
}

// ---------------------------------------------------------------------
// Email delivery (inlined from _shared/partnerAgreementEmail.ts)
// ---------------------------------------------------------------------

interface SendExecutedAgreementEmailInput {
  toEmail: string;
  toName: string | null;
  contractId: string;
  partnerOrganizationName: string;
  pdfBytes: Uint8Array;
  dashboardUrl: string;
}

// Reads DreamHost SMTP credentials exclusively from Supabase Edge Function
// secrets -- never hardcoded, never logged, never accepted from a request
// body. Throws if any secret is unset so the caller can record a
// 'failed' delivery status without ever exposing which value was missing.
function loadSmtpConfig() {
  const host = Deno.env.get("PARTNER_SMTP_HOST");
  const portRaw = Deno.env.get("PARTNER_SMTP_PORT");
  const username = Deno.env.get("PARTNER_SMTP_USERNAME");
  const password = Deno.env.get("PARTNER_SMTP_PASSWORD");
  const fromEmail = Deno.env.get("PARTNER_SMTP_FROM_EMAIL");
  const fromName = Deno.env.get("PARTNER_SMTP_FROM_NAME") ?? "AfraMedico Partner Network";

  if (!host || !portRaw || !username || !password || !fromEmail) {
    throw new Error("Partner SMTP secrets are not fully configured");
  }
  const port = Number(portRaw);
  if (!Number.isFinite(port)) {
    throw new Error("PARTNER_SMTP_PORT is not a valid number");
  }
  return { host, port, username, password, fromEmail, fromName };
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function sendExecutedAgreementEmail(input: SendExecutedAgreementEmailInput): Promise<void> {
  const config = loadSmtpConfig();

  const client = new SMTPClient({
    connection: {
      hostname: config.host,
      port: config.port,
      tls: false,
      auth: { username: config.username, password: config.password },
    },
    pool: false,
  });

  try {
    await client.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: input.toName ? `${input.toName} <${input.toEmail}>` : input.toEmail,
      subject: `Your AfraMedico Partner Agreement is fully executed -- ${input.contractId}`,
      content: `Dear ${input.toName ?? "Partner"},\n\nYour AfraMedico Referral Partner Agreement (Contract ID ${input.contractId}) has been fully executed by both parties. The signed agreement is attached as a PDF, and is also available any time from your secure partner dashboard: ${input.dashboardUrl}\n\n-- AfraMedico Partner Network`,
      html: `<p>Dear ${input.toName ?? "Partner"},</p><p>Your AfraMedico Referral Partner Agreement (Contract ID <strong>${input.contractId}</strong>) has been fully executed by both parties.</p><p>The signed agreement is attached as a PDF. You can also access it any time from your secure partner dashboard:</p><p><a href="${input.dashboardUrl}">${input.dashboardUrl}</a></p><p>-- AfraMedico Partner Network</p>`,
      attachments: [
        {
          filename: `${input.contractId}-executed-agreement.pdf`,
          content: uint8ToBase64(input.pdfBytes),
          encoding: "base64",
          contentType: "application/pdf",
        },
      ],
    });
  } finally {
    await client.close();
  }
}

// ---------------------------------------------------------------------
// Admin Edge Function
// ---------------------------------------------------------------------

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

// Resolves the verified partner signer's legal name without ever trusting a
// client-supplied value at PDF-generation time. Preference order:
//   1. agreement.signer_name -- populated by the legacy v1.0 typed-name flow.
//   2. agreement.signature_evidence.legal_name_displayed -- the immutable
//      record captured at the moment of signing by the v1.1 drawn-signature
//      flow (partner-portal's sign_agreement_v2 action); never rewritten
//      afterward.
//   3. A live lookup of the same partner's completed onboarding profile
//      (partner_onboarding_profiles.legal_full_name), keyed only by the
//      agreement's own partner_id -- never client input.
// deno-lint-ignore no-explicit-any
async function resolvePartnerSignerName(admin: AdminClient, agreementRow: any): Promise<string | null> {
  const directName = typeof agreementRow.signer_name === 'string' ? agreementRow.signer_name.trim() : '';
  if (directName) return directName;

  const evidence = (agreementRow.signature_evidence ?? {}) as Record<string, unknown>;
  const evidenceName = typeof evidence.legal_name_displayed === 'string' ? evidence.legal_name_displayed.trim() : '';
  if (evidenceName) return evidenceName;

  const { data: onboarding, error: onboardingError } = await admin
    .from('partner_onboarding_profiles')
    .select('legal_full_name')
    .eq('partner_id', agreementRow.partner_id)
    .not('completed_at', 'is', null)
    .maybeSingle();
  if (onboardingError) {
    console.error('partner_onboarding_profiles lookup failed', onboardingError);
    return null;
  }
  const onboardingName = typeof onboarding?.legal_full_name === 'string' ? onboarding.legal_full_name.trim() : '';
  return onboardingName || null;
}

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
        const partnerSignerName = await resolvePartnerSignerName(admin, agreementRow);

        const pdfBytes = await generateExecutedAgreementPdf({
          contractId,
          partnerCode: partner.partner_code,
          partnerName: partner.name,
          agreementVersion: agreementRow.template_version,
          agreementText: agreementRow.agreement_snapshot,
          agreementSha256: agreementRow.agreement_sha256,
          commissionRate: Number(agreementRow.commission_rate),
          partnerSignerName,
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

const AGREEMENT_COLUMNS = 'id, organization_id, partner_id, template_id, template_version, agreement_snapshot, agreement_sha256, commission_rate, status, issued_at, signer_name, signer_title, signature_evidence, partner_signed_at, partner_signature_strokes, company_signer_name, company_signer_title, company_signed_at, company_signature_strokes, fully_executed_at, countersigned_by, verification_code, final_pdf_storage_path, final_pdf_sha256, final_pdf_generated_at, final_pdf_email_status';

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
    if (
      !['get_agreement', 'countersign_agreement', 'get_download_url', 'resend_email', 'generate_corrected_pdf', 'send_corrected_pdf']
        .includes(String(action))
    ) {
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

    if (action === 'generate_corrected_pdf') {
      if (agreement.status !== 'fully_executed') {
        return json({ error: 'Agreement is not fully executed yet.' }, 409);
      }

      const [partnerEventId, companyEventId] = await Promise.all([
        latestEventId(admin, agreement.id, 'signed'),
        latestEventId(admin, agreement.id, 'countersigned'),
      ]);
      const contractId = `AFM-${partner.partner_code}-${agreement.template_version}`;
      const verificationUrl = `${FRONTEND_URL}/verify/${agreement.verification_code}`;
      const pdfGeneratedAt = new Date().toISOString();
      const partnerSignerName = await resolvePartnerSignerName(admin, agreement);

      let pdfBytes: Uint8Array;
      try {
        pdfBytes = await generateExecutedAgreementPdf({
          contractId,
          partnerCode: partner.partner_code,
          partnerName: partner.name,
          agreementVersion: agreement.template_version,
          agreementText: agreement.agreement_snapshot,
          agreementSha256: agreement.agreement_sha256,
          commissionRate: Number(agreement.commission_rate),
          partnerSignerName,
          partnerSignerTitle: agreement.signer_title,
          partnerSignedAt: agreement.partner_signed_at,
          partnerSignatureStrokes: agreement.partner_signature_strokes ?? [],
          partnerAuthMethod: 'partner_portal_session',
          partnerSignatureEventId: partnerEventId,
          companySignerName: agreement.company_signer_name,
          companySignerTitle: agreement.company_signer_title,
          companySignedAt: agreement.company_signed_at,
          companySignatureStrokes: agreement.company_signature_strokes ?? [],
          companyAuthMethod: 'organization_administrator_session',
          companySignatureEventId: companyEventId,
          verificationCode: agreement.verification_code,
          verificationUrl,
          pdfGeneratedAt,
        });
      } catch (renderError) {
        console.error('corrected agreement PDF generation failed', renderError);
        return json({ error: 'Unable to generate corrected PDF' }, 500);
      }

      // Never reuses or overwrites the original/prior artifact's storage path -- always a new object.
      const correctedPath = `agreements/${agreement.organization_id}/${agreement.id}/executed-${agreement.verification_code}-corrected-${Date.now()}.pdf`;
      const { error: uploadError } = await admin.storage
        .from('partner-agreements')
        .upload(correctedPath, pdfBytes, { contentType: 'application/pdf', upsert: false });
      if (uploadError) {
        console.error('corrected agreement PDF upload failed', uploadError);
        return json({ error: 'Unable to store corrected PDF' }, 500);
      }
      const pdfSha256 = await sha256Bytes(pdfBytes);

      const { data: artifact, error: recordError } = await admin.rpc('record_corrected_agreement_pdf', {
        p_agreement_id: agreement.id,
        p_storage_path: correctedPath,
        p_sha256: pdfSha256,
        p_renderer_version: PDF_RENDERER_VERSION,
        p_generated_by: callerData.user.id,
      });
      if (recordError || !artifact) {
        console.error('record_corrected_agreement_pdf failed', recordError);
        return json({ error: 'Unable to record corrected PDF artifact' }, 500);
      }

      await admin.from('partner_agreement_events').insert({
        organization_id: agreement.organization_id,
        agreement_id: agreement.id,
        partner_id: agreement.partner_id,
        auth_user_id: callerData.user.id,
        event_type: 'pdf_corrected',
        event_data: { storage_path: correctedPath, sha256: pdfSha256, renderer_version: PDF_RENDERER_VERSION },
      });

      return json({
        success: true,
        artifact: {
          id: (artifact as { id: string }).id,
          storage_path: (artifact as { storage_path: string }).storage_path,
          sha256: (artifact as { sha256: string }).sha256,
          renderer_version: (artifact as { renderer_version: string }).renderer_version,
          generated_at: (artifact as { generated_at: string }).generated_at,
        },
      });
    }

    if (action === 'send_corrected_pdf') {
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
