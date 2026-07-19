import { countryOptions } from "../data/countryDataset";
import { getDevelopmentOrganizationContext } from "../lib/currentOrganization";
import { supabaseConfig, querySupabaseTable } from "../lib/supabaseClient";
import type {
  CaseStatus,
  HospitalQuoteStatus,
  Lead,
  LeadPipelineStage,
  LeadPriority,
  LeadSource,
  LeadStatus,
  MedicalReviewStatus,
} from "../types/lead";
import { getSession } from "./authService";

const STORAGE_KEY = "aframedico.development.leads";

type LeadServiceSource = "live" | "development" | "unavailable";

export type LeadServiceResult<T> = {
  data: T | null;
  error: string | null;
  source: LeadServiceSource;
};

export type CreateLeadInput = {
  patientId: string;
  patientName: string;
  dateOfBirth: string;
  country: string;
  city: string;
  nationality: string;
  phoneCountryCode: string;
  phoneLocalNumber: string;
  phone: string;
  whatsappCountryCode: string;
  whatsappLocalNumber: string;
  whatsapp: string;
  email: string;
  confirmEmail: string;
  emailVerified: "Yes" | "No";
  emailVerificationStatus: "Unverified" | "Mismatch" | "Verified";
  age: string;
  gender: string;
  preferredLanguage: string;
  leadSource: LeadSource;
  interestedTreatment: string;
  medicalCondition: string;
  medicalHistory: string;
  urgency: LeadPriority;
  preferredDestination: string;
  referralPartner: string;
  hospital: string;
  caseId: string;
  assignedCoordinator: string;
  caseStatus: CaseStatus;
  currentStatus: LeadStatus;
  documentsReceived: "Yes" | "No";
  medicalReviewStatus: MedicalReviewStatus;
  hospitalQuoteStatus: HospitalQuoteStatus;
  estimatedTreatmentCost: string;
  expectedTravelDate: string;
  priority: LeadPriority;
  lastContact: string;
  nextFollowUp: string;
  internalNotes: string;
};

export type LeadValidationResult = {
  valid: boolean;
  errors: string[];
};

export type LeadDuplicateResult = {
  hasDuplicate: boolean;
  matches: Lead[];
};

type BackendLeadRow = {
  id: string;
  organization_id: string;
  lead_code: string;
  patient_id: string | null;
  patient_reference_code: string;
  source_referral_id: string | null;
  partner_id: string | null;
  partner_code: string | null;
  acquisition_source: string;
  submission_channel: string;
  patient_full_name: string;
  date_of_birth: string | null;
  country: string;
  city: string | null;
  nationality: string | null;
  gender: string | null;
  preferred_language: string | null;
  primary_email: string | null;
  phone_country_code: string | null;
  phone_local_number: string | null;
  phone_e164: string | null;
  whatsapp_country_code: string | null;
  whatsapp_local_number: string | null;
  whatsapp_e164: string | null;
  preferred_contact_method: string | null;
  requested_treatment: string;
  medical_condition: string | null;
  medical_summary: string | null;
  medical_history: string | null;
  urgency: "routine" | "priority" | "urgent" | "unknown";
  preferred_destination: string | null;
  initial_records_ready: boolean;
  pipeline_stage: string;
  lead_status: "open" | "on_hold" | "converted" | "closed";
  priority: LeadPriority;
  assigned_coordinator_id: string | null;
  assigned_coordinator_name: string | null;
  assigned_hospital_name: string | null;
  referral_partner_name: string | null;
  next_follow_up_at: string | null;
  qualification_status: string;
  internal_summary: string | null;
  converted_case_id: string | null;
  closed_reason: string | null;
  closed_at: string | null;
  patient_consent_confirmed: boolean;
  consent_confirmed_at: string | null;
  consent_confirmed_by_partner_id: string | null;
  submitted_at: string;
  submitted_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type BackendLeadActivityRow = {
  id: string;
  organization_id: string;
  lead_id: string;
  activity_type: string;
  activity_title: string;
  activity_description: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by: string | null;
  performed_at: string;
  metadata?: Record<string, unknown>;
};

type BackendLeadNoteRow = {
  id: string;
  organization_id: string;
  lead_id: string;
  note_text: string;
  note_type: string;
  is_internal: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomPart}`;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function isDevelopmentFallbackAllowed() {
  return !import.meta.env.PROD && !supabaseConfig.isConfigured;
}

function developmentResult<T>(data: T, error: string | null = null): LeadServiceResult<T> {
  return { data, error, source: "development" };
}

function liveResult<T>(data: T): LeadServiceResult<T> {
  return { data, error: null, source: "live" };
}

function unavailableResult<T>(error: string): LeadServiceResult<T> {
  return { data: null, error, source: "unavailable" };
}

function readStoredLeads(): Lead[] {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? (JSON.parse(rawValue) as Lead[]) : [];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeStoredLeads(leads: Lead[]) {
  if (typeof window === "undefined" || !isDevelopmentFallbackAllowed()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function defaultPipelineStage(status: LeadStatus): LeadPipelineStage {
  if (status === "New Lead" || status === "New") return "New Lead";
  if (status === "Contacted") return "Initial Contact";
  if (status === "Medical Documents Requested" || status === "Medical Records Requested") return "Documents Requested";
  if (status === "Documents Received" || status === "Medical Records Received") return "Documents Received";
  if (status === "Medical Review" || status === "Medical Review Requested") return "Medical Review";
  if (status === "Hospital Quotes Requested" || status === "Quotation Requested") return "Hospital Selection";
  if (status === "Hospital Quotes Received" || status === "Quotation Received") return "Quotation Sent";
  if (status === "Patient Decision Pending" || status === "Patient Decision") return "Decision Pending";
  if (status === "Accepted" || status === "Treatment Scheduled" || status === "Travel Planning" || status === "Completed") return "Confirmed";
  if (status === "Lost" || status === "Closed") return "Lost";
  return "New Lead";
}

function toBackendPipelineStage(status: LeadStatus) {
  if (status === "New" || status === "New Lead") return "new_lead";
  if (status === "Contacted") return "contacted";
  if (status === "Medical Documents Requested" || status === "Medical Records Requested") return "medical_records_pending";
  if (status === "Documents Received" || status === "Medical Records Received") return "qualification";
  if (status === "Medical Review" || status === "Medical Review Requested") return "clinical_review";
  if (status === "Hospital Quotes Requested" || status === "Quotation Requested") return "hospital_matching";
  if (status === "Hospital Quotes Received" || status === "Quotation Received") return "quotation_received";
  if (status === "Patient Decision Pending" || status === "Patient Decision") return "patient_decision";
  if (status === "Accepted" || status === "Treatment Scheduled" || status === "Travel Planning" || status === "Completed") return "converted";
  if (status === "Lost" || status === "Closed") return "closed";
  return "new_lead";
}

function toBackendLeadStatus(status: LeadStatus): BackendLeadRow["lead_status"] {
  if (status === "Closed" || status === "Lost") return "closed";
  if (status === "Accepted" || status === "Completed") return "converted";
  return "open";
}

function toBackendUrgency(priority: LeadPriority): BackendLeadRow["urgency"] {
  if (priority === "Urgent") return "urgent";
  if (priority === "High") return "priority";
  if (priority === "Low") return "routine";
  return "unknown";
}

function toLeadStatus(row: BackendLeadRow): LeadStatus {
  if (row.lead_status === "closed") return "Closed";
  if (row.lead_status === "converted") return "Accepted";

  switch (row.pipeline_stage) {
    case "contact_attempted":
    case "contacted":
      return "Contacted";
    case "qualification":
      return "Documents Received";
    case "medical_records_pending":
      return "Medical Records Requested";
    case "clinical_review":
      return "Medical Review Requested";
    case "hospital_matching":
      return "Quotation Requested";
    case "quotation_received":
      return "Quotation Received";
    case "patient_decision":
      return "Patient Decision";
    case "converted":
      return "Accepted";
    case "closed":
      return "Closed";
    default:
      return "New Lead";
  }
}

function toLeadPipelineStage(stage: string): LeadPipelineStage {
  switch (stage) {
    case "contact_attempted":
    case "contacted":
      return "Initial Contact";
    case "qualification":
      return "Documents Received";
    case "medical_records_pending":
      return "Documents Requested";
    case "clinical_review":
      return "Medical Review";
    case "hospital_matching":
      return "Hospital Selection";
    case "quotation_received":
      return "Quotation Sent";
    case "patient_decision":
      return "Decision Pending";
    case "converted":
      return "Confirmed";
    case "closed":
      return "Lost";
    default:
      return "New Lead";
  }
}

function toLeadUrgency(urgency: BackendLeadRow["urgency"]): LeadPriority {
  if (urgency === "urgent") return "Urgent";
  if (urgency === "priority") return "High";
  if (urgency === "routine") return "Low";
  return "Medium";
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function buildInternationalNumber(countryCode: string, localNumber: string, fallback: string) {
  const cleanCode = countryCode.trim();
  const cleanLocal = localNumber.replace(/\D/g, "");
  if (cleanCode && cleanLocal) return `${cleanCode} ${cleanLocal}`;
  return fallback.trim();
}

function calculateAgeFromDateOfBirth(dateOfBirth: string) {
  if (!dateOfBirth) return 0;
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return 0;

  const todayDate = new Date();
  let age = todayDate.getFullYear() - birthDate.getFullYear();
  const monthDelta = todayDate.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && todayDate.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

function isValidEmail(email: string) {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function emailsMatch(email: string, confirmEmail: string) {
  return normalizeText(email) === normalizeText(confirmEmail);
}

function isKnownCountry(countryName: string) {
  const normalized = normalizeText(countryName);
  return countryOptions.some((country) => country.name.toLowerCase() === normalized);
}

function getCurrentOrganizationId(sessionOrganizationId?: unknown) {
  if (typeof sessionOrganizationId === "string" && sessionOrganizationId.trim()) {
    return sessionOrganizationId.trim();
  }
  return getDevelopmentOrganizationContext().id;
}

function buildRestUrl(tableName: string, queryParams: Record<string, string | number | boolean | undefined> = {}) {
  const baseUrl = supabaseConfig.url.replace(/\/$/, "");
  const url = new URL(`${baseUrl}/rest/v1/${tableName}`);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function mutateTable<T>(
  tableName: string,
  method: "POST" | "PATCH",
  body: unknown,
  queryParams: Record<string, string | number | boolean | undefined> = {},
): Promise<LeadServiceResult<T>> {
  if (!supabaseConfig.isConfigured) {
    return unavailableResult("Supabase environment variables are not configured.");
  }

  const session = await getSession();
  if (!session?.access_token) {
    return unavailableResult("Sign in with an internal AfraMedico staff account before changing Leads.");
  }

  try {
    const response = await fetch(buildRestUrl(tableName, queryParams), {
      method,
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    const payload = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      return unavailableResult(payload?.message ?? response.statusText ?? `${tableName} request failed.`);
    }

    return liveResult(payload as T);
  } catch (error) {
    return unavailableResult(error instanceof Error ? error.message : `${tableName} request failed.`);
  }
}

function toActivityItem(row: BackendLeadActivityRow) {
  return {
    date: extractDate(row.performed_at),
    title: row.activity_title,
    detail: row.activity_description ?? "",
  };
}

function toLead(row: BackendLeadRow, activities: BackendLeadActivityRow[] = []): Lead {
  const currentStatus = toLeadStatus(row);
  const pipelineStage = toLeadPipelineStage(row.pipeline_stage);
  const submittedDate = extractDate(row.submitted_at || row.created_at);
  const nextFollowUp = extractDate(row.next_follow_up_at);
  const fallbackActivity = {
    date: submittedDate,
    title: "Lead created",
    detail: `Lead ${row.lead_code} submitted through ${row.submission_channel}.`,
  };
  const activity = activities.length ? activities.map(toActivityItem) : [fallbackActivity];

  return {
    id: row.id,
    sourceReferralId: row.source_referral_id ?? undefined,
    partnerId: row.partner_id ?? undefined,
    partnerCode: row.partner_code ?? undefined,
    leadCode: row.lead_code,
    patientId: row.patient_reference_code,
    caseId: row.converted_case_id ?? "Pending case",
    patientName: row.patient_full_name,
    dateOfBirth: row.date_of_birth ?? "",
    country: row.country,
    city: row.city ?? "",
    nationality: row.nationality ?? "",
    phone: row.phone_e164 ?? "",
    phoneCountryCode: row.phone_country_code ?? "",
    phoneLocalNumber: row.phone_local_number ?? "",
    phoneInternationalNumber: row.phone_e164 ?? "",
    whatsapp: row.whatsapp_e164 ?? "",
    whatsappCountryCode: row.whatsapp_country_code ?? "",
    whatsappLocalNumber: row.whatsapp_local_number ?? "",
    whatsappInternationalNumber: row.whatsapp_e164 ?? "",
    email: row.primary_email ?? "",
    primaryEmail: row.primary_email ?? "",
    confirmEmail: row.primary_email ?? "",
    emailVerified: false,
    emailVerificationStatus: row.primary_email ? "Unverified" : "Unverified",
    age: calculateAgeFromDateOfBirth(row.date_of_birth ?? ""),
    gender: row.gender ?? "",
    preferredLanguage: row.preferred_language ?? "English",
    leadSource: row.acquisition_source === "referral_partner" ? "Referral Partner" : "Website",
    interestedTreatment: row.requested_treatment,
    medicalCondition: row.medical_condition ?? row.medical_summary ?? "",
    medicalHistory: row.medical_history ?? row.medical_summary ?? "",
    urgency: toLeadUrgency(row.urgency),
    preferredDestination: row.preferred_destination ?? "",
    assignedCoordinator: row.assigned_coordinator_name ?? row.assigned_coordinator_id ?? "Unassigned",
    currentStatus,
    pipelineStage,
    caseStatus: row.converted_case_id ? "Active" : "Future",
    createdDate: submittedDate,
    closedDate: extractDate(row.closed_at),
    reopenedDate: "",
    referralPartner: row.referral_partner_name ?? row.partner_code ?? "",
    primaryPartnerAttribution: row.referral_partner_name ?? (row.partner_code ? `Partner ${row.partner_code}` : "Direct / Pending attribution"),
    firstReferralDate: row.source_referral_id ? submittedDate : "",
    lifetimePartnerOwner: row.referral_partner_name ?? (row.partner_code ? `Partner ${row.partner_code}` : "AfraMedico"),
    ownershipStatus: row.partner_id ? "Pending Review" : "No Commission",
    adminOverrideReason: "",
    possibleDuplicate: false,
    hospital: row.assigned_hospital_name ?? "Pending selection",
    documentsReceived: row.initial_records_ready,
    medicalReviewStatus: row.pipeline_stage === "clinical_review" ? "In Review" : row.initial_records_ready ? "Not Started" : "Pending Documents",
    hospitalQuoteStatus: row.pipeline_stage === "quotation_received" ? "Received" : row.pipeline_stage === "hospital_matching" ? "Requested" : "Not Requested",
    estimatedTreatmentCost: 0,
    expectedTravelDate: "",
    relatedHospitalReferrals: [row.assigned_hospital_name ?? "Pending selection"],
    relatedQuotes: [],
    relatedMedicalReview: "Not started",
    relatedPatientJourney: "Not started",
    priority: row.priority,
    responseTimeHours: 0,
    lastContact: submittedDate,
    nextFollowUp,
    internalNotes: row.internal_summary ?? "",
    patientCases: [
      {
        caseId: row.converted_case_id ?? "Pending case",
        treatmentRequested: row.requested_treatment,
        caseStatus: row.converted_case_id ? "Active" : "Future",
        createdDate: submittedDate,
        closedDate: extractDate(row.closed_at),
        reopenedDate: "",
      },
    ],
    activity,
    attachments: [],
    communications: [],
    reminders: nextFollowUp
      ? [
          {
            id: `${row.id}-next-follow-up`,
            title: "Next follow-up",
            dueDate: nextFollowUp,
            priority: row.priority,
            status: "Open",
            createdAt: row.updated_at,
          },
        ]
      : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCreatePayload(input: CreateLeadInput, organizationId: string, submittedByUserId: string | null) {
  const phoneInternationalNumber = buildInternationalNumber(input.phoneCountryCode, input.phoneLocalNumber, input.phone);
  const whatsappInternationalNumber = buildInternationalNumber(input.whatsappCountryCode, input.whatsappLocalNumber, input.whatsapp);

  return {
    organization_id: organizationId,
    acquisition_source: input.leadSource === "Referral Partner" ? "referral_partner" : normalizeText(input.leadSource).replace(/\s+/g, "_"),
    submission_channel: "internal_staff",
    patient_full_name: input.patientName.trim(),
    date_of_birth: input.dateOfBirth || null,
    country: input.country.trim(),
    city: input.city.trim() || null,
    nationality: input.nationality.trim() || null,
    gender: input.gender || null,
    preferred_language: input.preferredLanguage.trim() || "English",
    primary_email: input.email.trim() || null,
    phone_country_code: input.phoneCountryCode.trim() || null,
    phone_local_number: input.phoneLocalNumber.trim() || null,
    phone_e164: phoneInternationalNumber || null,
    whatsapp_country_code: input.whatsappCountryCode.trim() || null,
    whatsapp_local_number: input.whatsappLocalNumber.trim() || null,
    whatsapp_e164: whatsappInternationalNumber || null,
    preferred_contact_method: whatsappInternationalNumber ? "whatsapp" : phoneInternationalNumber ? "phone" : "email",
    requested_treatment: input.interestedTreatment.trim(),
    medical_condition: input.medicalCondition.trim() || null,
    medical_summary: input.medicalCondition.trim() || input.medicalHistory.trim() || null,
    medical_history: input.medicalHistory.trim() || null,
    urgency: toBackendUrgency(input.urgency),
    preferred_destination: input.preferredDestination.trim() || null,
    initial_records_ready: input.documentsReceived === "Yes",
    pipeline_stage: toBackendPipelineStage(input.currentStatus),
    lead_status: toBackendLeadStatus(input.currentStatus),
    priority: input.priority,
    assigned_coordinator_name: input.assignedCoordinator.trim() || null,
    assigned_hospital_name: input.hospital.trim() || null,
    referral_partner_name: input.referralPartner.trim() || null,
    next_follow_up_at: input.nextFollowUp ? `${input.nextFollowUp}T00:00:00.000Z` : null,
    qualification_status: "unreviewed",
    internal_summary: input.internalNotes.trim() || null,
    patient_consent_confirmed: false,
    submitted_by_user_id: submittedByUserId,
  };
}

function toUpdatePayload(updates: Partial<Lead>) {
  const payload: Record<string, unknown> = {};

  if (updates.patientName !== undefined) payload.patient_full_name = updates.patientName.trim();
  if (updates.phone !== undefined) payload.phone_e164 = updates.phone.trim() || null;
  if (updates.whatsapp !== undefined) payload.whatsapp_e164 = updates.whatsapp.trim() || null;
  if (updates.email !== undefined) payload.primary_email = updates.email.trim() || null;
  if (updates.country !== undefined) payload.country = updates.country.trim();
  if (updates.city !== undefined) payload.city = updates.city.trim() || null;
  if (updates.interestedTreatment !== undefined) payload.requested_treatment = updates.interestedTreatment.trim();
  if (updates.medicalCondition !== undefined) {
    payload.medical_condition = updates.medicalCondition.trim() || null;
    payload.medical_summary = updates.medicalCondition.trim() || null;
  }
  if (updates.currentStatus !== undefined) {
    payload.pipeline_stage = toBackendPipelineStage(updates.currentStatus);
    payload.lead_status = toBackendLeadStatus(updates.currentStatus);
  }
  if (updates.pipelineStage !== undefined && updates.currentStatus === undefined) {
    payload.pipeline_stage = toBackendPipelineStage(pipelineStageToStatus(updates.pipelineStage));
  }
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.nextFollowUp !== undefined) payload.next_follow_up_at = updates.nextFollowUp ? `${updates.nextFollowUp}T00:00:00.000Z` : null;
  if (updates.assignedCoordinator !== undefined) payload.assigned_coordinator_name = updates.assignedCoordinator.trim() || null;
  if (updates.hospital !== undefined) payload.assigned_hospital_name = updates.hospital.trim() || null;
  if (updates.referralPartner !== undefined) payload.referral_partner_name = updates.referralPartner.trim() || null;
  if (updates.internalNotes !== undefined) payload.internal_summary = updates.internalNotes.trim() || null;
  if (updates.documentsReceived !== undefined) payload.initial_records_ready = updates.documentsReceived;

  return payload;
}

function pipelineStageToStatus(stage: LeadPipelineStage): LeadStatus {
  if (stage === "Initial Contact") return "Contacted";
  if (stage === "Documents Requested") return "Medical Records Requested";
  if (stage === "Documents Received") return "Documents Received";
  if (stage === "Medical Review") return "Medical Review Requested";
  if (stage === "Hospital Selection") return "Quotation Requested";
  if (stage === "Quotation Sent") return "Quotation Received";
  if (stage === "Decision Pending") return "Patient Decision";
  if (stage === "Confirmed") return "Accepted";
  if (stage === "Lost") return "Closed";
  return "New Lead";
}

async function fetchActivitiesForLeadIds(leadIds: string[]) {
  if (!leadIds.length) return new Map<string, BackendLeadActivityRow[]>();

  const result = await querySupabaseTable<BackendLeadActivityRow[]>("lead_activities", {
    select: "*",
    lead_id: `in.(${leadIds.join(",")})`,
    order: "performed_at.desc",
    limit: 500,
  });

  const grouped = new Map<string, BackendLeadActivityRow[]>();
  if (!result.data || result.error) return grouped;

  result.data.forEach((activity) => {
    grouped.set(activity.lead_id, [...(grouped.get(activity.lead_id) ?? []), activity]);
  });

  return grouped;
}

export function getStoredLeads() {
  return isDevelopmentFallbackAllowed() ? readStoredLeads() : [];
}

export function getLeads(seedLeads: Lead[]) {
  if (!isDevelopmentFallbackAllowed()) return [];
  const storedLeads = readStoredLeads();
  const storedIds = new Set(storedLeads.map((lead) => lead.id));
  return [
    ...storedLeads,
    ...seedLeads.filter((lead) => !storedIds.has(lead.id)),
  ];
}

export function calculateLeadAge(dateOfBirth: string) {
  return calculateAgeFromDateOfBirth(dateOfBirth);
}

export function validateLeadInput(input: CreateLeadInput): LeadValidationResult {
  const errors: string[] = [];

  if (!input.patientName.trim()) errors.push("Patient name is required.");
  if (!input.country.trim()) errors.push("Country is required.");
  if (!input.dateOfBirth.trim()) errors.push("Date of birth is required.");
  if (!input.interestedTreatment.trim()) errors.push("Interested treatment is required.");
  if (!input.phone.trim() && !input.phoneLocalNumber.trim()) errors.push("Phone is required.");
  if (!input.email.trim()) errors.push("Primary email is required.");
  if (!input.confirmEmail.trim()) errors.push("Confirm email is required.");
  if (!isValidEmail(input.email)) errors.push("Email format is invalid.");
  if (input.email.trim() && input.confirmEmail.trim() && !emailsMatch(input.email, input.confirmEmail)) {
    errors.push("Primary email and confirm email must match.");
  }
  if (input.preferredDestination.trim() && !isKnownCountry(input.preferredDestination)) {
    errors.push("Preferred destination must be selected from the country list.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function findLeadDuplicates(input: CreateLeadInput, existingLeads: Lead[]): LeadDuplicateResult {
  const email = normalizeText(input.email);
  const phone = normalizePhone(input.phone);

  const matches = existingLeads.filter((lead) => {
    const leadEmail = normalizeText(lead.email);
    const leadPhone = normalizePhone(lead.phone);
    return Boolean(email && leadEmail === email) || Boolean(phone && leadPhone === phone);
  });

  return {
    hasDuplicate: matches.length > 0,
    matches,
  };
}

export async function findPossibleDuplicates(input: CreateLeadInput, existingLeads: Lead[]) {
  return findLeadDuplicates(input, existingLeads);
}

export async function listLeads(seedLeads: Lead[] = [], limit = 100): Promise<LeadServiceResult<Lead[]>> {
  if (isDevelopmentFallbackAllowed()) {
    return developmentResult(getLeads(seedLeads), "Supabase is not configured. Showing explicit development Lead data.");
  }

  const result = await querySupabaseTable<BackendLeadRow[]>("leads", {
    select: "*",
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data) {
    return unavailableResult(result.error ?? "Unable to load Leads from Supabase.");
  }

  const activities = await fetchActivitiesForLeadIds(result.data.map((lead) => lead.id));
  return liveResult(result.data.map((lead) => toLead(lead, activities.get(lead.id) ?? [])));
}

export async function getLeadById(id: string): Promise<LeadServiceResult<Lead>> {
  if (isDevelopmentFallbackAllowed()) {
    const fallback = readStoredLeads().find((lead) => lead.id === id);
    return fallback ? developmentResult(fallback) : unavailableResult("Lead not found in development storage.");
  }

  const result = await querySupabaseTable<BackendLeadRow[]>("leads", {
    select: "*",
    id: `eq.${id}`,
    limit: 1,
  });

  if (result.error || !result.data?.[0]) {
    return unavailableResult(result.error ?? "Lead not found.");
  }

  const activities = await fetchActivitiesForLeadIds([id]);
  return liveResult(toLead(result.data[0], activities.get(id) ?? []));
}

export async function createLead(input: CreateLeadInput, existingLeads: Lead[]) {
  const duplicateResult = findLeadDuplicates(input, existingLeads);

  if (isDevelopmentFallbackAllowed()) {
    const createdAt = nowIso();
    const createdDate = today();
    const phoneInternationalNumber = buildInternationalNumber(input.phoneCountryCode, input.phoneLocalNumber, input.phone);
    const whatsappInternationalNumber = buildInternationalNumber(input.whatsappCountryCode, input.whatsappLocalNumber, input.whatsapp);
    const treatment = input.interestedTreatment.trim();
    const lead: Lead = {
      id: createId("lead-dev"),
      patientId: input.patientId.trim() && !input.patientId.includes("Generated") ? input.patientId.trim() : createId("PAT-DEV"),
      caseId: input.caseId.trim() || "Pending case",
      patientName: input.patientName.trim(),
      dateOfBirth: input.dateOfBirth,
      country: input.country.trim(),
      city: input.city.trim(),
      nationality: input.nationality.trim(),
      phone: phoneInternationalNumber,
      phoneCountryCode: input.phoneCountryCode,
      phoneLocalNumber: input.phoneLocalNumber.trim(),
      phoneInternationalNumber,
      whatsapp: whatsappInternationalNumber,
      whatsappCountryCode: input.whatsappCountryCode,
      whatsappLocalNumber: input.whatsappLocalNumber.trim(),
      whatsappInternationalNumber,
      email: input.email.trim(),
      primaryEmail: input.email.trim(),
      confirmEmail: input.confirmEmail.trim(),
      emailVerified: input.emailVerified === "Yes",
      emailVerificationStatus: input.emailVerificationStatus,
      age: calculateAgeFromDateOfBirth(input.dateOfBirth) || parseNumber(input.age),
      gender: input.gender,
      preferredLanguage: input.preferredLanguage.trim() || "English",
      leadSource: input.leadSource,
      interestedTreatment: treatment,
      medicalCondition: input.medicalCondition.trim(),
      medicalHistory: input.medicalHistory.trim(),
      urgency: input.urgency,
      preferredDestination: input.preferredDestination.trim(),
      assignedCoordinator: input.assignedCoordinator.trim() || "Unassigned",
      currentStatus: input.currentStatus,
      pipelineStage: defaultPipelineStage(input.currentStatus),
      caseStatus: input.caseStatus,
      createdDate,
      closedDate: "",
      reopenedDate: "",
      referralPartner: input.referralPartner.trim(),
      primaryPartnerAttribution: input.referralPartner.trim() || "Direct / Pending attribution",
      firstReferralDate: input.referralPartner.trim() ? createdDate : "",
      lifetimePartnerOwner: input.referralPartner.trim() || "AfraMedico",
      ownershipStatus: input.referralPartner.trim() ? "Pending Review" : "No Commission",
      adminOverrideReason: "",
      possibleDuplicate: duplicateResult.hasDuplicate,
      hospital: input.hospital.trim() || "Pending selection",
      documentsReceived: input.documentsReceived === "Yes",
      medicalReviewStatus: input.medicalReviewStatus,
      hospitalQuoteStatus: input.hospitalQuoteStatus,
      estimatedTreatmentCost: parseNumber(input.estimatedTreatmentCost),
      expectedTravelDate: input.expectedTravelDate,
      relatedHospitalReferrals: [input.hospital.trim() || "Pending selection"],
      relatedQuotes: [],
      relatedMedicalReview: input.medicalReviewStatus === "Not Started" ? "Not started" : "Pending review record",
      relatedPatientJourney: "Not started",
      priority: input.priority,
      responseTimeHours: 0,
      lastContact: input.lastContact || createdDate,
      nextFollowUp: input.nextFollowUp,
      internalNotes: input.internalNotes.trim(),
      patientCases: [],
      activity: [{ date: createdDate, title: "Lead created", detail: `Manual intake created from ${input.leadSource}.` }],
      createdAt,
      updatedAt: createdAt,
    };

    writeStoredLeads([lead, ...readStoredLeads()]);
    return { lead, duplicateResult, error: null, source: "development" as const };
  }

  const session = await getSession();
  const organizationId = getCurrentOrganizationId(session?.user?.app_metadata?.organization_id);
  if (!organizationId) {
    return { lead: null, duplicateResult, error: "No organization_id is available for the current staff session.", source: "unavailable" as const };
  }

  const created = await mutateTable<BackendLeadRow[]>("leads", "POST", toCreatePayload(input, organizationId, session?.user?.id ?? null));
  if (created.error || !created.data?.[0]) {
    return { lead: null, duplicateResult, error: created.error ?? "Unable to create Lead.", source: created.source };
  }

  await createLeadActivity(created.data[0].id, {
    title: "Lead created",
    description: `Manual intake created from ${input.leadSource}.`,
    type: "lead_created",
  });

  const refreshed = await getLeadById(created.data[0].id);
  return {
    lead: refreshed.data ?? toLead(created.data[0]),
    duplicateResult,
    error: refreshed.error,
    source: "live" as const,
  };
}

export function createLeadItemId(prefix: string) {
  return createId(prefix);
}

export function getLeadPipelineStage(status: LeadStatus) {
  return defaultPipelineStage(status);
}

export async function updateLead(updatedLead: Lead) {
  if (isDevelopmentFallbackAllowed()) {
    const storedLeads = readStoredLeads();
    const nextLead = { ...updatedLead, updatedAt: nowIso() };
    const existingIndex = storedLeads.findIndex((lead) => lead.id === nextLead.id);
    const nextLeads =
      existingIndex >= 0
        ? storedLeads.map((lead) => (lead.id === nextLead.id ? nextLead : lead))
        : [nextLead, ...storedLeads];

    writeStoredLeads(nextLeads);
    return nextLead;
  }

  const updated = await mutateTable<BackendLeadRow[]>("leads", "PATCH", toUpdatePayload(updatedLead), {
    id: `eq.${updatedLead.id}`,
  });

  if (updated.error || !updated.data?.[0]) {
    throw new Error(updated.error ?? "Unable to update Lead.");
  }

  const activities = await fetchActivitiesForLeadIds([updatedLead.id]);
  return toLead(updated.data[0], activities.get(updatedLead.id) ?? []);
}

async function createLeadActivity(
  leadId: string,
  input: { title: string; description: string; type?: string; oldValue?: string; newValue?: string },
) {
  if (isDevelopmentFallbackAllowed()) return null;

  const current = await getLeadById(leadId);
  const organizationId = getDevelopmentOrganizationContext().id;
  const session = await getSession();
  const orgId = getCurrentOrganizationId(session?.user?.app_metadata?.organization_id) ?? organizationId;
  if (!orgId || !current.data) return null;

  const result = await mutateTable<BackendLeadActivityRow[]>("lead_activities", "POST", {
    organization_id: orgId,
    lead_id: leadId,
    activity_type: input.type ?? "lead_update",
    activity_title: input.title,
    activity_description: input.description,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    performed_by: session?.user?.id ?? null,
    metadata: {},
  });

  return result.data?.[0] ?? null;
}

export async function updateLeadWithActivity(
  lead: Lead,
  updates: Partial<Lead>,
  title: string,
  detail: string,
) {
  if (isDevelopmentFallbackAllowed()) {
    const nextLead = {
      ...lead,
      ...updates,
      activity: [{ date: today(), title, detail }, ...(lead.activity ?? [])],
    };

    return updateLead(nextLead);
  }

  const nextLead = await updateLead({ ...lead, ...updates });
  await createLeadActivity(lead.id, { title, description: detail });
  const refreshed = await getLeadById(lead.id);
  return refreshed.data ?? nextLead;
}

export async function createLeadNote(leadId: string, noteText: string, noteType = "internal") {
  if (isDevelopmentFallbackAllowed()) {
    return developmentResult(null);
  }

  const session = await getSession();
  const organizationId = getCurrentOrganizationId(session?.user?.app_metadata?.organization_id);
  if (!organizationId) return unavailableResult("No organization_id is available for the current staff session.");

  const result = await mutateTable<BackendLeadNoteRow[]>("lead_notes", "POST", {
    organization_id: organizationId,
    lead_id: leadId,
    note_text: noteText,
    note_type: noteType,
    is_internal: true,
    created_by: session?.user?.id ?? null,
  });

  if (!result.error) {
    await createLeadActivity(leadId, { title: "Internal Note Added", description: noteText, type: "note_added" });
  }

  return result;
}

export async function listLeadNotes(leadId: string) {
  const result = await querySupabaseTable<BackendLeadNoteRow[]>("lead_notes", {
    select: "*",
    lead_id: `eq.${leadId}`,
    order: "created_at.desc",
  });

  if (result.error || !result.data) return unavailableResult(result.error ?? "Unable to load Lead notes.");
  return liveResult(result.data);
}

export async function listLeadActivities(leadId: string) {
  const result = await querySupabaseTable<BackendLeadActivityRow[]>("lead_activities", {
    select: "*",
    lead_id: `eq.${leadId}`,
    order: "performed_at.desc",
  });

  if (result.error || !result.data) return unavailableResult(result.error ?? "Unable to load Lead activities.");
  return liveResult(result.data);
}
