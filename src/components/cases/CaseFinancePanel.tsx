import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { PatientCase } from "../../types/case";

type CaseFinancePanelProps = {
  patientCase: PatientCase;
};

export function CaseFinancePanel({ patientCase }: CaseFinancePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-700" />
          Finance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Finance will connect accepted quotes, invoices, deposits, hospital payments, AfraMedico margin, partner commission, and financial audit trail.
        </p>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-foreground">
          Financial stage: {patientCase.status === "waiting_quotes" ? "Awaiting quote baseline" : "Not ready for financial workflow"}
        </div>
      </CardContent>
    </Card>
  );
}
