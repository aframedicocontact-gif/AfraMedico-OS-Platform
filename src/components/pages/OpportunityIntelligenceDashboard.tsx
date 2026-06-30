import { BarChart3, Globe2, Layers3, LineChart, Stethoscope, Target } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { buildOpportunityDashboardData, type OpportunityChartDatum } from "../../services/opportunityDashboardService";
import type { Organization } from "../../types/organization";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type OpportunityIntelligenceDashboardProps = {
  organizations: Organization[];
};

export function OpportunityIntelligenceDashboard({ organizations }: OpportunityIntelligenceDashboardProps) {
  const dashboard = useMemo(() => buildOpportunityDashboardData(organizations), [organizations]);
  const maxMetric = Math.max(...dashboard.metrics.map((metric) => metric.value), 1);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Opportunity Intelligence</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Opportunity Intelligence Dashboard</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Charts generated from current Authority CRM records and saved outreach activity only. No simulated outreach data is added.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-4xl font-semibold text-emerald-950">{metric.value}</p>
                </div>
                <Badge tone={metric.value > 0 ? "success" : "muted"}>{metric.value > 0 ? "Active" : "No data"}</Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(metric.value / maxMetric) * 100}%` }} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Top Countries" icon={<Globe2 className="h-4 w-4 text-emerald-700" />} data={dashboard.topCountries} />
        <ChartCard title="Top Treatments" icon={<Stethoscope className="h-4 w-4 text-emerald-700" />} data={dashboard.topTreatments} />
        <ChartCard title="Top Categories" icon={<Layers3 className="h-4 w-4 text-emerald-700" />} data={dashboard.topCategories} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="CRM Pipeline Distribution" icon={<BarChart3 className="h-4 w-4 text-emerald-700" />} data={dashboard.pipeline} />
        <ChartCard title="Opportunity Mix" icon={<Target className="h-4 w-4 text-emerald-700" />} data={dashboard.opportunityMix} />
      </div>
    </div>
  );
}

function ChartCard({ title, icon, data }: { title: string; icon: ReactNode; data: OpportunityChartDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed bg-slate-50 p-6 text-center">
            <div>
              <LineChart className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-emerald-950">No chart data yet</p>
              <p className="mt-1 text-xs text-muted-foreground">This chart will populate when real CRM records contain this field.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                  <span className="truncate font-medium text-emerald-950">{formatLabel(item.label)}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-amber-400"
                    style={{ width: `${(item.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
