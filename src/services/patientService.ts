import { getDevelopmentOrganizationContext } from "../lib/currentOrganization";
import { querySupabaseTable, supabaseConfig } from "../lib/supabaseClient";
import { developmentPatients } from "../data/developmentPatients";
import { getSession } from "./authService";
import type {
  BackendPatientRow,
  CreatePatientInput,
  Patient,
  UpdatePatientInput,
} from "../types/patient";

export type PatientRecord = Patient;

export type PatientServiceResult<T> = {
  data: T | null;
  error: string | null;
  source: "live" | "mock" | "unavailable";
};

function mockResult<T>(data: T, error: string | null = null): PatientServiceResult<T> {
  return { data, error, source: "mock" };
}

function liveResult<T>(data: T): PatientServiceResult<T> {
  return { data, error: null, source: "live" };
}

function unavailableResult<T>(error: string): PatientServiceResult<T> {
  return { data: null, error, source: "unavailable" };
}

function logPatientServiceWarning(context: string, message: string) {
  console.warn(`[patientService] ${context}: ${message}`);
}

function splitName(fullName: string | undefined) {
  const parts = (fullName ?? "Unknown Patient").trim().split(/\s+/);
  const firstName = parts.shift() ?? "Unknown";
  return {
    first_name: firstName,
    last_name: parts.join(" ") || "Patient",
  };
}

function toPatient(row: BackendPatientRow): Patient {
  const name = splitName(row.full_name);

  return {
    id: row.id,
    organization_id: row.organization_id,
    first_name: name.first_name,
    last_name: name.last_name,
    date_of_birth: null,
    gender: "unknown",
    country: row.country,
    phone: row.phone,
    email: row.email,
    status: "active",
    created_at: row.created_at,
    updated_at: row.updated_at,
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

function toBackendPayload(input: CreatePatientInput | UpdatePatientInput) {
  const firstName = "first_name" in input ? input.first_name : undefined;
  const lastName = "last_name" in input ? input.last_name : undefined;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    ...("organization_id" in input ? { organization_id: input.organization_id } : {}),
    ...(fullName ? { full_name: fullName } : {}),
    ...("country" in input ? { country: input.country } : {}),
    ...("phone" in input ? { phone: input.phone } : {}),
    ...("email" in input ? { email: input.email } : {}),
  };
}

async function mutatePatient(
  method: "POST" | "PATCH",
  body: CreatePatientInput | UpdatePatientInput,
  queryParams: Record<string, string | number | boolean | undefined> = {},
): Promise<PatientServiceResult<Patient>> {
  if (!supabaseConfig.isConfigured) {
    return unavailableResult("Supabase environment variables are not configured.");
  }

  const session = await getSession();
  const response = await fetch(buildRestUrl("patients", queryParams), {
    method,
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${session?.access_token ?? supabaseConfig.anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(toBackendPayload(body)),
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    return unavailableResult(payload?.message ?? response.statusText ?? "Patient request failed.");
  }

  const row = Array.isArray(payload) ? payload[0] : payload;
  return liveResult(toPatient(row as BackendPatientRow));
}

export async function getPatients(limit = 50): Promise<PatientServiceResult<Patient[]>> {
  const result = await querySupabaseTable<BackendPatientRow[]>("patients", {
    select: "*",
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data?.length) {
    if (result.error) logPatientServiceWarning("getPatients", result.error);
    return mockResult(
      developmentPatients,
      result.error ?? "No live patients returned. Showing development fallback data.",
    );
  }

  return liveResult(result.data.map(toPatient));
}

export async function getPatientById(id: string): Promise<PatientServiceResult<Patient>> {
  const result = await querySupabaseTable<BackendPatientRow[]>("patients", {
    select: "*",
    id: `eq.${id}`,
    limit: 1,
  });

  if (result.error || !result.data?.[0]) {
    if (result.error) logPatientServiceWarning("getPatientById", result.error);
    const fallback = developmentPatients.find((patient) => patient.id === id) ?? null;
    if (fallback) {
      return mockResult(fallback, result.error ?? "Live patient unavailable. Showing development fallback data.");
    }

    return unavailableResult(result.error ?? "Patient not found.");
  }

  return liveResult(toPatient(result.data[0]));
}

export async function getPatientsByOrganization(
  organizationId: string,
  limit = 50,
): Promise<PatientServiceResult<Patient[]>> {
  const result = await querySupabaseTable<BackendPatientRow[]>("patients", {
    select: "*",
    organization_id: `eq.${organizationId}`,
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data?.length) {
    if (result.error) logPatientServiceWarning("getPatientsByOrganization", result.error);
    return mockResult(
      developmentPatients.filter((patient) => patient.organization_id === organizationId),
      result.error ?? "No live organization patients returned. Showing development fallback data.",
    );
  }

  return liveResult(result.data.map(toPatient));
}

export async function createPatient(input: CreatePatientInput) {
  return mutatePatient("POST", input);
}

export async function updatePatient(id: string, input: UpdatePatientInput) {
  return mutatePatient("PATCH", input, {
    id: `eq.${id}`,
  });
}

export async function listPatients(limit = 20) {
  return getPatients(limit);
}

export async function getCurrentOrganizationPatients(limit = 50) {
  const currentOrganization = getDevelopmentOrganizationContext();

  if (!currentOrganization.id) {
    return getPatients(limit);
  }

  return getPatientsByOrganization(currentOrganization.id, limit);
}
