import type { Organization } from "../types/organization";
import type {
  OutreachCommunication,
  OutreachContact,
  OutreachDocument,
  OutreachMeeting,
  OutreachNote,
  OutreachTask,
  OutreachTimelineEvent,
  OutreachWorkspaceRecord,
  PartnershipStage,
} from "../types/outreach";

const outreachStorageKey = "aframedico.authorityOutreach.workspaces";

type OutreachStore = Record<string, OutreachWorkspaceRecord>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function readStore(): OutreachStore {
  if (typeof window === "undefined") return {};

  const rawValue = window.localStorage.getItem(outreachStorageKey);
  if (!rawValue) return {};

  try {
    return JSON.parse(rawValue) as OutreachStore;
  } catch {
    window.localStorage.removeItem(outreachStorageKey);
    return {};
  }
}

function writeStore(store: OutreachStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(outreachStorageKey, JSON.stringify(store));
}

function seedWorkspace(organization: Organization): OutreachWorkspaceRecord {
  return {
    organizationId: organization.id,
    partnershipStage:
      organization.status === "partner"
        ? "Active Partner"
        : organization.status === "in-discussion"
          ? "Negotiating"
          : organization.status === "contacted"
            ? "Contacted"
            : "Discovered",
    contacts: [
      {
        id: createId("contact"),
        organizationId: organization.id,
        fullName: organization.contactName,
        position: "Primary Contact",
        department: organization.category,
        email: organization.email,
        phone: "To qualify",
        linkedin: organization.linkedin,
        decisionMaker: organization.priority === "high",
        preferredCommunication: "Email",
        status: "New",
        createdAt: today(),
      },
    ],
    communications: organization.status === "contacted" || organization.status === "in-discussion" || organization.status === "partner"
      ? [
          {
            id: createId("comm"),
            organizationId: organization.id,
            date: organization.activity[0]?.date ?? today(),
            type: "Email",
            subject: "Initial authority outreach",
            summary: organization.nextStep,
            outcome: organization.status === "partner" ? "Positive" : "Awaiting response",
            nextAction: organization.nextStep,
          },
        ]
      : [],
    tasks: [
      {
        id: createId("task"),
        organizationId: organization.id,
        title: organization.nextStep,
        assignedTo: organization.owner,
        dueDate: organization.nextFollowUp,
        priority: organization.priority === "high" ? "High" : organization.priority === "medium" ? "Medium" : "Low",
        status: "Open",
        reminder: "1 day before",
      },
    ],
    meetings: [],
    documents: [
      {
        id: createId("doc"),
        organizationId: organization.id,
        title: "Authority partnership brief",
        documentType: "Proposal",
        status: "Draft",
        updatedAt: today(),
      },
    ],
    notes: [
      {
        id: createId("note"),
        organizationId: organization.id,
        date: today(),
        author: "Growth",
        note: organization.notes,
      },
    ],
    history: [
      ...organization.activity.map((item) => ({
        id: createId("history"),
        organizationId: organization.id,
        date: item.date,
        type: item.title,
        title: item.title,
        detail: item.detail,
      })),
      {
        id: createId("history"),
        organizationId: organization.id,
        date: today(),
        type: "Outreach Workspace",
        title: "Workspace initialized",
        detail: "Authority relationship workspace created from CRM record.",
      },
    ],
    updatedAt: today(),
  };
}

export function getOutreachWorkspace(organization: Organization) {
  const store = readStore();
  if (store[organization.id]) return store[organization.id];

  const workspace = seedWorkspace(organization);
  writeStore({ ...store, [organization.id]: workspace });
  return workspace;
}

export function saveOutreachWorkspace(workspace: OutreachWorkspaceRecord) {
  const store = readStore();
  const nextWorkspace = { ...workspace, updatedAt: today() };
  writeStore({ ...store, [workspace.organizationId]: nextWorkspace });
  return nextWorkspace;
}

export function addOutreachContact(workspace: OutreachWorkspaceRecord, contact: Omit<OutreachContact, "id" | "organizationId" | "createdAt">) {
  return saveOutreachWorkspace({
    ...workspace,
    contacts: [
      ...workspace.contacts,
      { ...contact, id: createId("contact"), organizationId: workspace.organizationId, createdAt: today() },
    ],
    history: [
      ...workspace.history,
      createTimelineEvent(workspace.organizationId, "Contact", "Contact added", `${contact.fullName} added as ${contact.position}.`),
    ],
  });
}

export function addOutreachCommunication(workspace: OutreachWorkspaceRecord, communication: Omit<OutreachCommunication, "id" | "organizationId">) {
  return saveOutreachWorkspace({
    ...workspace,
    communications: [
      ...workspace.communications,
      { ...communication, id: createId("comm"), organizationId: workspace.organizationId },
    ],
    history: [
      ...workspace.history,
      createTimelineEvent(workspace.organizationId, communication.type, communication.subject, communication.summary),
    ],
  });
}

export function addOutreachTask(workspace: OutreachWorkspaceRecord, task: Omit<OutreachTask, "id" | "organizationId">) {
  return saveOutreachWorkspace({
    ...workspace,
    tasks: [...workspace.tasks, { ...task, id: createId("task"), organizationId: workspace.organizationId }],
    history: [
      ...workspace.history,
      createTimelineEvent(workspace.organizationId, "Task", task.title, `Assigned to ${task.assignedTo}. Due ${task.dueDate}.`),
    ],
  });
}

export function addOutreachNote(workspace: OutreachWorkspaceRecord, note: Omit<OutreachNote, "id" | "organizationId" | "date">) {
  return saveOutreachWorkspace({
    ...workspace,
    notes: [...workspace.notes, { ...note, id: createId("note"), organizationId: workspace.organizationId, date: today() }],
    history: [
      ...workspace.history,
      createTimelineEvent(workspace.organizationId, "Note", "Note added", note.note),
    ],
  });
}

export function addOutreachMeeting(workspace: OutreachWorkspaceRecord, meeting: Omit<OutreachMeeting, "id" | "organizationId">) {
  return saveOutreachWorkspace({
    ...workspace,
    meetings: [...workspace.meetings, { ...meeting, id: createId("meeting"), organizationId: workspace.organizationId }],
    history: [
      ...workspace.history,
      createTimelineEvent(workspace.organizationId, "Meeting", meeting.title, meeting.outcome),
    ],
  });
}

export function addOutreachDocument(workspace: OutreachWorkspaceRecord, document: Omit<OutreachDocument, "id" | "organizationId">) {
  return saveOutreachWorkspace({
    ...workspace,
    documents: [...workspace.documents, { ...document, id: createId("doc"), organizationId: workspace.organizationId }],
    history: [
      ...workspace.history,
      createTimelineEvent(workspace.organizationId, "Document", document.title, `${document.documentType} is ${document.status}.`),
    ],
  });
}

export function updatePartnershipStage(workspace: OutreachWorkspaceRecord, partnershipStage: PartnershipStage) {
  return saveOutreachWorkspace({
    ...workspace,
    partnershipStage,
    history: [
      ...workspace.history,
      createTimelineEvent(workspace.organizationId, "Status Change", `Moved to ${partnershipStage}`, "Partnership pipeline stage updated."),
    ],
  });
}

function createTimelineEvent(
  organizationId: string,
  type: string,
  title: string,
  detail: string,
): OutreachTimelineEvent {
  return {
    id: createId("history"),
    organizationId,
    date: today(),
    type,
    title,
    detail,
  };
}
