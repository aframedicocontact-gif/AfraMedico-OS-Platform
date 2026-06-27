import { Plus } from "lucide-react";
import type { AppView } from "../../app/App";
import type { ReferralPartner } from "../../types/referralPartner";
import { ReferralStatusBadge, formatCurrency, pipelineStages } from "../referrals/referralUi";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { KanbanBoard, KanbanColumn, KanbanColumns } from "../ui/kanban-board";

type ReferralPipelineProps = {
  partners: ReferralPartner[];
  onNavigate: (view: AppView) => void;
};

export function ReferralPipeline({ partners, onNavigate }: ReferralPipelineProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Referral Partner CRM</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Referral Pipeline</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Track referral partner progress from prospecting through active referral generation.
          </p>
        </div>
        <Button type="button" onClick={() => onNavigate({ name: "add-referral-partner" })}>
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      <KanbanBoard>
        <KanbanColumns>
          {pipelineStages.map((stage) => {
            const stagePartners = partners.filter((partner) => partner.referralStatus === stage);

            return (
              <KanbanColumn key={stage}>
                <Card className="min-h-80">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between gap-2 text-sm">
                      <span>{stage}</span>
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-900">
                        {stagePartners.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stagePartners.map((partner) => (
                      <button
                        key={partner.id}
                        className="w-full rounded-md border bg-white p-3 text-left shadow-sm hover:bg-muted"
                        type="button"
                        onClick={() =>
                          onNavigate({
                            name: "referral-partner-profile",
                            partnerId: partner.id,
                          })
                        }
                      >
                        <p className="font-medium text-emerald-950">{partner.organizationName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {partner.city}, {partner.country}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <ReferralStatusBadge status={partner.referralStatus} />
                          <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-900">
                            {formatCurrency(partner.estimatedRevenue)}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Next: {partner.nextFollowUp}
                        </p>
                      </button>
                    ))}
                    {stagePartners.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                        No partners in this stage.
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
