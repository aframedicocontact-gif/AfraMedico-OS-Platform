import { Hospital } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { PatientCase } from "../../types/case";

type CaseReferralPanelProps = {
  patientCase: PatientCase;
};

export function CaseReferralPanel({ patientCase }: CaseReferralPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hospital className="h-5 w-5 text-emerald-700" />
          Hospital Referral
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Hospital Referral will connect this case to one or more healthcare providers while preserving referral history and quote history.
        </p>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-foreground">
          Suggested readiness: {patientCase.status === "waiting_quotes" ? "Ready for hospital quote workflow" : "Prepare referral package"}
        </div>
      </CardContent>
    </Card>
  );
}
