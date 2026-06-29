import { useEffect, useState } from "react";
import { ArrowLeft, Database } from "lucide-react";
import type { AppView } from "../../app/App";
import { getCaseById, type CaseServiceResult } from "../../services/caseService";
import { getPatientById, type PatientServiceResult } from "../../services/patientService";
import {
  getTimelineEventsByCaseId,
  type TimelineEvent,
  type TimelineServiceResult,
} from "../../services/timelineService";
import type { PatientCase } from "../../types/case";
import type { Patient } from "../../types/patient";
import { CaseActionsPanel } from "../cases/CaseActionsPanel";
import { CaseClinicalPanel } from "../cases/CaseClinicalPanel";
import { CaseDocumentsPanel } from "../cases/CaseDocumentsPanel";
import { CaseFinancePanel } from "../cases/CaseFinancePanel";
import { CaseOverviewPanel } from "../cases/CaseOverviewPanel";
import { CaseReferralPanel } from "../cases/CaseReferralPanel";
import { CaseTimelinePanel } from "../cases/CaseTimelinePanel";
import { CaseTravelPanel } from "../cases/CaseTravelPanel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

type CaseDetailPageProps = {
  caseId: string;
  onNavigate: (view: AppView) => void;
};

type CaseDetailState = {
  loading: boolean;
  caseResult: CaseServiceResult<PatientCase> | null;
  patientResult: PatientServiceResult<Patient> | null;
  timelineResult: TimelineServiceResult<TimelineEvent[]> | null;
};

const sections = [
  "Overview",
  "Timeline",
  "Documents",
  "Clinical Review",
  "Hospital Referral",
  "Travel",
  "Finance",
  "Actions",
] as const;

type Section = (typeof sections)[number];

export function CaseDetailPage({ caseId, onNavigate }: CaseDetailPageProps) {
  const [activeSection, setActiveSection] = useState<Section>("Overview");
  const [state, setState] = useState<CaseDetailState>({
    loading: true,
    caseResult: null,
    patientResult: null,
    timelineResult: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadCase() {
      const caseResult = await getCaseById(caseId);
      const [patientResult, timelineResult] = caseResult.data
        ? await Promise.all([
            getPatientById(caseResult.data.patient_id),
            getTimelineEventsByCaseId(caseResult.data.id),
          ])
        : [null, null];

      if (mounted) {
        setState({
          loading: false,
          caseResult,
          patientResult,
          timelineResult,
        });
      }
    }

    void loadCase();

    return () => {
      mounted = false;
    };
  }, [caseId]);

  const patientCase = state.caseResult?.data ?? null;
  const patient = state.patientResult?.data ?? null;
  const source = state.caseResult?.source ?? "unavailable";

  async function reloadTimeline() {
    if (!patientCase) return;

    const timelineResult = await getTimelineEventsByCaseId(patientCase.id);
    setState((current) => ({ ...current, timelineResult }));
  }

  if (state.loading) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Loading case workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">Checking live Supabase access and fallback case data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patientCase) {
    return (
      <Card>
        <CardContent className="space-y-4 p-5">
          <Button type="button" variant="secondary" onClick={() => onNavigate({ name: "cases" })}>
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Button>
          <div>
            <p className="font-medium">Case not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {state.caseResult?.error ?? "The requested case could not be loaded."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button type="button" variant="secondary" onClick={() => onNavigate({ name: "cases" })}>
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Button>
          <p className="mt-4 text-sm font-medium text-primary">Case Detail Workspace</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{patientCase.case_code}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Operational center for one patient case. Sprint 9 connects live reads and limits writes to internal timeline notes only.
          </p>
        </div>
        <Badge tone={source === "live" ? "success" : source === "mock" ? "warning" : "danger"}>
          {source}
        </Badge>
      </div>

      {state.caseResult?.error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {state.caseResult.error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {sections.map((section) => (
            <Button
              key={section}
              type="button"
              variant={activeSection === section ? "primary" : "secondary"}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </Button>
          ))}
        </div>
      </div>

      {activeSection === "Overview" ? <CaseOverviewPanel patientCase={patientCase} patient={patient} /> : null}
      {activeSection === "Timeline" ? (
        <CaseTimelinePanel patientCase={patientCase} timelineResult={state.timelineResult} />
      ) : null}
      {activeSection === "Documents" ? <CaseDocumentsPanel patientCase={patientCase} /> : null}
      {activeSection === "Clinical Review" ? <CaseClinicalPanel patientCase={patientCase} /> : null}
      {activeSection === "Hospital Referral" ? <CaseReferralPanel patientCase={patientCase} /> : null}
      {activeSection === "Travel" ? <CaseTravelPanel patientCase={patientCase} /> : null}
      {activeSection === "Finance" ? <CaseFinancePanel patientCase={patientCase} /> : null}
      {activeSection === "Actions" ? (
        <CaseActionsPanel
          canCreateTimelineNote={state.caseResult?.source === "live" || state.caseResult?.source === "mock"}
          patientCase={patientCase}
          onTimelineEventCreated={reloadTimeline}
        />
      ) : null}
    </div>
  );
}
