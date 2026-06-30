import { ArrowLeft, ArrowRight, Building2, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppView } from "../../app/App";
import type { Organization } from "../../types/organization";
import { ExternalFieldLink } from "../common/ExternalFieldLink";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { KanbanBoard, KanbanColumn, KanbanColumns } from "../ui/kanban-board";

type EnterpriseTaskBoardProps = {
  organizations: Organization[];
  onNavigate: (view: AppView) => void;
};

type BoardStage =
  | "Discovery"
  | "Research"
  | "Qualified"
  | "Contacted"
  | "Meeting Scheduled"
  | "Proposal Sent"
  | "Negotiating"
  | "Agreement Signed"
  | "Active Partner"
  | "Archived";

const boardStages: BoardStage[] = [
  "Discovery",
  "Research",
  "Qualified",
  "Contacted",
  "Meeting Scheduled",
  "Proposal Sent",
  "Negotiating",
  "Agreement Signed",
  "Active Partner",
  "Archived",
];

const stageStorageKey = "aframedico.authorityCrm.enterpriseTaskBoard.stages";

function readStoredStages() {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.localStorage.getItem(stageStorageKey);
    return rawValue ? (JSON.parse(rawValue) as Record<string, BoardStage>) : {};
  } catch {
    window.localStorage.removeItem(stageStorageKey);
    return {};
  }
}

function writeStoredStages(stages: Record<string, BoardStage>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(stageStorageKey, JSON.stringify(stages));
}

function deriveStage(organization: Organization): BoardStage {
  if (organization.status === "contacted") return "Contacted";
  if (organization.status === "in-discussion") return "Negotiating";
  if (organization.status === "partner" || organization.status === "backlink-secured") return "Active Partner";
  if (organization.status === "rejected") return "Archived";
  if (organization.verificationStatus === "Needs Manual Review") return "Qualified";
  if (organization.sourceUrl || organization.description || organization.aiSummary) return "Research";
  return "Discovery";
}

function stageTone(stage: BoardStage) {
  if (stage === "Active Partner" || stage === "Agreement Signed") return "success";
  if (stage === "Negotiating" || stage === "Proposal Sent") return "gold";
  if (stage === "Archived") return "muted";
  if (stage === "Contacted" || stage === "Meeting Scheduled") return "info";
  return "warning";
}

export function EnterpriseTaskBoard({ organizations, onNavigate }: EnterpriseTaskBoardProps) {
  const [stageOverrides, setStageOverrides] = useState<Record<string, BoardStage>>(() => readStoredStages());

  const organizationsByStage = useMemo(() => {
    return boardStages.reduce<Record<BoardStage, Organization[]>>((grouped, stage) => {
      grouped[stage] = organizations.filter((organization) => {
        const currentStage = stageOverrides[organization.id] ?? deriveStage(organization);
        return currentStage === stage;
      });
      return grouped;
    }, {} as Record<BoardStage, Organization[]>);
  }, [organizations, stageOverrides]);

  function moveOrganization(organization: Organization, direction: -1 | 1) {
    const currentStage = stageOverrides[organization.id] ?? deriveStage(organization);
    const currentIndex = boardStages.indexOf(currentStage);
    const nextIndex = Math.max(0, Math.min(boardStages.length - 1, currentIndex + direction));
    const nextOverrides = {
      ...stageOverrides,
      [organization.id]: boardStages[nextIndex],
    };

    setStageOverrides(nextOverrides);
    writeStoredStages(nextOverrides);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Authority CRM</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Enterprise Task Board</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Track every business development activity as organizations move from discovery to active partnership.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "authority-discovery" })}>
            Authority Discovery
          </Button>
          <Button type="button" onClick={() => onNavigate({ name: "organizations" })}>
            Organizations List
          </Button>
        </div>
      </div>

      <KanbanBoard>
        <KanbanColumns>
          {boardStages.map((stage) => (
            <KanbanColumn key={stage} className="w-[300px] sm:w-[320px]">
              <Card className="h-full border-emerald-100">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm">{stage}</CardTitle>
                    <Badge tone={stageTone(stage)}>{organizationsByStage[stage].length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {organizationsByStage[stage].length === 0 ? (
                    <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">
                      No organizations in this stage.
                    </div>
                  ) : (
                    organizationsByStage[stage].map((organization) => (
                      <div key={organization.id} className="rounded-lg border bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-emerald-950">{organization.name}</div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge tone="info">{organization.country}</Badge>
                              <Badge tone="muted">{organization.category}</Badge>
                            </div>
                          </div>
                          <button
                            aria-label={`Open ${organization.name}`}
                            className="rounded-md p-1 text-emerald-700 hover:bg-emerald-50"
                            type="button"
                            onClick={() => onNavigate({ name: "organization-details", organizationId: organization.id })}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                            <span>{organization.organizationType || organization.opportunityType}</span>
                          </div>
                          <ExternalFieldLink type="website" value={organization.website} />
                          <p className="line-clamp-3">
                            {organization.nextStep || organization.aiSummary || organization.notes}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Button
                            className="h-8 px-2 text-xs"
                            disabled={stage === boardStages[0]}
                            type="button"
                            variant="secondary"
                            onClick={() => moveOrganization(organization, -1)}
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                          </Button>
                          <Button
                            className="h-8 px-2 text-xs"
                            disabled={stage === boardStages[boardStages.length - 1]}
                            type="button"
                            onClick={() => moveOrganization(organization, 1)}
                          >
                            Next
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </KanbanColumn>
          ))}
        </KanbanColumns>
      </KanbanBoard>
    </div>
  );
}
