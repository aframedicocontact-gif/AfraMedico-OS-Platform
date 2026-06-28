import { getDevelopmentOrganizationContext } from "../lib/currentOrganization";
import { querySupabaseTable, supabaseConfig } from "../lib/supabaseClient";
import { getSession } from "./authService";
import { developmentOrganizations } from "../data/developmentOrganizations";
import type {
  CreateOrganizationInput,
  PlatformOrganization,
  UpdateOrganizationInput,
} from "../types/organization";

export type OrganizationRecord = PlatformOrganization;

export type OrganizationServiceResult<T> = {
  data: T | null;
  error: string | null;
  source: "live" | "mock" | "unavailable";
};

function mockResult<T>(data: T, error: string | null = null): OrganizationServiceResult<T> {
  return {
    data,
    error,
    source: "mock",
  };
}

function unavailableResult<T>(error: string): OrganizationServiceResult<T> {
  return {
    data: null,
    error,
    source: "unavailable",
  };
}

function liveResult<T>(data: T): OrganizationServiceResult<T> {
  return {
    data,
    error: null,
    source: "live",
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

async function mutateOrganization(
  method: "POST" | "PATCH",
  body: CreateOrganizationInput | UpdateOrganizationInput,
  queryParams: Record<string, string | number | boolean | undefined> = {},
) {
  if (!supabaseConfig.isConfigured) {
    return unavailableResult<PlatformOrganization>("Supabase environment variables are not configured.");
  }

  const session = await getSession();
  const response = await fetch(buildRestUrl("organizations", queryParams), {
    method,
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${session?.access_token ?? supabaseConfig.anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    return unavailableResult<PlatformOrganization>(
      payload?.message ?? response.statusText ?? "Organization request failed.",
    );
  }

  const organization = Array.isArray(payload) ? payload[0] : payload;
  return liveResult<PlatformOrganization>(organization as PlatformOrganization);
}

export async function getOrganizations(limit = 20): Promise<OrganizationServiceResult<PlatformOrganization[]>> {
  const result = await querySupabaseTable<PlatformOrganization[]>("organizations", {
    select: "*",
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data) {
    return mockResult(
      developmentOrganizations,
      result.error ?? "Live organizations unavailable. Showing development fallback data.",
    );
  }

  return liveResult(result.data);
}

export async function getOrganizationById(id: string): Promise<OrganizationServiceResult<PlatformOrganization>> {
  const result = await querySupabaseTable<PlatformOrganization[]>("organizations", {
    select: "*",
    id: `eq.${id}`,
    limit: 1,
  });

  if (result.error || !result.data?.[0]) {
    const fallback = developmentOrganizations.find((organization) => organization.id === id) ?? null;
    if (fallback) {
      return mockResult(fallback, result.error ?? "Live organization unavailable. Showing development fallback data.");
    }
    return unavailableResult(result.error ?? "Organization not found.");
  }

  return liveResult(result.data[0]);
}

export async function createOrganization(input: CreateOrganizationInput) {
  return mutateOrganization("POST", input);
}

export async function updateOrganization(id: string, input: UpdateOrganizationInput) {
  return mutateOrganization("PATCH", input, {
    id: `eq.${id}`,
  });
}

export async function getCurrentOrganization(): Promise<OrganizationServiceResult<PlatformOrganization>> {
  const developmentContext = getDevelopmentOrganizationContext();

  if (developmentContext.id) {
    return getOrganizationById(developmentContext.id);
  }

  const result = await getOrganizations(1);
  const organization = result.data?.[0] ?? developmentOrganizations[0];

  return {
    data: organization,
    error: result.source === "mock" ? result.error : null,
    source: result.source,
  };
}

export async function listOrganizations(limit = 20) {
  return getOrganizations(limit);
}
