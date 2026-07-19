import { Plus } from "lucide-react";
import type { AppView } from "../../app/App";
import type { Lead } from "../../types/lead";
import { CaseStatusBadge, LeadPriorityBadge, LeadStatusBadge, formatCurrency, leadPipelineStages } from "../leads/leadUi";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { KanbanBoard, KanbanColumn, KanbanColumns } from "../ui/kanban-board";

type LeadPipelineProps = {
  leads: Lead[];
  loading?: boolean;
  error?: string | null;
  dataSource?: "live" | "development" | "unavailable";
  onNavigate: (view: AppView) => void;
};

export function LeadPipeline({ dataSource, error, leads, loading, onNavigate }: LeadPipelineProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Lead Management</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Lead Pipeline</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Track patient movement from first inquiry through documents, medical review, quotes, decision, and confirmation.
          </p>
        </div>
        <Button type="button" onClick={() => onNavigate({ name: "add-lead" })}>
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <LeadDataState loading={loading} error={error} source={dataSource} />

      <KanbanBoard>
        <KanbanColumns>
          {leadPipelineStages.map((stage) => {
            const stageLeads = leads.filter((lead) => lead.pipelineStage === stage);

            return (
              <KanbanColumn key={stage}>
                <Card className="min-h-80">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between gap-2 text-sm">
                      <span>{stage}</span>
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-900">
                        {stageLeads.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stageLeads.map((lead) => (
                      <button
                        key={lead.id}
                        className="w-full rounded-md border bg-white p-3 text-left shadow-sm hover:bg-muted"
                        type="button"
                        onClick={() => onNavigate({ name: "lead-profile", leadId: lead.id })}
                      >
                        <p className="font-medium text-emerald-950">{lead.patientName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {lead.caseId} | {lead.interestedTreatment}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {lead.city}, {lead.country}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <LeadPriorityBadge priority={lead.priority} />
                          <LeadStatusBadge status={lead.currentStatus} />
                          <CaseStatusBadge status={lead.caseStatus} />
                        </div>
                        <p className="mt-3 text-xs font-medium text-emerald-900">
                          {formatCurrency(lead.estimatedTreatmentCost)}
                        </p>
                      </button>
                    ))}
                    {stageLeads.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                        No leads in this stage.
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </KanbanColumn>
            );
          })}
        </KanbanColumns>
      </KanbanBoard>
    </div>
  );
}

function LeadDataState({
  error,
  loading,
  source,
}: {
  error?: string | null;
  loading?: boolean;
  source?: "live" | "development" | "unavailable";
}) {
  if (loading) {
    return <div className="rounded-md border bg-white p-3 text-sm text-muted-foreground">Loading Leads from the operational backend...</div>;
  }

  if (error) {
    const tone = source === "development" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800";
    return <div className={`rounded-md border p-3 text-sm ${tone}`}>{error}</div>;
  }

  return null;
}
