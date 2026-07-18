import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export interface SendExecutedAgreementEmailInput {
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

export async function sendExecutedAgreementEmail(input: SendExecutedAgreementEmailInput): Promise<void> {
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
