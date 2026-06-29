import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { createTimelineEvent } from "../../services/timelineService";
import type { PatientCase } from "../../types/case";

const actions = [
  "Start Clinical Review",
  "Prepare Hospital Package",
  "Send Hospital Referral",
  "Create Travel Plan",
  "Review Financials",
];

type CaseActionsPanelProps = {
  canCreateTimelineNote: boolean;
  patientCase: PatientCase;
  onTimelineEventCreated: () => Promise<void>;
};

export function CaseActionsPanel({
  canCreateTimelineNote,
  patientCase,
  onTimelineEventCreated,
}: CaseActionsPanelProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  async function addInternalTimelineNote() {
    if (!canCreateTimelineNote) {
      setStatusMessage("Timeline note was not created. Live case data is required before writing timeline events.");
      return;
    }

    setIsCreatingNote(true);
    setStatusMessage(null);

    const result = await createTimelineEvent({
      organization_id: patientCase.organization_id,
      case_id: patientCase.id,
      patient_id: patientCase.patient_id,
      event_type: "internal_note",
      title: "Internal timeline note",
      description: "Development-safe internal timeline note added from Case Workspace.",
      department: patientCase.current_department ?? "Case Management",
    });

    if (result.source === "live" && result.data) {
      await onTimelineEventCreated();
      setStatusMessage("Internal timeline note created successfully.");
    } else {
      setStatusMessage(result.error ?? "Timeline note was not created. Live backend is unavailable.");
    }

    setIsCreatingNote(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Button type="button" onClick={() => void addInternalTimelineNote()} disabled={isCreatingNote}>
          {isCreatingNote ? "Adding Note..." : "Add Internal Timeline Note"}
        </Button>
        <Button type="button" variant="secondary">
          Request Missing Documents
        </Button>
        {actions.map((action) => (
          <Button key={action} type="button" variant="secondary">
            {action}
          </Button>
        ))}
        {statusMessage ? (
          <p className="md:col-span-2 xl:col-span-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-muted-foreground">
            {statusMessage}
          </p>
        ) : null}
        <p className="md:col-span-2 xl:col-span-3 text-xs text-muted-foreground">
          Only "Add Internal Timeline Note" can write, and only to `timeline_events`. All other buttons are placeholders.
        </p>
      </CardContent>
    </Card>
  );
}
