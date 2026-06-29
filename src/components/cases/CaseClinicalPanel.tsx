import { Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import type { PatientCase } from "../../types/case";

type CaseClinicalPanelProps = {
  patientCase: PatientCase;
};

export function CaseClinicalPanel({ patientCase }: CaseClinicalPanelProps) {
  const ready = patientCase.current_stage === "Clinical Decision" || patientCase.status === "waiting_quotes";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-emerald-700" />
          Clinical Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge tone={ready ? "success" : "warning"}>{ready ? "Clinical workflow active" : "Clinical workflow pending"}</Badge>
        <p className="text-sm text-muted-foreground">
          Clinical Decision Center will own medical review, document completeness, internal validation, hospital package readiness, and MSO preparation for this case.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Specialty" value={patientCase.specialty ?? "Not set"} />
          <Metric label="Urgency" value={patientCase.urgency} />
          <Metric label="Stage" value={patientCase.current_stage ?? "Not set"} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
