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

const STORAGE_KEY = "aframedico.development.leads";

export type CreateLeadInput = {
  patientId: string;
  patientName: string;
  dateOfBirth: string;
  country: string;
  city: string;
  nationality: string;
  phone: string;
  whatsapp: string;
  email: string;
  age: string;
  gender: string;
  preferredLanguage: string;
  leadSource: LeadSource;
  interestedTreatment: string;
  medicalCondition: string;
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
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function defaultPipelineStage(status: LeadStatus): LeadPipelineStage {
  if (status === "New Lead") return "New Lead";
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

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ensureCaseId(value: string) {
  return value.trim() || `CASE-${Date.now()}`;
}

function ensurePatientId(value: string) {
  return value.trim() || `PAT-${Date.now()}`;
}

export function getStoredLeads() {
  return readStoredLeads();
}

export function getLeads(seedLeads: Lead[]) {
  const storedLeads = readStoredLeads();
  const storedIds = new Set(storedLeads.map((lead) => lead.id));
  return [
    ...storedLeads,
    ...seedLeads.filter((lead) => !storedIds.has(lead.id)),
  ];
}

export function validateLeadInput(input: CreateLeadInput): LeadValidationResult {
  const errors: string[] = [];

  if (!input.patientName.trim()) errors.push("Patient name is required.");
  if (!input.country.trim()) errors.push("Country is required.");
  if (!input.interestedTreatment.trim()) errors.push("Interested treatment is required.");
  if (!input.phone.trim() && !input.email.trim()) errors.push("Phone or email is required.");

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

export function createLead(input: CreateLeadInput, existingLeads: Lead[]) {
  const duplicateResult = findLeadDuplicates(input, existingLeads);
  const createdAt = nowIso();
  const createdDate = today();
  const caseId = ensureCaseId(input.caseId);
  const patientId = ensurePatientId(input.patientId);
  const treatment = input.interestedTreatment.trim();

  const lead: Lead = {
    id: createId("lead-dev"),
    patientId,
    caseId,
    patientName: input.patientName.trim(),
    dateOfBirth: input.dateOfBirth,
    country: input.country.trim(),
    city: input.city.trim(),
    nationality: input.nationality.trim(),
    phone: input.phone.trim(),
    whatsapp: input.whatsapp.trim(),
    email: input.email.trim(),
    age: parseNumber(input.age),
    gender: input.gender,
    preferredLanguage: input.preferredLanguage.trim() || "English",
    leadSource: input.leadSource,
    interestedTreatment: treatment,
    medicalCondition: input.medicalCondition.trim(),
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
    patientCases: [
      {
        caseId,
        treatmentRequested: treatment,
        caseStatus: input.caseStatus,
        createdDate,
        closedDate: "",
        reopenedDate: "",
      },
    ],
    activity: [
      {
        date: createdDate,
        title: "Lead created",
        detail: `Manual intake created from ${input.leadSource}.`,
      },
    ],
    createdAt,
    updatedAt: createdAt,
  };

  writeStoredLeads([lead, ...readStoredLeads()]);
  return {
    lead,
    duplicateResult,
  };
}

export function createLeadItemId(prefix: string) {
  return createId(prefix);
}

export function getLeadPipelineStage(status: LeadStatus) {
  return defaultPipelineStage(status);
}

export function updateLead(updatedLead: Lead) {
  const storedLeads = readStoredLeads();
  const nextLead = {
    ...updatedLead,
    updatedAt: nowIso(),
  };
  const existingIndex = storedLeads.findIndex((lead) => lead.id === nextLead.id);
  const nextLeads =
    existingIndex >= 0
      ? storedLeads.map((lead) => (lead.id === nextLead.id ? nextLead : lead))
      : [nextLead, ...storedLeads];

  writeStoredLeads(nextLeads);
  return nextLead;
}

export function updateLeadWithActivity(
  lead: Lead,
  updates: Partial<Lead>,
  title: string,
  detail: string,
) {
  const nextLead = {
    ...lead,
    ...updates,
    activity: [
      {
        date: today(),
        title,
        detail,
      },
      ...(lead.activity ?? []),
    ],
  };

  return updateLead(nextLead);
}
