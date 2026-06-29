import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { PatientCase } from "../../types/case";
import { Badge } from "../ui/badge";
import type { TimelineEvent, TimelineServiceResult } from "../../services/timelineService";

type CaseTimelinePanelProps = {
  patientCase: PatientCase;
  timelineResult: TimelineServiceResult<TimelineEvent[]> | null;
};

export function CaseTimelinePanel({ patientCase, timelineResult }: CaseTimelinePanelProps) {
  const events =
    timelineResult?.data?.length
      ? timelineResult.data
      : [
          {
            id: `${patientCase.id}-created`,
            organization_id: patientCase.organization_id,
            case_id: patientCase.id,
            patient_id: patientCase.patient_id,
            event_type: "case_created",
            title: "Case created",
            description: "Initial patient case record created.",
            department: patientCase.current_department,
            user_id: null,
            event_type_id: null,
            created_at: patientCase.created_at,
          },
          {
            id: `${patientCase.id}-stage`,
            organization_id: patientCase.organization_id,
            case_id: patientCase.id,
            patient_id: patientCase.patient_id,
            event_type: "stage_updated",
            title: "Current stage updated",
            description: patientCase.current_stage ?? "Stage not set.",
            department: patientCase.current_department,
            user_id: null,
            event_type_id: null,
            created_at: patientCase.updated_at,
          },
        ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Case Timeline</CardTitle>
          <Badge tone={timelineResult?.source === "live" ? "success" : "warning"}>
            {timelineResult?.source ?? "fallback"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border-l-2 border-emerald-200 pl-4">
            <p className="font-medium text-foreground">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(event.created_at).toLocaleString()} · {event.department ?? "Department not set"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{event.description ?? event.event_type}</p>
          </div>
        ))}
        {timelineResult?.error ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {timelineResult.error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
