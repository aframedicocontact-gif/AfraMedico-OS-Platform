import { getDevelopmentOrganizationContext } from "../lib/currentOrganization";
import {
  callSupabaseFunction,
  mutateSupabaseTable,
  querySupabaseTable,
  supabaseConfig,
} from "../lib/supabaseClient";
import type {
  PartnerProspect,
  PartnerProspectImportCandidate,
  PartnerProspectImportPreview,
  PartnerProspectImportSummary,
  PartnerProspectOutreachStatus,
  PartnerProspectSendResult,
} from "../types/partnerProspect";
import { getSession } from "./authService";
import { readXlsxWorkbook } from "./xlsxWorkbookReader";

const allCandidatesSheetName = "All Candidates";
const doNotContactGroup = "Talent Pool (Do Not Contact)";

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getOrganizationId(sessionOrganizationId?: unknown) {
  if (typeof sessionOrganizationId === "string" && sessionOrganizationId.trim()) {
    return sessionOrganizationId.trim();
  }

  return getDevelopmentOrganizationContext().id;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

function cleanString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseScore(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function normalizePartnerProspectCampaignGroup(value: string) {
  const normalized = value.replace(/[\u2013\u2014]/g, "-").replace(/\s+/g, " ").trim();
  const lowered = normalized.toLowerCase();

  if (!normalized) return "Standard Invitation";
  if (lowered.includes("do not contact") || lowered.includes("talent pool")) return doNotContactGroup;
  if (lowered.includes("vip") || lowered.includes("executive")) return "Executive Invitation";
  if (lowered.includes("priority") || lowered.includes("professional")) return "Professional Invitation";
  if (lowered.includes("standard")) return "Standard Invitation";
  return "Standard Invitation";
}

function normalizeOutreachStatus(value: string): PartnerProspectOutreachStatus {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  const allowed: PartnerProspectOutreachStatus[] = [
    "new",
    "email_sent",
    "applied",
    "approved",
    "active",
    "declined",
    "held",
  ];

  return allowed.includes(normalized as PartnerProspectOutreachStatus)
    ? (normalized as PartnerProspectOutreachStatus)
    : "new";
}

function extractCountry(row: Record<string, unknown>) {
  const estimatedHomeCountry = cleanString(row.estimated_home_country);
  if (estimatedHomeCountry) return estimatedHomeCountry;

  const location = cleanString(row.location);
  if (!location) return "";

  const parts = location
    .split(/[\/,]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts[parts.length - 1] ?? location;
}

function extractCity(row: Record<string, unknown>) {
  const location = cleanString(row.location);
  if (!location) return "";
  return location.split(/[\/,]/)[0]?.trim() ?? "";
}

function rowToProspect(row: Record<string, unknown>): PartnerProspectImportCandidate {
  const fullName = cleanString(row.candidate_name);
  const nameParts = splitName(fullName);
  const campaignGroup = normalizePartnerProspectCampaignGroup(cleanString(row.email_campaign_group));
  const personalizedEmailType = normalizePartnerProspectCampaignGroup(cleanString(row.personalized_email_type));

  return {
    first_name: nameParts.firstName || null,
    last_name: nameParts.lastName || null,
    full_name: fullName,
    email: normalizeEmail(cleanString(row.email)),
    phone: cleanString(row.phone) || null,
    country: extractCountry(row) || null,
    city: extractCity(row) || null,
    profession: cleanString(row.current_role_title) || null,
    recommended_role: cleanString(row.recommended_role_partner_type) || null,
    overall_suitability_score: parseScore(row.overall_partner_suitability_score_0_100),
    email_campaign_group: campaignGroup,
    contact_priority: cleanString(row.contact_priority) || null,
    personalized_email_type: personalizedEmailType || campaignGroup,
    reason_for_assignment:
      cleanString(row.reason_for_assignment) ||
      cleanString(row.key_strengths_reasoning) ||
      cleanString(row.recommendation) ||
      null,
    source: `AfraMedico Partner Prospects workbook${cleanString(row.batch) ? ` / ${cleanString(row.batch)}` : ""}`,
    outreach_status: normalizeOutreachStatus(cleanString(row.outreach_status)),
    invitation_sent_at: null,
    last_email_status: null,
  };
}

function normalizeRows(rows: unknown[][]) {
  if (rows.length < 2) return [];
  const [headerRow, ...rawDataRows] = rows;
  const headers = headerRow.map((header) => normalizeHeader(cleanString(header)));
  const dataRows = [...rawDataRows];

  while (dataRows.length > 0 && dataRows[dataRows.length - 1].every((cell) => !cleanString(cell))) {
    dataRows.pop();
  }

  return dataRows.map((row) => {
    const result: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      result[header] = row[index];
    });
    return result;
  });
}

export async function parsePartnerProspectWorkbook(
  file: File,
  existingProspects: PartnerProspect[],
): Promise<PartnerProspectImportPreview> {
  const workbook = await readXlsxWorkbook(file);
  const sheet = workbook.find((item) => item.name === allCandidatesSheetName) ?? workbook[0];
  const rows = sheet?.rows ?? [];
  const existingEmails = new Set(existingProspects.map((prospect) => normalizeEmail(prospect.email)));
  const seenEmails = new Set<string>();
  const duplicateEmails: string[] = [];
  const invalidReasons: string[] = [];
  let missingEmailRecords = 0;
  let invalidRecords = 0;

  const importableRecords: PartnerProspectImportCandidate[] = [];
  const normalizedRows = normalizeRows(rows);

  normalizedRows.forEach((row, index) => {
    const prospect = rowToProspect(row);
    const rowNumber = index + 2;

    if (!prospect.full_name && !prospect.email) {
      invalidRecords += 1;
      invalidReasons.push(`Row ${rowNumber}: empty candidate row.`);
      return;
    }

    if (!prospect.email) {
      missingEmailRecords += 1;
      invalidReasons.push(`Row ${rowNumber}: missing email address.`);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prospect.email)) {
      invalidRecords += 1;
      invalidReasons.push(`Row ${rowNumber}: invalid email address ${prospect.email}.`);
      return;
    }

    if (!prospect.full_name) {
      invalidRecords += 1;
      invalidReasons.push(`Row ${rowNumber}: missing candidate name.`);
      return;
    }

    if (existingEmails.has(prospect.email) || seenEmails.has(prospect.email)) {
      duplicateEmails.push(prospect.email);
      seenEmails.add(prospect.email);
      return;
    }

    seenEmails.add(prospect.email);
    importableRecords.push(prospect);
  });

  return {
    totalRows: normalizedRows.length,
    validRecords: importableRecords.length,
    duplicateRecords: duplicateEmails.length,
    missingEmailRecords,
    invalidRecords,
    importableRecords,
    duplicateEmails,
    invalidReasons,
  };
}

export async function listPartnerProspects(limit = 500): Promise<ServiceResult<PartnerProspect[]>> {
  const result = await querySupabaseTable<PartnerProspect[]>("partner_prospects", {
    select: "*",
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data) {
    return { data: null, error: result.error ?? "Unable to load Partner Prospects." };
  }

  return { data: result.data, error: null };
}

export async function importPartnerProspects(
  candidates: PartnerProspectImportCandidate[],
): Promise<ServiceResult<PartnerProspectImportSummary>> {
  const session = await getSession();
  const organizationId = getOrganizationId(session?.user?.app_metadata?.organization_id);

  if (!organizationId) {
    return {
      data: null,
      error: "No organization_id is available for the current staff session.",
    };
  }

  const payload = candidates.map((candidate) => ({
    ...candidate,
    organization_id: organizationId,
    outreach_status: candidate.outreach_status ?? "new",
    invitation_sent_at: null,
    last_email_status: null,
  }));

  if (payload.length === 0) {
    return {
      data: { imported: 0, duplicates: 0, skipped: 0, errors: [] },
      error: null,
    };
  }

  const result = await mutateSupabaseTable<PartnerProspect[]>("partner_prospects", "POST", payload);

  if (result.error || !result.data) {
    const errorMessage = result.error ?? "Unable to import partner prospects.";
    const duplicateError = errorMessage.toLowerCase().includes("duplicate") || errorMessage.includes("23505");
    return {
      data: null,
      error: duplicateError
        ? "One or more prospect emails already exist. Refresh prospects and retry the import."
        : errorMessage,
    };
  }

  return {
    data: {
      imported: result.data.length,
      duplicates: 0,
      skipped: candidates.length - result.data.length,
      errors: [],
    },
    error: null,
  };
}

export async function sendPartnerProspectTestPreview(input: {
  prospectIds: string[];
  testEmail: string;
}): Promise<ServiceResult<PartnerProspectSendResult>> {
  if (!supabaseConfig.isConfigured) {
    return {
      data: null,
      error: "Supabase is not configured. Invitation sending requires the secure Edge Function.",
    };
  }

  const result = await callSupabaseFunction<PartnerProspectSendResult>(
    "partner-prospect-invitations",
    { action: "send_test", ...input },
  );

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ?? "Unable to send partner prospect test preview.",
    };
  }

  return { data: result.data, error: null };
}

export async function sendPartnerProspectInvitations(input: {
  prospectIds: string[];
}): Promise<ServiceResult<PartnerProspectSendResult>> {
  if (!supabaseConfig.isConfigured) {
    return {
      data: null,
      error: "Supabase is not configured. Invitation sending requires the secure Edge Function.",
    };
  }

  const result = await callSupabaseFunction<PartnerProspectSendResult>(
    "partner-prospect-invitations",
    { action: "send_invitations", ...input },
  );

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ?? "Unable to send partner prospect invitations.",
    };
  }

  return { data: result.data, error: null };
}

export function isDoNotContactProspect(prospect: PartnerProspect) {
  return normalizePartnerProspectCampaignGroup(prospect.email_campaign_group ?? "") === doNotContactGroup;
}

export function canSendProspectInvitation(prospect: PartnerProspect) {
  return !isDoNotContactProspect(prospect) && prospect.outreach_status !== "email_sent";
}
