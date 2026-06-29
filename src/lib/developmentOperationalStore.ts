import type { PatientCase } from "../types/case";
import type { Patient } from "../types/patient";
import type { TimelineEvent } from "../services/timelineService";

const STORE_KEY = "aframedico.development.operationalWorkflow";

type DevelopmentOperationalStore = {
  patients: Patient[];
  cases: PatientCase[];
  timelineEvents: TimelineEvent[];
};

const emptyStore: DevelopmentOperationalStore = {
  patients: [],
  cases: [],
  timelineEvents: [],
};

function readStore(): DevelopmentOperationalStore {
  if (typeof window === "undefined") return emptyStore;

  const rawValue = window.localStorage.getItem(STORE_KEY);
  if (!rawValue) return emptyStore;

  try {
    const parsed = JSON.parse(rawValue) as Partial<DevelopmentOperationalStore>;
    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients : [],
      cases: Array.isArray(parsed.cases) ? parsed.cases : [],
      timelineEvents: Array.isArray(parsed.timelineEvents) ? parsed.timelineEvents : [],
    };
  } catch {
    window.localStorage.removeItem(STORE_KEY);
    return emptyStore;
  }
}

function writeStore(nextStore: DevelopmentOperationalStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(nextStore));
}

function upsertById<T extends { id: string }>(records: T[], record: T) {
  const existingIndex = records.findIndex((item) => item.id === record.id);
  if (existingIndex === -1) return [record, ...records];

  const nextRecords = [...records];
  nextRecords[existingIndex] = record;
  return nextRecords;
}

export function getDevelopmentOperationalPatients() {
  return readStore().patients;
}

export function getDevelopmentOperationalCases() {
  return readStore().cases;
}

export function getDevelopmentOperationalTimelineEvents() {
  return readStore().timelineEvents;
}

export function saveDevelopmentOperationalPatient(patient: Patient) {
  const store = readStore();
  writeStore({
    ...store,
    patients: upsertById(store.patients, patient),
  });
}

export function saveDevelopmentOperationalCase(patientCase: PatientCase) {
  const store = readStore();
  writeStore({
    ...store,
    cases: upsertById(store.cases, patientCase),
  });
}

export function saveDevelopmentOperationalTimelineEvent(event: TimelineEvent) {
  const store = readStore();
  writeStore({
    ...store,
    timelineEvents: upsertById(store.timelineEvents, event),
  });
}

export function createDevelopmentId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomPart}`;
}
