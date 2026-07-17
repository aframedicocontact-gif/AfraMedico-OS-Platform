import {
  BadgeDollarSign,
  Building2,
  ClipboardSignature,
  Flag,
  Handshake,
  Plus,
  Stethoscope,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getLivePartners } from "../../services/partnerService";
import type { LivePartner } from "../../types/partnerRecord";
import type { ReferralPartner } from "../../types/referralPartner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  ReferralPartnerNav,
  ReferralStatusBadge,
  formatCurrency,
  pipelineStages,
} from "../referrals/referralUi";

type ReferralDashboardProps = {
  partners: ReferralPartner[];
};

export function ReferralDashboard({ partners }: ReferralDashboardProps) {
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

  const activePartners = partners.filter((partner) => partner.referralStatus === "Active Referrer").length;
  const newReferrals = partners.reduce((sum, partner) => sum + partner.newReferrals, 0);
  const patientsReferred = partners.reduce((sum, partner) => sum + partner.patientsReferred, 0);
  const estimatedRevenue = partners.reduce((sum, partner) => sum + partner.estimatedRevenue, 0);
  const pendingAgreements = partners.filter((partner) =>
    ["Draft Sent", "Under Review"].includes(partner.agreementStatus),
  ).length;
  const countriesCovered = new Set(partners.map((partner) => partner.country)).size;

  return (
    <div className="space-y-6">
      <ReferralPartnerNav current="dashboard" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Referral Partner CRM</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Referral Dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage partners who can refer patients to AfraMedico and monitor referral performance across Africa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/referrals/pipeline")}>
            View pipeline
          </Button>
          <Button type="button" onClick={() => navigate("/referrals/add")}>
            <Plus className="h-4 w-4" />
            Add Partner
          </Button>
        </div>
      </div>

      <Card className="border-emerald-100">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">
              <Handshake className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Live Partners</p>
                <Badge tone="success">Live</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {liveError ? liveError : "Sourced directly from the AfraMedico Supabase database."}
              </p>
            </div>
          </div>
          <span className="text-xl font-semibold text-emerald-950">
            {liveLoading ? "…" : liveError ? "—" : livePartners.length}
          </span>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-emerald-950">Prototype Metrics</h3>
        <Badge tone="muted">Prototype Data</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Metric icon={<Building2 className="h-4 w-4" />} label="Total Partners" value={partners.length} />
        <Metric icon={<Handshake className="h-4 w-4" />} label="Active Partners" value={activePartners} />
        <Metric icon={<Stethoscope className="h-4 w-4" />} label="New Referrals" value={newReferrals} />
        <Metric icon={<Users className="h-4 w-4" />} label="Patients Referred" value={patientsReferred} />
        <Metric icon={<BadgeDollarSign className="h-4 w-4" />} label="Estimated Revenue" value={formatCurrency(estimatedRevenue)} />
        <Metric icon={<ClipboardSignature className="h-4 w-4" />} label="Pending Agreements" value={pendingAgreements} />
        <Metric icon={<Flag className="h-4 w-4" />} label="Countries Covered" value={countriesCovered} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Referral Pipeline Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipelineStages.map((stage) => {
              const count = partners.filter((partner) => partner.referralStatus === stage).length;
              const width = Math.max((count / partners.length) * 100, count > 0 ? 8 : 0);

              return (
                <button
                  key={stage}
                  className="grid w-full gap-2 rounded-md p-2 text-left hover:bg-muted sm:grid-cols-[170px_1fr_36px] sm:items-center"
                  type="button"
                  onClick={() => navigate("/referrals/pipeline")}
                >
                  <div className="text-sm font-medium">{stage}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${width}%` }} />
                  </div>
                  <div className="text-sm font-semibold text-emerald-900">{count}</div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {partners
              .slice()
              .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp))
              .slice(0, 4)
              .map((partner) => (
                <button
                  key={partner.id}
                  className="w-full rounded-md border bg-white p-3 text-left hover:bg-muted"
                  type="button"
                  onClick={() => navigate(`/referrals/partners/${partner.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-emerald-950">{partner.organizationName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {partner.country} | {partner.partnerType}
                      </p>
                    </div>
                    <ReferralStatusBadge status={partner.referralStatus} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Next: {partner.nextFollowUp}</p>
                </button>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <Card className="border-emerald-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">{icon}</span>
          <span className="text-xl font-semibold text-emerald-950">{value}</span>
        </div>
        <p className="mt-4 min-h-10 text-sm font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
