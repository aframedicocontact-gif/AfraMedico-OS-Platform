import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { PatientCase } from "../../types/case";

type CaseTravelPanelProps = {
  patientCase: PatientCase;
};

export function CaseTravelPanel({ patientCase }: CaseTravelPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-emerald-700" />
          Travel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Travel coordination remains external-booking aware. ICOS records coordination only unless future contracts or integrations say otherwise.
        </p>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-foreground">
          Travel status: {patientCase.status === "travel_planned" ? "Travel planned" : "Not started"}
        </div>
      </CardContent>
    </Card>
  );
}
