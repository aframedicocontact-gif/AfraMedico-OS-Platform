import { getDevelopmentOrganizationContext } from "../lib/currentOrganization";
import {
  createDevelopmentId,
  getDevelopmentOperationalCases,
  saveDevelopmentOperationalCase,
} from "../lib/developmentOperationalStore";
import { querySupabaseTable, supabaseConfig } from "../lib/supabaseClient";
import { developmentCases } from "../data/developmentCases";
import { getSession } from "./authService";
import type { CreateCaseInput, PatientCase, UpdateCaseInput } from "../types/case";

export type CaseRecord = PatientCase;

export type CaseServiceResult<T> = {
  data: T | null;
  error: string | null;
  source: "live" | "mock" | "unavailable";
};

function mockResult<T>(data: T, error: string | null = null): CaseServiceResult<T> {
  return { data, error, source: "mock" };
}

function liveResult<T>(data: T): CaseServiceResult<T> {
  return { data, error: null, source: "live" };
}

function unavailableResult<T>(error: string): CaseServiceResult<T> {
  return { data: null, error, source: "unavailable" };
}

function logCaseServiceWarning(context: string, message: string) {
  console.warn(`[caseService] ${context}: ${message}`);
}

function getFallbackCases() {
  return [...getDevelopmentOperationalCases(), ...developmentCases];
}

function toBackendCasePayload(input: CreateCaseInput | UpdateCaseInput) {
  const urgency = "urgency" in input ? input.urgency : undefined;

  return {
    ...input,
    ...(urgency ? { urgency: urgency === "standard" || urgency === "future" ? "routine" : urgency } : {}),
  };
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

function createFallbackCase(input: CreateCaseInput, error: string): CaseServiceResult<PatientCase> {
  const now = new Date().toISOString();
  const patientCase: PatientCase = {
    id: createDevelopmentId("case-dev"),
    organization_id: input.organization_id,
    patient_id: input.patient_id,
    case_code: input.case_code,
    treatment: input.treatment ?? null,
    specialty: input.specialty ?? null,
    country: input.country ?? null,
    status: input.status ?? "new",
    priority: input.priority ?? "medium",
    urgency: input.urgency ?? "routine",
    current_stage: input.current_stage ?? "Lead",
    current_owner_id: input.current_owner_id ?? null,
    current_department: input.current_department ?? "Case Management",
    created_at: now,
    updated_at: now,
  };

  saveDevelopmentOperationalCase(patientCase);
  return mockResult(patientCase, error);
}

async function mutateCase(
  method: "POST" | "PATCH",
  body: CreateCaseInput | UpdateCaseInput,
  queryParams: Record<string, string | number | boolean | undefined> = {},
): Promise<CaseServiceResult<PatientCase>> {
  if (!supabaseConfig.isConfigured) {
    return unavailableResult("Supabase environment variables are not configured.");
  }

  const session = await getSession();
  if (!session?.access_token) {
    if (method === "POST") {
      return createFallbackCase(body as CreateCaseInput, "No authenticated Supabase session. Created development fallback case.");
    }

    return unavailableResult("Sign in before updating a case.");
  }

  const response = await fetch(buildRestUrl("cases", queryParams), {
    method,
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(toBackendCasePayload(body)),
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    if (method === "POST") {
      return createFallbackCase(
        body as CreateCaseInput,
        payload?.message ?? response.statusText ?? "Live case creation failed. Created development fallback case.",
      );
    }

    return unavailableResult(payload?.message ?? response.statusText ?? "Case request failed.");
  }

  const row = Array.isArray(payload) ? payload[0] : payload;
  return liveResult(row as PatientCase);
}

export async function getCases(limit = 50): Promise<CaseServiceResult<PatientCase[]>> {
  const result = await querySupabaseTable<PatientCase[]>("cases", {
    select: "*",
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data?.length) {
    if (result.error) logCaseServiceWarning("getCases", result.error);
    return mockResult(
      getFallbackCases(),
      result.error ?? "No live cases returned. Showing development fallback data.",
    );
  }

  return liveResult(result.data);
}

export async function getCaseById(id: string): Promise<CaseServiceResult<PatientCase>> {
  const result = await querySupabaseTable<PatientCase[]>("cases", {
    select: "*",
    id: `eq.${id}`,
    limit: 1,
  });

  if (result.error || !result.data?.[0]) {
    if (result.error) logCaseServiceWarning("getCaseById", result.error);
    const fallback = getFallbackCases().find((patientCase) => patientCase.id === id) ?? null;
    if (fallback) {
      return mockResult(fallback, result.error ?? "Live case unavailable. Showing development fallback data.");
    }

    return unavailableResult(result.error ?? "Case not found.");
  }

  return liveResult(result.data[0]);
}

export async function getCasesByPatientId(
  patientId: string,
  limit = 50,
): Promise<CaseServiceResult<PatientCase[]>> {
  const result = await querySupabaseTable<PatientCase[]>("cases", {
    select: "*",
    patient_id: `eq.${patientId}`,
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data?.length) {
    if (result.error) logCaseServiceWarning("getCasesByPatientId", result.error);
    return mockResult(
      getFallbackCases().filter((patientCase) => patientCase.patient_id === patientId),
      result.error ?? "No live patient cases returned. Showing development fallback data.",
    );
  }

  return liveResult(result.data);
}

export async function getCasesByOrganization(
  organizationId: string,
  limit = 50,
): Promise<CaseServiceResult<PatientCase[]>> {
  const result = await querySupabaseTable<PatientCase[]>("cases", {
    select: "*",
    organization_id: `eq.${organizationId}`,
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data?.length) {
    if (result.error) logCaseServiceWarning("getCasesByOrganization", result.error);
    return mockResult(
      getFallbackCases().filter((patientCase) => patientCase.organization_id === organizationId),
      result.error ?? "No live organization cases returned. Showing development fallback data.",
    );
  }

  return liveResult(result.data);
}

export async function createCase(input: CreateCaseInput) {
  return mutateCase("POST", input);
}

export async function updateCase(id: string, input: UpdateCaseInput) {
  return mutateCase("PATCH", input, {
    id: `eq.${id}`,
  });
}

export async function listCases(limit = 20) {
  return getCases(limit);
}

export async function getCurrentOrganizationCases(limit = 50) {
  const currentOrganization = getDevelopmentOrganizationContext();

  if (!currentOrganization.id) {
    return getCases(limit);
  }

  return getCasesByOrganization(currentOrganization.id, limit);
}
