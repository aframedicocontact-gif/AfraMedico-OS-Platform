import { getDevelopmentOrganizationContext } from "../lib/currentOrganization";
import {
  createDevelopmentId,
  getDevelopmentOperationalTimelineEvents,
  saveDevelopmentOperationalTimelineEvent,
} from "../lib/developmentOperationalStore";
import { querySupabaseTable, supabaseConfig } from "../lib/supabaseClient";
import { developmentTimelineEvents } from "../data/developmentTimelineEvents";
import { getSession } from "./authService";

export type TimelineEvent = {
  id: string;
  organization_id: string;
  case_id: string | null;
  patient_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  department: string | null;
  user_id: string | null;
  event_type_id?: string | null;
  created_at: string;
};

export type CreateTimelineEventInput = {
  organization_id?: string;
  case_id?: string | null;
  patient_id?: string | null;
  event_type: string;
  title: string;
  description?: string | null;
  department?: string | null;
  user_id?: string | null;
};

export type TimelineServiceResult<T> = {
  data: T | null;
  error: string | null;
  source: "live" | "mock" | "unavailable";
};

function mockResult<T>(data: T, error: string | null = null): TimelineServiceResult<T> {
  return { data, error, source: "mock" };
}

function liveResult<T>(data: T): TimelineServiceResult<T> {
  return { data, error: null, source: "live" };
}

function unavailableResult<T>(error: string): TimelineServiceResult<T> {
  return { data: null, error, source: "unavailable" };
}

function logTimelineServiceWarning(context: string, message: string) {
  console.warn(`[timelineService] ${context}: ${message}`);
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

function sortTimeline(events: TimelineEvent[]) {
  return [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function getFallbackTimelineEvents() {
  return [...getDevelopmentOperationalTimelineEvents(), ...developmentTimelineEvents];
}

function createFallbackTimelineEvent(
  input: CreateTimelineEventInput,
  organizationId: string,
  error: string,
): TimelineServiceResult<TimelineEvent> {
  const event: TimelineEvent = {
    id: createDevelopmentId("timeline-dev"),
    organization_id: organizationId,
    case_id: input.case_id ?? null,
    patient_id: input.patient_id ?? null,
    event_type: input.event_type,
    title: input.title,
    description: input.description ?? null,
    department: input.department ?? null,
    user_id: input.user_id ?? null,
    event_type_id: null,
    created_at: new Date().toISOString(),
  };

  saveDevelopmentOperationalTimelineEvent(event);
  return mockResult(event, error);
}

export async function getTimelineEventsByCaseId(
  caseId: string,
  limit = 50,
): Promise<TimelineServiceResult<TimelineEvent[]>> {
  const result = await querySupabaseTable<TimelineEvent[]>("timeline_events", {
    select: "*",
    case_id: `eq.${caseId}`,
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data?.length) {
    if (result.error) logTimelineServiceWarning("getTimelineEventsByCaseId", result.error);
    return mockResult(
      sortTimeline(getFallbackTimelineEvents().filter((event) => event.case_id === caseId)),
      result.error ?? "No live timeline events returned. Showing development fallback timeline.",
    );
  }

  return liveResult(result.data);
}

export async function getTimelineEventsByPatientId(
  patientId: string,
  limit = 50,
): Promise<TimelineServiceResult<TimelineEvent[]>> {
  const result = await querySupabaseTable<TimelineEvent[]>("timeline_events", {
    select: "*",
    patient_id: `eq.${patientId}`,
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data?.length) {
    if (result.error) logTimelineServiceWarning("getTimelineEventsByPatientId", result.error);
    return mockResult(
      sortTimeline(getFallbackTimelineEvents().filter((event) => event.patient_id === patientId)),
      result.error ?? "No live patient timeline events returned. Showing development fallback timeline.",
    );
  }

  return liveResult(result.data);
}

export async function getTimelineEventsByOrganization(
  organizationId: string,
  limit = 100,
): Promise<TimelineServiceResult<TimelineEvent[]>> {
  const result = await querySupabaseTable<TimelineEvent[]>("timeline_events", {
    select: "*",
    organization_id: `eq.${organizationId}`,
    limit,
    order: "created_at.desc",
  });

  if (result.error || !result.data?.length) {
    if (result.error) logTimelineServiceWarning("getTimelineEventsByOrganization", result.error);
    return mockResult(
      sortTimeline(getFallbackTimelineEvents().filter((event) => event.organization_id === organizationId)),
      result.error ?? "No live organization timeline events returned. Showing development fallback timeline.",
    );
  }

  return liveResult(result.data);
}

export async function createTimelineEvent(
  input: CreateTimelineEventInput,
): Promise<TimelineServiceResult<TimelineEvent>> {
  if (!supabaseConfig.isConfigured) {
    const organizationId = input.organization_id ?? getDevelopmentOrganizationContext().id;
    if (!organizationId) {
      return unavailableResult("Supabase environment variables are not configured and no fallback organization is available.");
    }
    return createFallbackTimelineEvent(
      input,
      organizationId,
      "Supabase environment variables are not configured. Created development fallback timeline event.",
    );
  }

  const session = await getSession();
  if (!session?.access_token) {
    const organizationId = input.organization_id ?? getDevelopmentOrganizationContext().id;
    if (!organizationId) {
      return unavailableResult("Sign in before creating a timeline event.");
    }
    return createFallbackTimelineEvent(
      input,
      organizationId,
      "No authenticated Supabase session. Created development fallback timeline event.",
    );
  }

  const currentOrganization = getDevelopmentOrganizationContext();
  const organizationId = input.organization_id ?? currentOrganization.id;

  if (!organizationId) {
    return unavailableResult("No organization context is available for timeline event creation.");
  }

  const response = await fetch(buildRestUrl("timeline_events"), {
    method: "POST",
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      organization_id: organizationId,
      case_id: input.case_id ?? null,
      patient_id: input.patient_id ?? null,
      event_type: input.event_type,
      title: input.title,
      description: input.description ?? null,
      department: input.department ?? null,
      user_id: input.user_id ?? null,
    }),
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const message = payload?.message ?? response.statusText ?? "Timeline event creation failed.";
    logTimelineServiceWarning("createTimelineEvent", message);
    return createFallbackTimelineEvent(input, organizationId, message);
  }

  const row = Array.isArray(payload) ? payload[0] : payload;
  return liveResult(row as TimelineEvent);
}
