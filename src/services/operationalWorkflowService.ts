import { getDevelopmentOrganizationContext } from "../lib/currentOrganization";
import { getSession } from "./authService";
import { createCase, getCaseById } from "./caseService";
import { getCurrentOrganization } from "./organizationService";
import { createPatient, getPatientById } from "./patientService";
import {
  createTimelineEvent,
  getTimelineEventsByCaseId,
} from "./timelineService";

export type OperationalWorkflowResult = {
  status: "live" | "fallback" | "blocked";
  caseId: string | null;
  patientId: string | null;
  organizationId: string | null;
  patientPersisted: boolean;
  casePersisted: boolean;
  timelinePersisted: boolean;
  steps: string[];
  warnings: string[];
};

function createWorkflowCode(prefix: string) {
  const timestamp = new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);
  return `${prefix}-${timestamp}`;
}

function getOverallStatus(sources: Array<"live" | "mock" | "unavailable">): OperationalWorkflowResult["status"] {
  if (sources.every((source) => source === "live")) return "live";
  if (sources.some((source) => source === "mock")) return "fallback";
  return "blocked";
}

export async function runFirstOperationalWorkflow(): Promise<OperationalWorkflowResult> {
  const steps: string[] = [];
  const warnings: string[] = [];
  const sources: Array<"live" | "mock" | "unavailable"> = [];

  const session = await getSession();
  if (session?.access_token) {
    steps.push("Authentication context verified.");
  } else {
    warnings.push("No authenticated Supabase session. Development fallback mode will be used if live writes are unavailable.");
  }

  const organizationResult = await getCurrentOrganization();
  const fallbackOrganization = getDevelopmentOrganizationContext();
  const organization = organizationResult.data;
  const organizationId = organization?.id ?? fallbackOrganization.id;
  sources.push(organizationResult.source);

  if (!organizationId) {
    return {
      status: "blocked",
      caseId: null,
      patientId: null,
      organizationId: null,
      patientPersisted: false,
      casePersisted: false,
      timelinePersisted: false,
      steps,
      warnings: [
        ...warnings,
        "No organization could be resolved. Set VITE_DEV_ORGANIZATION_ID or complete live organization bootstrap.",
      ],
    };
  }

  steps.push(`Current organization resolved: ${organization?.name ?? fallbackOrganization.name}.`);
  if (organizationResult.error) warnings.push(organizationResult.error);

  const patientResult = await createPatient({
    organization_id: organizationId,
    first_name: "Development",
    last_name: "Workflow Patient",
    country: "Nigeria",
    phone: "+234 800 000 0000",
    email: `workflow.patient.${Date.now()}@example.test`,
    status: "active",
  });
  sources.push(patientResult.source);

  if (!patientResult.data) {
    return {
      status: "blocked",
      caseId: null,
      patientId: null,
      organizationId,
      patientPersisted: false,
      casePersisted: false,
      timelinePersisted: false,
      steps,
      warnings: [...warnings, patientResult.error ?? "Patient creation failed."],
    };
  }

  steps.push("Patient created.");
  if (patientResult.error) warnings.push(patientResult.error);

  const caseResult = await createCase({
    organization_id: organizationId,
    patient_id: patientResult.data.id,
    case_code: createWorkflowCode("CASE-DEV"),
    treatment: "Cardiac Surgery Evaluation",
    specialty: "Cardiology",
    country: patientResult.data.country,
    status: "new",
    priority: "high",
    urgency: "urgent",
    current_stage: "Lead",
    current_department: "Case Management",
  });
  sources.push(caseResult.source);

  if (!caseResult.data) {
    return {
      status: "blocked",
      caseId: null,
      patientId: patientResult.data.id,
      organizationId,
      patientPersisted: true,
      casePersisted: false,
      timelinePersisted: false,
      steps,
      warnings: [...warnings, caseResult.error ?? "Case creation failed."],
    };
  }

  steps.push("Case created.");
  if (caseResult.error) warnings.push(caseResult.error);

  const timelineResult = await createTimelineEvent({
    organization_id: organizationId,
    case_id: caseResult.data.id,
    patient_id: patientResult.data.id,
    event_type: "case_created",
    title: "First operational workflow completed",
    description: "Patient, case, and first timeline event were created through the end-to-end workflow.",
    department: "Case Management",
    user_id: session?.user?.id ?? null,
  });
  sources.push(timelineResult.source);

  if (timelineResult.data) {
    steps.push("First timeline event created.");
  } else {
    warnings.push(timelineResult.error ?? "Timeline event creation failed.");
  }

  const [patientReload, caseReload, timelineReload] = await Promise.all([
    getPatientById(patientResult.data.id),
    getCaseById(caseResult.data.id),
    getTimelineEventsByCaseId(caseResult.data.id),
  ]);

  const timelinePersisted = Boolean(
    timelineReload.data?.some((event) => event.case_id === caseResult.data?.id),
  );

  steps.push("Persistence verified through read-back service calls.");

  return {
    status: getOverallStatus(sources),
    caseId: caseResult.data.id,
    patientId: patientResult.data.id,
    organizationId,
    patientPersisted: Boolean(patientReload.data),
    casePersisted: Boolean(caseReload.data),
    timelinePersisted,
    steps,
    warnings: [
      ...warnings,
      ...(patientReload.error ? [`Patient reload: ${patientReload.error}`] : []),
      ...(caseReload.error ? [`Case reload: ${caseReload.error}`] : []),
      ...(timelineReload.error ? [`Timeline reload: ${timelineReload.error}`] : []),
    ],
  };
}
