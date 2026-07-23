import type {
  PartnerProspect,
  PartnerProspectEmailRender,
  PartnerProspectEmailTemplateType,
} from "../types/partnerProspect";

const applicationUrl = "https://www.aframedico.com/global-referral-partner-network";
const sponsorshipSentence =
  "Selected and approved Referral Partners may be considered for AfraMedico-sponsored enrollment in the Cross-Border Healthcare Coordination & Medical Tourism Management course delivered by Richmond Hill College.";
const employmentDisclaimer =
  "This invitation is separate from the Indeed employment position you originally applied for and does not constitute an offer of employment.";
const applicationRequirement =
  "Participation requires submitting an application, AfraMedico review, and formal approval before any referral partner activity may begin.";

type TemplateDefinition = {
  subject: string;
  previewText: string;
  htmlBody: string;
  textBody: string;
  variablesUsed: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function prospectValue(prospect: PartnerProspect, key: string) {
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

function interpolate(template: string, prospect: PartnerProspect, escape = true) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
    const value = prospectValue(prospect, key);
    return escape ? escapeHtml(value) : value;
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

const templates: Record<PartnerProspectEmailTemplateType, TemplateDefinition> = {
  executive: {
    subject: "Your Professional Background Caught Our Attention",
    previewText: "An invitation to explore a separate professional opportunity with AfraMedico.",
    variablesUsed: ["first_name", "reason_for_assignment", "recommended_role"],
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
    variablesUsed: ["first_name", "profession", "country"],
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
    variablesUsed: ["first_name"],
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

export function getTemplateType(prospect: PartnerProspect): PartnerProspectEmailTemplateType {
  const campaign = `${prospect.personalized_email_type || prospect.email_campaign_group || ""}`.toLowerCase();
  if (campaign.includes("executive")) return "executive";
  if (campaign.includes("professional")) return "professional";
  return "standard";
}

export function renderPartnerProspectEmail(prospect: PartnerProspect): PartnerProspectEmailRender {
  const template = templates[getTemplateType(prospect)];
  const body = interpolate(template.htmlBody, prospect);
  const subject = interpolate(template.subject, prospect);
  const previewText = interpolate(template.previewText, prospect);

  return {
    subject,
    previewText,
    html: htmlShell(subject, previewText, body),
    text: interpolate(template.textBody, prospect, false),
    variablesUsed: template.variablesUsed,
  };
}
