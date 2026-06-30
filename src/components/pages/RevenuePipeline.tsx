import { CircleDollarSign, Clock3, LineChart, ShieldAlert, Target, UsersRound } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { buildRevenuePipeline, type RevenuePipelineItem } from "../../services/revenuePipelineService";
import type { Organization } from "../../types/organization";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableScrollContainer } from "../ui/table";

type RevenuePipelineProps = {
  organizations: Organization[];
};

type RevenueChartDatum = {
  label: string;
  value: number;
};

export function RevenuePipeline({ organizations }: RevenuePipelineProps) {
  const pipeline = useMemo(() => buildRevenuePipeline(organizations), [organizations]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Authority CRM</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Revenue Pipeline</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Management view of estimated revenue, referrals, patients, SEO value, partnership value, timeline, risk, and priority by organization.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TotalCard icon={<CircleDollarSign className="h-4 w-4" />} label="Potential Revenue" value={formatCurrency(pipeline.totals.potentialRevenue)} />
        <TotalCard icon={<Target className="h-4 w-4" />} label="Estimated Referrals" value={pipeline.totals.estimatedReferrals.toString()} />
        <TotalCard icon={<UsersRound className="h-4 w-4" />} label="Estimated Patients" value={pipeline.totals.estimatedPatients.toString()} />
        <TotalCard icon={<LineChart className="h-4 w-4" />} label="Estimated SEO Value" value={formatCurrency(pipeline.totals.estimatedSeoValue)} />
        <TotalCard icon={<CircleDollarSign className="h-4 w-4" />} label="Partnership Value" value={formatCurrency(pipeline.totals.estimatedPartnershipValue)} />
        <TotalCard icon={<Target className="h-4 w-4" />} label="High Priority" value={pipeline.totals.highPriorityCount.toString()} />
        <TotalCard icon={<ShieldAlert className="h-4 w-4" />} label="High Risk" value={pipeline.totals.highRiskCount.toString()} />
        <TotalCard icon={<Clock3 className="h-4 w-4" />} label="Organizations" value={pipeline.items.length.toString()} />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <ChartCard title="Revenue by Country" data={pipeline.byCountry} />
        <ChartCard title="Revenue by Category" data={pipeline.byCategory} />
        <ChartCard title="Revenue by Timeline" data={pipeline.byTimeline} />
        <ChartCard title="Revenue by Risk" data={pipeline.byRisk} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Revenue Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <TableScrollContainer>
            <Table className="min-w-[1500px]">
              <TableHeader>
                <TableRow className="bg-emerald-50/70">
                  <TableHead className="min-w-[260px]">Organization</TableHead>
                  <TableHead className="min-w-[140px]">Country</TableHead>
                  <TableHead className="min-w-[190px]">Category</TableHead>
                  <TableHead className="min-w-[160px]">Potential Revenue</TableHead>
                  <TableHead className="min-w-[150px]">Estimated Referrals</TableHead>
                  <TableHead className="min-w-[140px]">Estimated Patients</TableHead>
                  <TableHead className="min-w-[150px]">Estimated SEO Value</TableHead>
                  <TableHead className="min-w-[190px]">Partnership Value</TableHead>
                  <TableHead className="min-w-[150px]">Expected Timeline</TableHead>
                  <TableHead className="min-w-[110px]">Risk</TableHead>
                  <TableHead className="min-w-[110px]">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipeline.items.map((item) => (
                  <RevenuePipelineRow key={item.organizationId} item={item} />
                ))}
              </TableBody>
            </Table>
          </TableScrollContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function RevenuePipelineRow({ item }: { item: RevenuePipelineItem }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-emerald-950">{item.organizationName}</TableCell>
      <TableCell>{item.country}</TableCell>
      <TableCell>{item.category}</TableCell>
      <TableCell>{formatCurrency(item.potentialRevenue)}</TableCell>
      <TableCell>{item.estimatedReferrals}</TableCell>
      <TableCell>{item.estimatedPatients}</TableCell>
      <TableCell>{formatCurrency(item.estimatedSeoValue)}</TableCell>
      <TableCell>{formatCurrency(item.estimatedPartnershipValue)}</TableCell>
      <TableCell>{item.expectedTimeline}</TableCell>
      <TableCell><RiskBadge risk={item.risk} /></TableCell>
      <TableCell><PriorityBadge priority={item.priority} /></TableCell>
    </TableRow>
  );
}

function TotalCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, data }: { title: string; data: RevenueChartDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-slate-50 p-6 text-center text-sm text-muted-foreground">No revenue data yet</div>
        ) : (
          data.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-emerald-950">{item.label}</span>
                <span className="text-muted-foreground">{formatCurrency(item.value)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-amber-400" style={{ width: `${(item.value / max) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RiskBadge({ risk }: { risk: RevenuePipelineItem["risk"] }) {
  return <Badge tone={risk === "High" ? "danger" : risk === "Medium" ? "warning" : "success"}>{risk}</Badge>;
}

function PriorityBadge({ priority }: { priority: RevenuePipelineItem["priority"] }) {
  return <Badge tone={priority === "high" ? "danger" : priority === "medium" ? "gold" : "muted"}>{priority}</Badge>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
