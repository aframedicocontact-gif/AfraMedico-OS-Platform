import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { PatientCase } from "../../types/case";

type CaseTimelinePanelProps = {
  patientCase: PatientCase;
};

export function CaseTimelinePanel({ patientCase }: CaseTimelinePanelProps) {
  const events = [
    { title: "Case created", date: patientCase.created_at, detail: "Initial patient case record created." },
    { title: "Current stage updated", date: patientCase.updated_at, detail: patientCase.current_stage ?? "Stage not set." },
    { title: "Operational owner pending", date: patientCase.updated_at, detail: patientCase.current_owner_id ?? "Owner assignment will connect in a future sprint." },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div key={`${event.title}-${event.date}`} className="border-l-2 border-emerald-200 pl-4">
            <p className="font-medium text-foreground">{event.title}</p>
            <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
