import type { Organization } from "../types/organization";

export type OutreachDraftKind =
  | "professionalEmail"
  | "linkedinMessage"
  | "whatsappMessage"
  | "meetingRequest"
  | "followUpEmail";

export type OutreachDrafts = Record<OutreachDraftKind, string>;

export type StoredOutreachDraftRecord = {
  organizationId: string;
  organizationName: string;
  drafts: OutreachDrafts;
  updatedAt: string;
};

export type GenerateOutreachDraftsResult =
  | { ok: true; drafts: OutreachDrafts }
  | { ok: false; error: string };

const STORAGE_KEY = "aframedico.aiOutreachAssistant.drafts";

export const emptyOutreachDrafts: OutreachDrafts = {
  professionalEmail: "",
  linkedinMessage: "",
  whatsappMessage: "",
  meetingRequest: "",
  followUpEmail: "",
};

function readDraftStore(): Record<string, StoredOutreachDraftRecord> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDraftStore(store: Record<string, StoredOutreachDraftRecord>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getStoredOutreachDrafts(organizationId: string): StoredOutreachDraftRecord | null {
  return readDraftStore()[organizationId] ?? null;
}

export function saveStoredOutreachDrafts(
  organization: Pick<Organization, "id" | "name">,
  drafts: OutreachDrafts,
): StoredOutreachDraftRecord {
  const store = readDraftStore();
  const record: StoredOutreachDraftRecord = {
    organizationId: organization.id,
    organizationName: organization.name,
    drafts,
    updatedAt: new Date().toISOString(),
  };
  store[organization.id] = record;
  writeDraftStore(store);
  return record;
}

export function clearStoredOutreachDrafts(organizationId: string) {
  const store = readDraftStore();
  delete store[organizationId];
  writeDraftStore(store);
}

function normalizeDrafts(value: Partial<OutreachDrafts> | null | undefined): OutreachDrafts {
  return {
    professionalEmail: value?.professionalEmail ?? "",
    linkedinMessage: value?.linkedinMessage ?? "",
    whatsappMessage: value?.whatsappMessage ?? "",
    meetingRequest: value?.meetingRequest ?? "",
    followUpEmail: value?.followUpEmail ?? "",
  };
}

export async function generateOutreachDrafts(organization: Organization): Promise<GenerateOutreachDraftsResult> {
  try {
    const response = await fetch("/api/outreach-assistant/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organization }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: typeof payload.error === "string" ? payload.error : "AI Outreach Assistant is unavailable.",
      };
    }

    return {
      ok: true,
      drafts: normalizeDrafts(payload.drafts),
    };
  } catch {
    return {
      ok: false,
      error: "AI Outreach Assistant could not reach the secure backend route.",
    };
  }
}
