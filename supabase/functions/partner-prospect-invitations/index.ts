import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function value(prospect: Prospect, key: string) {
  const values: Record<string, string> = {
    first_name: prospect.first_name || prospect.full_name.split(" ")[0] || "there",
    full_name: prospect.full_name,
    country: prospect.country || "your community",
    profession: prospect.profession || "your professional background",
    recommended_role: prospect.recommended_role || "AfraMedico referral partner",
    reason_for_assignment: prospect.reason_for_assignment || "your experience and community reach stood out in our review",
    application_url: applicationUrl,
  };

  return values[key] ?? "";
}

function interpolate(template: string, prospect: Prospect, escape = true) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
    const nextValue = value(prospect, key);
    return escape ? escapeHtml(nextValue) : nextValue;
  });
}

function htmlShell(title: string, previewText: string, body: string) {
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f6faf8;font-family:Arial,sans-serif;color:#063d31;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6faf8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #d8eee5;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="background:#064635;padding:22px 28px;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#a7f3d0;">AfraMedico</div>
                <div style="font-size:22px;font-weight:700;margin-top:4px;">Global Referral Partner Network</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;line-height:1.58;font-size:15px;">
                ${body}
                <p style="margin:28px 0;">
                  <a href="${applicationUrl}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;padding:13px 18px;border-radius:7px;font-weight:700;">Apply to Join the Network</a>
                </p>
                <p style="font-size:13px;color:#64748b;margin-top:24px;">${sponsorshipSentence} Sponsorship is selective and is not guaranteed.</p>
                <p style="font-size:13px;color:#64748b;margin-top:16px;">AfraMedico Partner Network</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function renderEmail(prospect: Prospect) {
  const group = normalizeCampaignGroup(prospect.personalized_email_type || prospect.email_campaign_group);

  const templates = {
    executive: {
      subject: "Your Professional Background Caught Our Attention",
      previewText: "An invitation to explore a separate professional opportunity with AfraMedico.",
      htmlBody: `
        <p>Dear {{first_name}},</p>
        <p>Thank you for your interest in AfraMedico. The original hourly Indeed position has been filled.</p>
        <p>We reviewed your background and believe there may be a separate commission-based collaboration opportunity worth exploring through the AfraMedico Global Referral Partner Network.</p>
        <p>Based on our review, {{reason_for_assignment}}. This may align with the role of <strong>{{recommended_role}}</strong>.</p>
        <p>${employmentDisclaimer}</p>
        <p>${applicationRequirement}</p>
      `,
      textBody: `
Dear {{first_name}},

Thank you for your interest in AfraMedico. The original hourly Indeed position has been filled.

We reviewed your background and believe there may be a separate commission-based collaboration opportunity worth exploring through the AfraMedico Global Referral Partner Network.

Based on our review, {{reason_for_assignment}}. This may align with the role of {{recommended_role}}.

${employmentDisclaimer}

${applicationRequirement}

${sponsorshipSentence} Sponsorship is selective and is not guaranteed.

Apply to Join the Network:
{{application_url}}

AfraMedico Partner Network
      `.trim(),
    },
    professional: {
      subject: "A Professional Opportunity with AfraMedico",
      previewText: "Your experience may be relevant to AfraMedico’s Global Referral Partner Network.",
      htmlBody: `
        <p>Dear {{first_name}},</p>
        <p>Thank you for your interest in AfraMedico. The original hourly Indeed position has been filled.</p>
        <p>Your experience in {{profession}} may be relevant to a separate commission-based collaboration opportunity with AfraMedico.</p>
        <p>AfraMedico is building a Global Referral Partner Network for trusted professionals who may help patients and families learn about coordinated international healthcare options. If selected and approved, you may collaborate with AfraMedico as a Referral Partner in or connected to {{country}}.</p>
        <p>${employmentDisclaimer}</p>
        <p>${applicationRequirement}</p>
      `,
      textBody: `
Dear {{first_name}},

Thank you for your interest in AfraMedico. The original hourly Indeed position has been filled.

Your experience in {{profession}} may be relevant to a separate commission-based collaboration opportunity with AfraMedico.

AfraMedico is building a Global Referral Partner Network for trusted professionals who may help patients and families learn about coordinated international healthcare options. If selected and approved, you may collaborate with AfraMedico as a Referral Partner in or connected to {{country}}.

${employmentDisclaimer}

${applicationRequirement}

${sponsorshipSentence} Sponsorship is selective and is not guaranteed.

Apply to Join the Network:
{{application_url}}

AfraMedico Partner Network
      `.trim(),
    },
    standard: {
      subject: "Invitation to Join the AfraMedico Global Referral Partner Network",
      previewText: "Explore a separate commission-based collaboration opportunity with AfraMedico.",
      htmlBody: `
        <p>Dear {{first_name}},</p>
        <p>Thank you for your interest in AfraMedico. The original hourly Indeed position has been filled.</p>
        <p>We would like to invite you to apply for a separate commission-based collaboration opportunity through the AfraMedico Global Referral Partner Network.</p>
        <p>Approved Referral Partners may introduce patients who need international medical coordination and may collaborate with AfraMedico under the approved partner framework.</p>
        <p>${employmentDisclaimer}</p>
        <p>${applicationRequirement}</p>
      `,
      textBody: `
Dear {{first_name}},

Thank you for your interest in AfraMedico. The original hourly Indeed position has been filled.

We would like to invite you to apply for a separate commission-based collaboration opportunity through the AfraMedico Global Referral Partner Network.

Approved Referral Partners may introduce patients who need international medical coordination and may collaborate with AfraMedico under the approved partner framework.

${employmentDisclaimer}

${applicationRequirement}

${sponsorshipSentence} Sponsorship is selective and is not guaranteed.

Apply to Join the Network:
{{application_url}}

AfraMedico Partner Network
      `.trim(),
    },
  };

  const template = group === "talent_pool" ? templates.standard : templates[group];
  const subject = interpolate(template.subject, prospect);
  const previewText = interpolate(template.previewText, prospect);

  return {
    subject,
    previewText,
    html: htmlShell(subject, previewText, interpolate(template.htmlBody, prospect)),
    text: interpolate(template.textBody, prospect, false),
  };
}

function getSmtpConfig() {
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
  if (!Number.isFinite(port)) throw new Error("PARTNER_SMTP_PORT is not valid");

  return { host, port, username, password, fromEmail, fromName };
}

async function sendEmail(to: string, prospect: Prospect) {
  const config = getSmtpConfig();
  const email = renderEmail(prospect);
  const client = new SMTPClient({
    connection: {
      hostname: config.host,
      port: config.port,
      tls: true,
      auth: {
        username: config.username,
        password: config.password,
      },
    },
  });

  try {
    await client.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to,
      subject: email.subject,
      content: email.text,
      html: email.html,
    });
  } finally {
    await client.close();
  }
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

    const organizationId = caller.user.app_metadata?.organization_id;
    if (typeof organizationId !== "string" || !organizationId) {
      return json({ error: "Staff organization context is required" }, 403);
    }

    const body = await req.json();
    const prospectIds = Array.isArray(body.prospectIds)
      ? body.prospectIds.filter((id: unknown): id is string => typeof id === "string")
      : [];
    const mode = body.mode === "test" ? "test" : "send";
    const testEmail = typeof body.testEmail === "string" ? body.testEmail.trim() : "";

    if (prospectIds.length === 0) return json({ error: "At least one prospect is required" }, 400);
    if (mode === "send" && prospectIds.length > 20) return json({ error: "Bulk sends are limited to 20 recipients per action" }, 400);
    if (mode === "test" && !testEmail) return json({ error: "Test email address is required" }, 400);

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
    const sendTargets = (prospects ?? []) as Prospect[];

    for (const prospect of sendTargets) {
      const isTalentPool = normalizeCampaignGroup(prospect.email_campaign_group) === "talent_pool";
      const alreadySent = prospect.outreach_status === "email_sent";

      if (isTalentPool) {
        excluded += 1;
        continue;
      }
      if (alreadySent && mode === "send") {
        duplicateWarnings += 1;
        continue;
      }

      try {
        await sendEmail(mode === "test" ? testEmail : prospect.email, prospect);
        sent += 1;

        if (mode === "send") {
          await admin
            .from("partner_prospects")
            .update({
              outreach_status: "email_sent",
              invitation_sent_at: new Date().toISOString(),
              last_email_status: "sent",
            })
            .eq("id", prospect.id)
            .eq("organization_id", organizationId);
        }
      } catch (error) {
        failed += 1;
        console.error("partner prospect email failed:", error instanceof Error ? error.message : "Unknown SMTP error");

        if (mode === "send") {
          await admin
            .from("partner_prospects")
            .update({ last_email_status: "failed" })
            .eq("id", prospect.id)
            .eq("organization_id", organizationId);
        }
      }
    }

    return json({
      sent,
      failed,
      excluded,
      duplicateWarnings,
      message: mode === "test" ? "Test email completed." : "Invitation send completed.",
    });
  } catch (error) {
    console.error("partner-prospect-invitations failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Partner prospect invitation action failed" }, 500);
  }
});
