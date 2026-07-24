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
    subject: "Professional Partnership Opportunity – AfraMedico Global Referral Partner Network",
    previewText: "An invitation to explore a separate professional opportunity with AfraMedico.",
    variablesUsed: ["first_name", "reason_for_assignment", "recommended_role"],
    htmlBody: `
      <p>Dear {{first_name}},</p>
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
      <p><strong>AfraMedico Partner Network</strong><br>International Patient Services</p>
    `,
    textBody: `
Dear {{first_name}},

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
International Patient Services
    `.trim(),
  },
  professional: {
    subject: "Professional Partnership Opportunity – AfraMedico Global Referral Partner Network",
    previewText: "Your experience may be relevant to AfraMedico’s Global Referral Partner Network.",
    variablesUsed: ["first_name", "profession", "country"],
    htmlBody: `
      <p>Dear {{first_name}},</p>
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
      <p><strong>AfraMedico Partner Network</strong><br>International Patient Services</p>
    `,
    textBody: `
Dear {{first_name}},

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
International Patient Services
    `.trim(),
  },
  standard: {
    subject: "Professional Partnership Opportunity – AfraMedico Global Referral Partner Network",
    previewText: "Explore a separate commission-based collaboration opportunity with AfraMedico.",
    variablesUsed: ["first_name"],
    htmlBody: `
      <p>Dear {{first_name}},</p>
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
      <p><strong>AfraMedico Partner Network</strong><br>International Patient Services</p>
    `,
    textBody: `
Dear {{first_name}},

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
International Patient Services
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
