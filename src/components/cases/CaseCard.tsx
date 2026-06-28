import { Activity, Building2, Globe2, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CasePriorityBadge } from "./CasePriorityBadge";
import { CaseStatusBadge } from "./CaseStatusBadge";
import type { PatientCase } from "../../types/case";

type CaseCardProps = {
  patientCase: PatientCase;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function CaseCard({ patientCase }: CaseCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              {patientCase.case_code}
            </p>
            <CardTitle className="mt-1 text-xl">
              {patientCase.treatment ?? "Treatment not recorded"}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CaseStatusBadge status={patientCase.status} />
            <CasePriorityBadge priority={patientCase.priority} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail icon={<Stethoscope className="h-4 w-4" />} label="Specialty" value={patientCase.specialty ?? "Not set"} />
          <Detail icon={<Globe2 className="h-4 w-4" />} label="Country" value={patientCase.country ?? "Not set"} />
          <Detail icon={<Activity className="h-4 w-4" />} label="Stage" value={patientCase.current_stage ?? "Not set"} />
          <Detail icon={<Building2 className="h-4 w-4" />} label="Department" value={patientCase.current_department ?? "Not assigned"} />
        </div>
        <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground sm:grid-cols-2">
          <p>
            Patient ID: <span className="font-medium text-foreground">{patientCase.patient_id}</span>
          </p>
          <p>
            Updated: <span className="font-medium text-foreground">{formatDate(patientCase.updated_at)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
