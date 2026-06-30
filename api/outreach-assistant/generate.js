function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function parseRequestBody(request) {
  if (!request.body) return {};
  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return {};
    }
  }
  return request.body;
}

function sanitizeText(value, maxLength = 1200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDrafts(value) {
  return {
    professionalEmail: sanitizeText(value?.professionalEmail, 5000),
    linkedinMessage: sanitizeText(value?.linkedinMessage, 2000),
    whatsappMessage: sanitizeText(value?.whatsappMessage, 2000),
    meetingRequest: sanitizeText(value?.meetingRequest, 3000),
    followUpEmail: sanitizeText(value?.followUpEmail, 4000),
  };
}

function buildOrganizationContext(organization) {
  return {
    name: sanitizeText(organization?.name),
    country: sanitizeText(organization?.country),
    category: sanitizeText(organization?.category),
    status: sanitizeText(organization?.status),
    priority: sanitizeText(organization?.priority),
    website: sanitizeText(organization?.website),
    linkedin: sanitizeText(organization?.linkedin),
    contactName: sanitizeText(organization?.contactName),
    email: sanitizeText(organization?.email),
    opportunityType: sanitizeText(organization?.opportunityType),
    domainRating: sanitizeNumber(organization?.domainRating),
    nextStep: sanitizeText(organization?.nextStep),
    notes: sanitizeText(organization?.notes),
    description: sanitizeText(organization?.description),
    medicalSpecialty: sanitizeText(organization?.medicalSpecialty),
    treatmentFocus: sanitizeText(organization?.treatmentFocus),
    organizationType: sanitizeText(organization?.organizationType),
    partnershipType: sanitizeText(organization?.partnershipType),
    verificationStatus: sanitizeText(organization?.verificationStatus),
    aiSummary: sanitizeText(organization?.aiSummary),
  };
}

function buildPrompt(organization) {
  return {
    task: "Generate editable outreach drafts for AfraMedico authority and partnership outreach.",
    strictRules: [
      "Return JSON only. No markdown.",
      "Do not claim a message has been sent.",
      "Do not invent names, phone numbers, emails, meetings, commitments, partnerships, credentials, or facts.",
      "If a contact name is missing or marked as unknown, address the organization generally.",
      "Use only the supplied organization context.",
      "Keep the tone professional, respectful, concise, and suitable for an internal business development team to edit.",
      "AfraMedico is an international medical tourism and care coordination platform.",
      "Drafts must be editable and should not include placeholders for API-generated fake facts.",
    ],
    organization,
    responseShape: {
      professionalEmail: "string",
      linkedinMessage: "string",
      whatsappMessage: "string",
      meetingRequest: "string",
      followUpEmail: "string",
    },
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const aiProvider = process.env.AI_PROVIDER || "openai";
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (aiProvider !== "openai" || !openAiApiKey) {
    return sendJson(response, 503, {
      error: "AI Outreach Assistant is not configured. Add OPENAI_API_KEY in Vercel environment variables.",
    });
  }

  const body = parseRequestBody(request);
  const organization = buildOrganizationContext(body.organization);

  if (!organization.name) {
    return sendJson(response, 400, { error: "Organization is required." });
  }

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You generate factual, editable business outreach drafts. You never send messages, never invent unsupported facts, and always return valid JSON.",
          },
          {
            role: "user",
            content: JSON.stringify(buildPrompt(organization)),
          },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      return sendJson(response, 502, { error: "OpenAI draft generation failed." });
    }

    const payload = await openAiResponse.json();
    const content = payload.choices?.[0]?.message?.content;
    const parsed = content ? JSON.parse(content) : {};

    return sendJson(response, 200, { drafts: normalizeDrafts(parsed) });
  } catch {
    return sendJson(response, 502, { error: "AI Outreach Assistant failed to generate drafts." });
  }
}
