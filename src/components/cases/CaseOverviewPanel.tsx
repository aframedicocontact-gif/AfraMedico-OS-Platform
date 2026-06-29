import { CalendarDays, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CasePriorityBadge } from "./CasePriorityBadge";
import { CaseStatusBadge } from "./CaseStatusBadge";
import type { PatientCase } from "../../types/case";
import type { Patient } from "../../types/patient";

type CaseOverviewPanelProps = {
  patientCase: PatientCase;
  patient: Patient | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function CaseOverviewPanel({ patientCase, patient }: CaseOverviewPanelProps) {
  const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient summary unavailable";

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">{patientCase.case_code}</p>
              <CardTitle className="mt-1 text-2xl">{patientCase.treatment ?? "Treatment not recorded"}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <CaseStatusBadge status={patientCase.status} />
              <CasePriorityBadge priority={patientCase.priority} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Detail label="Specialty" value={patientCase.specialty ?? "Not set"} />
            <Detail label="Urgency" value={patientCase.urgency} />
            <Detail label="Current Stage" value={patientCase.current_stage ?? "Not set"} />
            <Detail label="Department" value={patientCase.current_department ?? "Not assigned"} />
            <Detail label="Current Owner" value={patientCase.current_owner_id ?? "Not assigned"} />
            <Detail label="Country" value={patientCase.country ?? "Not set"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserRound className="h-5 w-5 text-emerald-700" />
            Patient Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Detail label="Patient" value={patientName} />
          <Detail label="Patient ID" value={patientCase.patient_id} />
          <Detail label="Patient Country" value={patient?.country ?? patientCase.country ?? "Not set"} />
          <Detail label="Email" value={patient?.email ?? "Not set"} />
          <Detail label="Phone" value={patient?.phone ?? "Not set"} />
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Case Dates
            </div>
            <p className="mt-1 text-foreground">
              Created {formatDate(patientCase.created_at)} · Updated {formatDate(patientCase.updated_at)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
