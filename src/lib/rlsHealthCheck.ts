import { getCurrentUser, getSession } from "../services/authService";
import { supabaseConfig } from "./supabaseClient";

export type RlsHealthCheckResult = {
  environmentConfigured: boolean;
  sessionExists: boolean;
  organizationIdInAppMetadata: boolean;
  organizationId: string | null;
  canReadOrganizations: boolean;
  canReadCases: boolean;
  errors: string[];
  status: "ready" | "not_configured" | "not_authenticated" | "missing_organization" | "rls_blocked";
};

export type RlsTimelineInsertResult = {
  created: boolean;
  error: string | null;
  eventId: string | null;
};

function restUrl(tableName: string, queryParams: Record<string, string | number | boolean | undefined> = {}) {
  const baseUrl = supabaseConfig.url.replace(/\/$/, "");
  const url = new URL(`${baseUrl}/rest/v1/${tableName}`);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function readWithSession(tableName: string, accessToken: string, organizationId: string) {
  const response = await fetch(
    restUrl(tableName, {
      select: "id",
      organization_id: `eq.${organizationId}`,
      limit: 1,
    }),
    {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    return body || response.statusText;
  }

  return null;
}

export async function runRlsHealthCheck(): Promise<RlsHealthCheckResult> {
  const errors: string[] = [];

  if (!supabaseConfig.isConfigured) {
    return {
      environmentConfigured: false,
      sessionExists: false,
      organizationIdInAppMetadata: false,
      organizationId: null,
      canReadOrganizations: false,
      canReadCases: false,
      errors: [supabaseConfig.configurationError ?? "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."],
      status: "not_configured",
    };
  }

  const session = await getSession();
  const currentUser = await getCurrentUser();
  const user = currentUser ?? session?.user ?? null;
  const organizationId =
    typeof user?.app_metadata?.organization_id === "string"
      ? user.app_metadata.organization_id
      : null;

  if (!session?.access_token) {
    return {
      environmentConfigured: true,
      sessionExists: false,
      organizationIdInAppMetadata: Boolean(organizationId),
      organizationId,
      canReadOrganizations: false,
      canReadCases: false,
      errors: ["Sign in before testing RLS."],
      status: "not_authenticated",
    };
  }

  if (!organizationId) {
    return {
      environmentConfigured: true,
      sessionExists: true,
      organizationIdInAppMetadata: false,
      organizationId: null,
      canReadOrganizations: false,
      canReadCases: false,
      errors: ["JWT app_metadata.organization_id is missing. Sign out and sign in again after bootstrap."],
      status: "missing_organization",
    };
  }

  const organizationError = await readWithSession("organizations", session.access_token, organizationId);
  const casesError = await readWithSession("cases", session.access_token, organizationId);

  if (organizationError) errors.push(`organizations: ${organizationError}`);
  if (casesError) errors.push(`cases: ${casesError}`);

  return {
    environmentConfigured: true,
    sessionExists: true,
    organizationIdInAppMetadata: true,
    organizationId,
    canReadOrganizations: !organizationError,
    canReadCases: !casesError,
    errors,
    status: errors.length ? "rls_blocked" : "ready",
  };
}

export async function createRlsTestTimelineEvent(): Promise<RlsTimelineInsertResult> {
  if (!supabaseConfig.isConfigured) {
    return {
      created: false,
      error: "Supabase environment variables are not configured.",
      eventId: null,
    };
  }

  const session = await getSession();
  const currentUser = await getCurrentUser();
  const user = currentUser ?? session?.user ?? null;
  const organizationId =
    typeof user?.app_metadata?.organization_id === "string"
      ? user.app_metadata.organization_id
      : null;

  if (!session?.access_token) {
    return { created: false, error: "Sign in before creating a test timeline event.", eventId: null };
  }

  if (!organizationId) {
    return { created: false, error: "Missing app_metadata.organization_id.", eventId: null };
  }

  const response = await fetch(restUrl("timeline_events"), {
    method: "POST",
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      organization_id: organizationId,
      case_id: null,
      patient_id: null,
      event_type: "rls_health_check",
      title: "RLS health check timeline event",
      description: "Development-only test event created by explicit RLS health check utility.",
      department: "Administration",
      user_id: user?.id ?? null,
    }),
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    return {
      created: false,
      error: payload?.message ?? response.statusText ?? "Timeline event insert failed.",
      eventId: null,
    };
  }

  const event = Array.isArray(payload) ? payload[0] : payload;
  return {
    created: true,
    error: null,
    eventId: event?.id ?? null,
  };
}
