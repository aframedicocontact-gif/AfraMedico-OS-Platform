import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatLiveSource, formatLiveLifecycle, mapLivePartnerToPipelineStage } from "../../lib/livePartnerFormat";
import { getLivePartners } from "../../services/partnerService";
import type { LivePartner } from "../../types/partnerRecord";
import type { ReferralPartner } from "../../types/referralPartner";
import {
  ReferralPartnerNav,
  ReferralStatusBadge,
  formatCurrency,
  pipelineStages,
} from "../referrals/referralUi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { KanbanBoard, KanbanColumn, KanbanColumns } from "../ui/kanban-board";

type ReferralPipelineProps = {
  partners: ReferralPartner[];
};

export function ReferralPipeline({ partners }: ReferralPipelineProps) {
  const navigate = useNavigate();
  const [livePartners, setLivePartners] = useState<LivePartner[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLivePartners() {
      setLiveLoading(true);
      const result = await getLivePartners();
      if (cancelled) return;

      setLivePartners(result.data ?? []);
      setLiveError(result.error);
      setLiveLoading(false);
    }

    loadLivePartners();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <ReferralPartnerNav current="pipeline" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Referral Partner CRM</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Referral Pipeline</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Track referral partner progress from prospecting through active referral generation.
          </p>
        </div>
        <Button type="button" onClick={() => navigate("/referrals/add")}>
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {liveLoading ? (
        <p className="text-xs text-muted-foreground">Loading live partners…</p>
      ) : liveError ? (
        <p className="text-xs text-rose-700">{liveError}</p>
      ) : null}

      <KanbanBoard>
        <KanbanColumns>
          {pipelineStages.map((stage) => {
            const stageLivePartners = livePartners.filter(
              (partner) => mapLivePartnerToPipelineStage(partner) === stage,
            );
            const stagePartners = partners.filter((partner) => partner.referralStatus === stage);
            const totalCount = stageLivePartners.length + stagePartners.length;

            return (
              <KanbanColumn key={stage}>
                <Card className="min-h-80">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between gap-2 text-sm">
                      <span>{stage}</span>
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-900">
                        {totalCount}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stageLivePartners.map((partner) => (
                      <button
                        key={`live-${partner.id}`}
                        className="w-full rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-left shadow-sm hover:bg-emerald-50"
                        type="button"
                        onClick={() => navigate(`/referrals/partners/${partner.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-emerald-950">{partner.name}</p>
                          <Badge tone="success">Live</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {partner.partner_code} · {partner.country ?? "—"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge tone="info">{formatLiveSource(partner.acquisition_source)}</Badge>
                          <Badge tone="gold">{formatLiveLifecycle(partner.lifecycle_stage)}</Badge>
                        </div>
                      </button>
                    ))}
                    {stagePartners.map((partner) => (
                      <button
                        key={partner.id}
                        className="w-full rounded-md border bg-white p-3 text-left shadow-sm hover:bg-muted"
                        type="button"
                        onClick={() => navigate(`/referrals/partners/${partner.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-emerald-950">{partner.organizationName}</p>
                          <Badge tone="muted">Prototype</Badge>
                        </div>
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
                    {totalCount === 0 ? (
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
