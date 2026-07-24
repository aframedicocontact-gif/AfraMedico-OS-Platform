import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Prevent denomailer network errors from crashing the Deno runtime.
// Without this, an SMTP connection failure can emit an unhandled rejection
// that terminates the function worker before the try/catch can respond.
self.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  console.error("partner-prospect-invitations: unhandled rejection suppressed:", event.reason);
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const applicationUrl = "https://www.aframedico.com/global-referral-partner-network";
const sponsorshipSentence =
  "Selected and approved Referral Partners may be considered for AfraMedico-sponsored enrollment in the Cross-Border Healthcare Coordination & Medical Tourism Management course delivered by Richmond Hill College.";
const employmentDisclaimer =
  "This invitation is separate from the Indeed employment position you originally applied for and does not constitute an offer of employment.";
const applicationRequirement =
  "Participation requires submitting an application, AfraMedico review, and formal approval before any referral partner activity may begin.";

type Prospect = {
  id: string;
  organization_id: string;
  first_name: string | null;
  full_name: string;
  email: string;
  country: string | null;
  profession: string | null;
  recommended_role: string | null;
  email_campaign_group: string | null;
  personalized_email_type: string | null;
  reason_for_assignment: string | null;
  outreach_status: string;
};

type TemplateType = "executive" | "professional" | "standard" | "talent_pool";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCampaignGroup(value: string | null): TemplateType {
  const normalized = (value ?? "").replace(/[\u2013\u2014]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
  if (normalized.includes("talent pool") || normalized.includes("do not contact")) return "talent_pool";
  if (normalized.includes("vip") || normalized.includes("executive")) return "executive";
  if (normalized.includes("priority") || normalized.includes("professional")) return "professional";
  return "standard";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function prospectValue(prospect: Prospect, key: string) {
  const values: Record<string, string> = {
    first_name: prospect.first_name || prospect.full_name.split(" ")[0] || "there",
    full_name: prospect.full_name,
    country: prospect.country || "your community",
    profession: prospect.profession || "your professional background",
    recommended_role: prospect.recommended_role || "AfraMedico referral partner",
    reason_for_assignment:
      prospect.reason_for_assignment || "your experience and community reach stood out in our review",
    application_url: applicationUrl,
  };
  return values[key] ?? "";
}

function interpolate(template: string, prospect: Prospect, shouldEscape = true) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
    const nextValue = prospectValue(prospect, key);
    return shouldEscape ? escapeHtml(nextValue) : nextValue;
  });
}

function htmlShell(title: string, previewText: string, body: string) {
  return `<!doctype html><html><head><meta charset="UTF-8"/><title>${title}</title></head><body style="margin:0;background:#f6faf8;font-family:Arial,sans-serif;color:#063d31;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6faf8;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border:1px solid #d8eee5;border-radius:10px;overflow:hidden;"><tr><td style="background:#064635;padding:22px 28px;color:#fff;"><div style="font-size:13px;text-transform:uppercase;color:#a7f3d0;">AfraMedico</div><div style="font-size:22px;font-weight:700;margin-top:4px;">Global Referral Partner Network</div></td></tr><tr><td style="padding:28px;line-height:1.58;font-size:15px;">${body}<p style="margin:28px 0;"><a href="${applicationUrl}" style="display:inline-block;background:#047857;color:#fff;text-decoration:none;padding:13px 18px;border-radius:7px;font-weight:700;">Apply to Join the Network</a></p><p style="font-size:13px;color:#64748b;margin-top:24px;">${sponsorshipSentence} Sponsorship is selective and is not guaranteed.</p><p style="font-size:13px;color:#64748b;margin-top:16px;">AfraMedico Partner Network</p></td></tr></table></td></tr></table></body></html>`;
}

function renderEmail(prospect: Prospect) {
  const group = normalizeCampaignGroup(prospect.personalized_email_type || prospect.email_campaign_group);
  const execHtml = `<p>Dear {{first_name}},</p>

<p>Thank you for your interest in AfraMedico.</p>

<p>The original hourly position advertised on Indeed has now been filled.</p>

<p>Following a professional review of your application, our recruitment team identified that your background, experience, and community profile appear to be well aligned with a professional partnership opportunity within the <strong>AfraMedico Global Referral Partner Network</strong>.</p>

<p><strong>This opportunity enables approved partners to build a flexible, performance-based income by referring international patients seeking trusted medical treatment abroad, while working independently within their own professional or community networks.</strong></p>

<p>Based on this assessment, we invite you to review the partnership opportunity, eligibility requirements, collaboration process, compensation structure, and application steps by visiting the link below.</p>

<p>Please note that this invitation is separate from the Indeed position you originally applied for and does <strong>not</strong> constitute an offer of employment. Referral Partners operate as independent collaborators, and participation is subject to application review, due diligence, and formal approval by AfraMedico.</p>

<div style="text-align:center; margin:30px 0;">
<a href="{{application_url}}" style="background:#0b6b57;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
Review the Opportunity, Compensation &amp; Continue Your Application
</a>
</div>

<p>Selected and approved Referral Partners may also be considered for <strong>AfraMedico-sponsored enrollment</strong> in the <strong>Cross-Border Healthcare Coordination &amp; Medical Tourism Management Certificate Program</strong>, delivered by <strong>Richmond Hill College</strong>.</p>

<p>Certificate sponsorship is selective and subject to eligibility, program availability, and AfraMedico approval.</p>

<p>If you have any questions, our team will be pleased to assist you throughout the application process.</p>

<p>Kind regards,</p>

<p><strong>AfraMedico Partner Network</strong><br>
International Patient Services</p>`;
  const execText = `Dear {{first_name}},

Thank you for your interest in AfraMedico.

The original hourly position advertised on Indeed has now been filled.

Following a professional review of your application, our recruitment team identified that your background, experience, and community profile appear to be well aligned with a professional partnership opportunity within the AfraMedico Global Referral Partner Network.

This opportunity enables approved partners to build a flexible, performance-based income by referring international patients seeking trusted medical treatment abroad, while working independently within their own professional or community networks.

Based on this assessment, we invite you to review the partnership opportunity, eligibility requirements, collaboration process, compensation structure, and application steps by visiting the link below.

Please note that this invitation is separate from the Indeed position you originally applied for and does not constitute an offer of employment. Referral Partners operate as independent collaborators, and participation is subject to application review, due diligence, and formal approval by AfraMedico.

Review the Opportunity, Compensation & Continue Your Application:
{{application_url}}

Selected and approved Referral Partners may also be considered for AfraMedico-sponsored enrollment in the Cross-Border Healthcare Coordination & Medical Tourism Management Certificate Program, delivered by Richmond Hill College.

Certificate sponsorship is selective and subject to eligibility, program availability, and AfraMedico approval.

If you have any questions, our team will be pleased to assist you throughout the application process.

Kind regards,

AfraMedico Partner Network
International Patient Services`;
  const profHtml = `<p>Dear {{first_name}},</p>

<p>Thank you for your interest in AfraMedico.</p>

<p>The original hourly position advertised on Indeed has now been filled.</p>

<p>Following a professional review of your application, our recruitment team identified that your background, experience, and community profile appear to be well aligned with a professional partnership opportunity within the <strong>AfraMedico Global Referral Partner Network</strong>.</p>

<p><strong>This opportunity enables approved partners to build a flexible, performance-based income by referring international patients seeking trusted medical treatment abroad, while working independently within their own professional or community networks.</strong></p>

<p>Based on this assessment, we invite you to review the partnership opportunity, eligibility requirements, collaboration process, compensation structure, and application steps by visiting the link below.</p>

<p>Please note that this invitation is separate from the Indeed position you originally applied for and does <strong>not</strong> constitute an offer of employment. Referral Partners operate as independent collaborators, and participation is subject to application review, due diligence, and formal approval by AfraMedico.</p>

<div style="text-align:center; margin:30px 0;">
<a href="{{application_url}}" style="background:#0b6b57;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
Review the Opportunity, Compensation &amp; Continue Your Application
</a>
</div>

<p>Selected and approved Referral Partners may also be considered for <strong>AfraMedico-sponsored enrollment</strong> in the <strong>Cross-Border Healthcare Coordination &amp; Medical Tourism Management Certificate Program</strong>, delivered by <strong>Richmond Hill College</strong>.</p>

<p>Certificate sponsorship is selective and subject to eligibility, program availability, and AfraMedico approval.</p>

<p>If you have any questions, our team will be pleased to assist you throughout the application process.</p>

<p>Kind regards,</p>

<p><strong>AfraMedico Partner Network</strong><br>
International Patient Services</p>`;
  const profText = `Dear {{first_name}},

Thank you for your interest in AfraMedico.

The original hourly position advertised on Indeed has now been filled.

Following a professional review of your application, our recruitment team identified that your background, experience, and community profile appear to be well aligned with a professional partnership opportunity within the AfraMedico Global Referral Partner Network.

This opportunity enables approved partners to build a flexible, performance-based income by referring international patients seeking trusted medical treatment abroad, while working independently within their own professional or community networks.

Based on this assessment, we invite you to review the partnership opportunity, eligibility requirements, collaboration process, compensation structure, and application steps by visiting the link below.

Please note that this invitation is separate from the Indeed position you originally applied for and does not constitute an offer of employment. Referral Partners operate as independent collaborators, and participation is subject to application review, due diligence, and formal approval by AfraMedico.

Review the Opportunity, Compensation & Continue Your Application:
{{application_url}}

Selected and approved Referral Partners may also be considered for AfraMedico-sponsored enrollment in the Cross-Border Healthcare Coordination & Medical Tourism Management Certificate Program, delivered by Richmond Hill College.

Certificate sponsorship is selective and subject to eligibility, program availability, and AfraMedico approval.

If you have any questions, our team will be pleased to assist you throughout the application process.

Kind regards,

AfraMedico Partner Network
International Patient Services`;
  const stdHtml = `<p>Dear {{first_name}},</p>

<p>Thank you for your interest in AfraMedico.</p>

<p>The original hourly position advertised on Indeed has now been filled.</p>

<p>Following a professional review of your application, our recruitment team identified that your background, experience, and community profile appear to be well aligned with a professional partnership opportunity within the <strong>AfraMedico Global Referral Partner Network</strong>.</p>

<p><strong>This opportunity enables approved partners to build a flexible, performance-based income by referring international patients seeking trusted medical treatment abroad, while working independently within their own professional or community networks.</strong></p>

<p>Based on this assessment, we invite you to review the partnership opportunity, eligibility requirements, collaboration process, compensation structure, and application steps by visiting the link below.</p>

<p>Please note that this invitation is separate from the Indeed position you originally applied for and does <strong>not</strong> constitute an offer of employment. Referral Partners operate as independent collaborators, and participation is subject to application review, due diligence, and formal approval by AfraMedico.</p>

<div style="text-align:center; margin:30px 0;">
<a href="{{application_url}}" style="background:#0b6b57;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
Review the Opportunity, Compensation &amp; Continue Your Application
</a>
</div>

<p>Selected and approved Referral Partners may also be considered for <strong>AfraMedico-sponsored enrollment</strong> in the <strong>Cross-Border Healthcare Coordination &amp; Medical Tourism Management Certificate Program</strong>, delivered by <strong>Richmond Hill College</strong>.</p>

<p>Certificate sponsorship is selective and subject to eligibility, program availability, and AfraMedico approval.</p>

<p>If you have any questions, our team will be pleased to assist you throughout the application process.</p>

<p>Kind regards,</p>

<p><strong>AfraMedico Partner Network</strong><br>
International Patient Services</p>`;
  const stdText = `Dear {{first_name}},

Thank you for your interest in AfraMedico.

The original hourly position advertised on Indeed has now been filled.

Following a professional review of your application, our recruitment team identified that your background, experience, and community profile appear to be well aligned with a professional partnership opportunity within the AfraMedico Global Referral Partner Network.

This opportunity enables approved partners to build a flexible, performance-based income by referring international patients seeking trusted medical treatment abroad, while working independently within their own professional or community networks.

Based on this assessment, we invite you to review the partnership opportunity, eligibility requirements, collaboration process, compensation structure, and application steps by visiting the link below.

Please note that this invitation is separate from the Indeed position you originally applied for and does not constitute an offer of employment. Referral Partners operate as independent collaborators, and participation is subject to application review, due diligence, and formal approval by AfraMedico.

Review the Opportunity, Compensation & Continue Your Application:
{{application_url}}

Selected and approved Referral Partners may also be considered for AfraMedico-sponsored enrollment in the Cross-Border Healthcare Coordination & Medical Tourism Management Certificate Program, delivered by Richmond Hill College.

Certificate sponsorship is selective and subject to eligibility, program availability, and AfraMedico approval.

If you have any questions, our team will be pleased to assist you throughout the application process.

Kind regards,

AfraMedico Partner Network
International Patient Services`;
  const templates = {
    executive: {
      subject: "Professional Partnership Opportunity – AfraMedico Global Referral Partner Network",
      previewText: "An invitation to explore a separate professional opportunity with AfraMedico.",
      htmlBody: execHtml,
      textBody: execText,
    },
    professional: {
      subject: "Professional Partnership Opportunity – AfraMedico Global Referral Partner Network",
      previewText: "Your experience may be relevant to AfraMedico's Global Referral Partner Network.",
      htmlBody: profHtml,
      textBody: profText,
    },
    standard: {
      subject: "Professional Partnership Opportunity – AfraMedico Global Referral Partner Network",
      previewText: "Explore a separate commission-based collaboration opportunity with AfraMedico.",
      htmlBody: stdHtml,
      textBody: stdText,
    },
  };
  const key = group === "talent_pool" ? "standard" : group;
  const template = templates[key];
  const subject = interpolate(template.subject, prospect);
  const previewText = interpolate(template.previewText, prospect);
  return {
    subject,
    previewText,
    html: htmlShell(subject, previewText, interpolate(template.htmlBody, prospect)),
    text: interpolate(template.textBody, prospect, false),
  };
}

class SmtpFailure extends Error {
  code: string;
  status: number;
  missing?: string[];

  constructor(code: string, message: string, status = 503, missing?: string[]) {
    super(message);
    this.name = "SmtpFailure";
    this.code = code;
    this.status = status;
    this.missing = missing;
  }
}

type SmtpStage = "config" | "client_creation" | "connect" | "authenticate" | "send";

function getSecretPresence() {
  return {
    PARTNER_SMTP_HOST: Boolean(Deno.env.get("PARTNER_SMTP_HOST")),
    PARTNER_SMTP_PORT: Boolean(Deno.env.get("PARTNER_SMTP_PORT")),
    PARTNER_SMTP_USERNAME: Boolean(Deno.env.get("PARTNER_SMTP_USERNAME")),
    PARTNER_SMTP_PASSWORD: Boolean(Deno.env.get("PARTNER_SMTP_PASSWORD")),
    PARTNER_SMTP_FROM_EMAIL: Boolean(Deno.env.get("PARTNER_SMTP_FROM_EMAIL")),
    PARTNER_SMTP_FROM_NAME: Boolean(Deno.env.get("PARTNER_SMTP_FROM_NAME")),
  };
}

function redactSecretValues(value: string) {
  let redacted = value;
  for (const secret of [
    Deno.env.get("PARTNER_SMTP_USERNAME"),
    Deno.env.get("PARTNER_SMTP_PASSWORD"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  ]) {
    if (secret && secret.length >= 4) {
      redacted = redacted.split(secret).join("[REDACTED_SECRET]");
    }
  }
  return redacted;
}

function smtpErrorDetails(error: unknown) {
  const currentError = error as Record<string, unknown> | null;
  return {
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: redactSecretValues(error instanceof Error ? error.message : String(error ?? "Unknown SMTP error")),
    errorCode: currentError?.code ?? null,
    smtpResponseCode: currentError?.responseCode ?? currentError?.statusCode ?? null,
    command: currentError?.command ?? null,
  };
}

function getSmtpConfig() {
  const host = Deno.env.get("PARTNER_SMTP_HOST");
  const portRaw = Deno.env.get("PARTNER_SMTP_PORT");
  const username = Deno.env.get("PARTNER_SMTP_USERNAME");
  const password = Deno.env.get("PARTNER_SMTP_PASSWORD");
  const fromEmail = Deno.env.get("PARTNER_SMTP_FROM_EMAIL");
  const fromName = Deno.env.get("PARTNER_SMTP_FROM_NAME");
  const secureRaw = Deno.env.get("PARTNER_SMTP_SECURE");
  const missing = [
    ["PARTNER_SMTP_HOST", host],
    ["PARTNER_SMTP_PORT", portRaw],
    ["PARTNER_SMTP_USERNAME", username],
    ["PARTNER_SMTP_PASSWORD", password],
    ["PARTNER_SMTP_FROM_EMAIL", fromEmail],
    ["PARTNER_SMTP_FROM_NAME", fromName],
  ].filter(([, currentValue]) => !currentValue).map(([key]) => key);
  if (missing.length > 0) {
    logSmtpDiagnostic("config", new Error(`Missing SMTP secrets: ${missing.join(", ")}`), {
      host,
      port: portRaw ? Number(portRaw) : null,
      secure: null,
    });
    throw new SmtpFailure("SMTP_CONFIG_INCOMPLETE", "SMTP configuration is incomplete.", 503, missing);
  }
  const rawPort = Number(portRaw);
  if (!Number.isFinite(rawPort)) {
    logSmtpDiagnostic("config", new Error("PARTNER_SMTP_PORT is not a valid number"), {
      host,
      port: null,
      secure: null,
    });
    throw new SmtpFailure("SMTP_CONFIG_INCOMPLETE", "SMTP port configuration is invalid.", 503, [
      "PARTNER_SMTP_PORT",
    ]);
  }
  const port = rawPort === 587 ? 465 : rawPort;
  const secure = secureRaw ? secureRaw.toLowerCase() === "true" : port === 465;
  return { host, port, username, password, fromEmail, fromName, secure };
}

function classifySmtpStage(error: unknown): SmtpStage {
  const details = smtpErrorDetails(error);
  const message = `${details.errorMessage} ${details.errorCode ?? ""} ${details.command ?? ""}`.toLowerCase();
  if (message.includes("auth") || message.includes("login") || message.includes("credential") || message.includes("535")) return "authenticate";
  if (message.includes("tls") || message.includes("ssl") || message.includes("handshake") || message.includes("certificate")) return "connect";
  if (message.includes("connect") || message.includes("timeout") || message.includes("network") || message.includes("econn") || message.includes("enotfound") || message.includes("eai_again")) return "connect";
  return "send";
}

function smtpErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown SMTP error";
  const lowered = message.toLowerCase();
  if (lowered.includes("not fully configured") || lowered.includes("not valid")) return "SMTP_CONFIG_INCOMPLETE";
  if (lowered.includes("auth") || lowered.includes("login") || lowered.includes("credential") || lowered.includes("535")) return "SMTP_AUTH_FAILED";
  if (lowered.includes("tls") || lowered.includes("ssl") || lowered.includes("handshake") || lowered.includes("certificate")) return "SMTP_TLS_FAILED";
  if (lowered.includes("connect") || lowered.includes("timeout") || lowered.includes("network") || lowered.includes("econn")) return "SMTP_CONNECTION_FAILED";
  return "SMTP_SEND_FAILED";
}

function safeSmtpFailureReason(error: unknown) {
  const code = error instanceof SmtpFailure ? error.code : smtpErrorCode(error);
  if (code === "SMTP_CONFIG_INCOMPLETE") return "SMTP configuration is incomplete or invalid. Check the Edge Function SMTP secrets.";
  if (code === "SMTP_AUTH_FAILED") return "SMTP authentication failed. Check username, password, and sender account permissions.";
  if (code === "SMTP_TLS_FAILED") return "SMTP TLS connection failed. Check PARTNER_SMTP_PORT and PARTNER_SMTP_SECURE.";
  if (code === "SMTP_CONNECTION_FAILED") return "SMTP connection failed. Check host, port, and provider network access.";
  return "SMTP send failed. Check Edge Function logs and SMTP provider settings.";
}

function safeClientMessage(code: string) {
  if (code === "SMTP_CONFIG_INCOMPLETE") return "SMTP configuration is incomplete.";
  if (code === "SMTP_AUTH_FAILED") return "SMTP authentication failed.";
  if (code === "SMTP_CONNECTION_FAILED") return "Could not connect to the SMTP server.";
  if (code === "SMTP_TLS_FAILED") return "SMTP TLS negotiation failed.";
  return "SMTP server rejected the message.";
}

function logSmtpDiagnostic(
  stage: SmtpStage,
  error: unknown,
  config: { host?: string | null; port?: number | null; secure?: boolean | null },
) {
  const details = smtpErrorDetails(error);
  console.error("partner prospect SMTP diagnostic", JSON.stringify({
    stage,
    ...details,
    hostname: config.host ?? null,
    port: config.port ?? null,
    secure: config.secure,
    secretsPresent: getSecretPresence(),
  }));
}

async function sendTestPreviewEmail(testEmail: string, prospect: Prospect) {
  let config: ReturnType<typeof getSmtpConfig>;
  try {
    config = getSmtpConfig();
  } catch (error) {
    if (error instanceof SmtpFailure) throw error;
    logSmtpDiagnostic("config", error, { host: null, port: null, secure: null });
    throw new SmtpFailure("SMTP_CONFIG_INCOMPLETE", safeClientMessage("SMTP_CONFIG_INCOMPLETE"));
  }
  const email = renderEmail(prospect);
  let client: SMTPClient;
  try {
    client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure,
        auth: { username: config.username, password: config.password },
      },
      pool: false,
    });
  } catch (error) {
    logSmtpDiagnostic("client_creation", error, config);
    throw new SmtpFailure("SMTP_CONNECTION_FAILED", safeClientMessage("SMTP_CONNECTION_FAILED"));
  }
  try {
    await client.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: testEmail,
      subject: email.subject,
      content: email.text,
      html: email.html,
    });
  } catch (error) {
    const stage = classifySmtpStage(error);
    const code = smtpErrorCode(error);
    logSmtpDiagnostic(stage, error, config);
    throw new SmtpFailure(code, safeClientMessage(code));
  } finally {
    try { await client.close(); } catch { /* ignore close errors */ }
  }
}

async function sendInvitationEmail(prospect: Prospect) {
  let config: ReturnType<typeof getSmtpConfig>;
  try {
    config = getSmtpConfig();
  } catch (error) {
    if (error instanceof SmtpFailure) throw error;
    logSmtpDiagnostic("config", error, { host: null, port: null, secure: null });
    throw new SmtpFailure("SMTP_CONFIG_INCOMPLETE", safeClientMessage("SMTP_CONFIG_INCOMPLETE"));
  }
  const email = renderEmail(prospect);
  let client: SMTPClient;
  try {
    client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure,
        auth: { username: config.username, password: config.password },
      },
      pool: false,
    });
  } catch (error) {
    logSmtpDiagnostic("client_creation", error, config);
    throw new SmtpFailure("SMTP_CONNECTION_FAILED", safeClientMessage("SMTP_CONNECTION_FAILED"));
  }
  try {
    await client.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: prospect.email,
      subject: email.subject,
      content: email.text,
      html: email.html,
    });
  } catch (error) {
    const stage = classifySmtpStage(error);
    const code = smtpErrorCode(error);
    logSmtpDiagnostic(stage, error, config);
    throw new SmtpFailure(code, safeClientMessage(code));
  } finally {
    try { await client.close(); } catch { /* ignore close errors */ }
  }
}

type InvitationRequestBody = {
  action?: string;
  mode?: string;
  prospectIds?: unknown;
  testEmail?: unknown;
};

function parseProspectIds(body: InvitationRequestBody) {
  return Array.isArray(body.prospectIds)
    ? body.prospectIds.filter((id: unknown): id is string => typeof id === "string")
    : [];
}

async function handleSendTestRequest(
  admin: ReturnType<typeof createClient>,
  organizationId: string,
  body: InvitationRequestBody,
) {
  const prospectIds = parseProspectIds(body);
  const testEmail = typeof body.testEmail === "string" ? body.testEmail.trim() : "";
  if (prospectIds.length === 0) return json({ error: "At least one prospect is required" }, 400);
  if (!testEmail) return json({ error: "Test email address is required" }, 400);
  const { data: prospects, error: prospectsError } = await admin
    .from("partner_prospects")
    .select("*")
    .eq("organization_id", organizationId)
    .in("id", [prospectIds[0]]);
  if (prospectsError) {
    console.error("partner prospect lookup failed:", prospectsError.message);
    return json({ error: "Unable to load selected prospect" }, 500);
  }
  const prospect = ((prospects ?? []) as Prospect[])[0];
  if (!prospect) return json({ error: "Selected prospect was not found" }, 404);
  const failedReasons = new Set<string>();
  try {
    await sendTestPreviewEmail(testEmail, prospect);
    return json({ sent: 1, failed: 0, excluded: 0, duplicateWarnings: 0, failedReasons: [], message: "Test email completed." });
  } catch (error) {
    failedReasons.add(safeSmtpFailureReason(error));
    if (error instanceof SmtpFailure) {
      return json({ error: error.code, message: error.message, missing: error.missing, sent: 0, failed: 1, excluded: 0, duplicateWarnings: 0, failedReasons: Array.from(failedReasons) }, error.status);
    }
    return json({ error: "SMTP_SEND_FAILED", message: "SMTP server rejected the message.", sent: 0, failed: 1, excluded: 0, duplicateWarnings: 0, failedReasons: Array.from(failedReasons) }, 503);
  }
}

async function handleSendInvitationsRequest(
  admin: ReturnType<typeof createClient>,
  organizationId: string,
  body: InvitationRequestBody,
) {
  const prospectIds = parseProspectIds(body);
  if (prospectIds.length === 0) return json({ error: "At least one prospect is required" }, 400);
  if (prospectIds.length > 20) return json({ error: "Bulk sends are limited to 20 recipients per action" }, 400);
  const { data: prospects, error: prospectsError } = await admin
    .from("partner_prospects")
    .select("*")
    .eq("organization_id", organizationId)
    .in("id", prospectIds);
  if (prospectsError) {
    console.error("partner prospect lookup failed:", prospectsError.message);
    return json({ error: "Unable to load selected prospects" }, 500);
  }
  let sent = 0;
  let failed = 0;
  let excluded = 0;
  let duplicateWarnings = 0;
  const failedReasons = new Set<string>();
  for (const prospect of (prospects ?? []) as Prospect[]) {
    const isTalentPool = normalizeCampaignGroup(prospect.email_campaign_group) === "talent_pool";
    const alreadySent = prospect.outreach_status === "email_sent";
    if (isTalentPool) { excluded += 1; continue; }
    if (alreadySent) { duplicateWarnings += 1; continue; }
    try {
      await sendInvitationEmail(prospect);
      sent += 1;
      await admin
        .from("partner_prospects")
        .update({ outreach_status: "email_sent", invitation_sent_at: new Date().toISOString(), last_email_status: "sent" })
        .eq("id", prospect.id)
        .eq("organization_id", organizationId);
    } catch (error) {
      failed += 1;
      failedReasons.add(safeSmtpFailureReason(error));
      await admin
        .from("partner_prospects")
        .update({ last_email_status: "failed" })
        .eq("id", prospect.id)
        .eq("organization_id", organizationId);
      if (error instanceof SmtpFailure) {
        return json({ error: error.code, message: error.message, missing: error.missing, sent, failed, excluded, duplicateWarnings, failedReasons: Array.from(failedReasons) }, error.status);
      }
    }
  }
  return json({ sent, failed, excluded, duplicateWarnings, failedReasons: Array.from(failedReasons), message: "Invitation send completed." });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Authentication required" }, 401);
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: caller, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !caller.user) return json({ error: "Invalid session" }, 401);
    const organizationId = (caller.user.app_metadata ?? {})["organization_id"];
    if (typeof organizationId !== "string" || !organizationId) return json({ error: "Staff organization context is required" }, 403);
    const body = (await req.json()) as InvitationRequestBody;
    const action = body.action || (body.mode === "test" ? "send_test" : "send_invitations");
    if (action === "send_test") return await handleSendTestRequest(admin, organizationId, body);
    if (action === "send_invitations") return await handleSendInvitationsRequest(admin, organizationId, body);
    return json({ error: "Unsupported invitation action" }, 400);
  } catch (error) {
    const details = smtpErrorDetails(error);
    console.error("partner-prospect-invitations failed", JSON.stringify({ ...details, secretsPresent: getSecretPresence() }));
    if (error instanceof SmtpFailure) return json({ error: error.code, message: error.message, missing: error.missing }, error.status);
    return json({ error: "EDGE_FUNCTION_RUNTIME_ERROR", message: "Partner prospect invitation action failed." }, 500);
  }
});
