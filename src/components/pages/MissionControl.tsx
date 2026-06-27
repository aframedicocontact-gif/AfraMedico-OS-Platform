import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  FileSearch,
  Hospital,
  Plane,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { CaseProfileRecord } from "../../types/caseProfile";
import type { Lead } from "../../types/lead";
import type { ProtectedReferralCase } from "../../types/referralProtection";
import type { ReferralPartner } from "../../types/referralPartner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type MissionControlProps = {
  leads: Lead[];
  partners: ReferralPartner[];
  protectionCases: ProtectedReferralCase[];
  caseProfiles: CaseProfileRecord[];
  onNavigate: (view: AppView) => void;
};

const countryMarkets = ["Nigeria", "Ghana", "Kenya", "Uganda", "South Africa", "Egypt", "Other"];

const hospitalPerformance = [
  { hospital: "Acibadem", responseTime: "1.8 days", acceptanceRate: "42%", averageCost: 28800, openCases: 6, tone: "success" },
  { hospital: "Medipol", responseTime: "3.6 days", acceptanceRate: "31%", averageCost: 24100, openCases: 5, tone: "warning" },
  { hospital: "Memorial", responseTime: "4.2 days", acceptanceRate: "28%", averageCost: 26300, openCases: 4, tone: "warning" },
  { hospital: "Bumrungrad", responseTime: "2.1 days", acceptanceRate: "37%", averageCost: 21400, openCases: 3, tone: "success" },
  { hospital: "Andalos", responseTime: "5.0 days", acceptanceRate: "19%", averageCost: 17200, openCases: 2, tone: "danger" },
] as const;

const treatmentRows = [
  { treatment: "Brain Surgery", leads: 7, patients: 3, revenue: 126000, conversion: "43%" },
  { treatment: "Cardiac Surgery", leads: 11, patients: 5, revenue: 188000, conversion: "45%" },
  { treatment: "Cancer Care", leads: 15, patients: 6, revenue: 226000, conversion: "40%" },
  { treatment: "Orthopedics", leads: 10, patients: 4, revenue: 91000, conversion: "40%" },
  { treatment: "IVF", leads: 8, patients: 2, revenue: 39000, conversion: "25%" },
  { treatment: "Dental", leads: 12, patients: 3, revenue: 27000, conversion: "25%" },
  { treatment: "Neurology", leads: 6, patients: 2, revenue: 83000, conversion: "33%" },
];

const trafficSources = [
  { source: "SEO", leads: 28, quality: "High", trend: "+18%" },
  { source: "AI Search", leads: 9, quality: "Rising", trend: "+31%" },
  { source: "Google Ads", leads: 18, quality: "Mixed", trend: "+6%" },
  { source: "Facebook", leads: 11, quality: "Medium", trend: "-4%" },
  { source: "Instagram", leads: 14, quality: "Elective", trend: "+9%" },
  { source: "YouTube", leads: 7, quality: "Research", trend: "+12%" },
  { source: "Referral Partners", leads: 24, quality: "High", trend: "+15%" },
  { source: "Doctors", leads: 13, quality: "High", trend: "+10%" },
  { source: "Hospitals", leads: 5, quality: "Warm", trend: "+3%" },
  { source: "Conferences", leads: 4, quality: "Strategic", trend: "New" },
];

const futurePlaceholders = [
  "Predictive Analytics",
  "AI Forecast",
  "Revenue Forecast",
  "Country Heatmap",
  "Partner Ranking",
  "Hospital Ranking",
  "Risk Prediction",
];

export function MissionControl({
  leads,
  partners,
  protectionCases,
  caseProfiles,
  onNavigate,
}: MissionControlProps) {
  const metrics = getMetrics(leads, partners, protectionCases, caseProfiles);
  const countryRows = buildCountryRows(leads);
  const partnerRows = partners
    .slice()
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    .slice(0, 5);
  const alerts = buildAlerts(leads, protectionCases, caseProfiles);
  const priorities = buildPriorities(leads, partners, protectionCases);
  const activityFeed = buildActivityFeed(leads, protectionCases, caseProfiles);

  return (
    <div className="space-y-6">
      <Hero />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <BusinessHealth metrics={metrics} />
        <AiCommandCenter />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<UserPlus className="h-5 w-5" />} label="New Leads" value={metrics.newLeads} detail="Fresh intake requiring qualification" />
        <KpiCard icon={<FileSearch className="h-5 w-5" />} label="Clinical Reviews Pending" value={metrics.medicalReviewsPending} detail="Clinical decision queue" />
        <KpiCard icon={<Hospital className="h-5 w-5" />} label="Hospital Quotes Pending" value={metrics.hospitalQuotesPending} detail="Waiting on hospital pricing" />
        <KpiCard icon={<Plane className="h-5 w-5" />} label="Patients Traveling" value={metrics.patientsTraveling} detail="Travel windows approaching" />
        <KpiCard icon={<Stethoscope className="h-5 w-5" />} label="Treatments Scheduled" value={metrics.treatmentsScheduled} detail="Confirmed or treatment-ready cases" />
        <KpiCard icon={<CircleDollarSign className="h-5 w-5" />} label="Expected Monthly Revenue" value={formatCurrency(metrics.expectedMonthlyRevenue)} detail="Open lead and case value" />
        <KpiCard icon={<ShieldCheck className="h-5 w-5" />} label="Protected Commission" value={formatCurrency(metrics.protectedCommission)} detail="Commission value with evidence" />
        <KpiCard icon={<ClipboardCheck className="h-5 w-5" />} label="Outstanding Tasks" value={metrics.outstandingTasks} detail="Operational work due" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GrowthDashboard rows={countryRows} />
        <ReferralPartnerDashboard partners={partnerRows} inactive={metrics.inactivePartners} followUps={metrics.partnerFollowUps} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HospitalPerformance />
        <TreatmentDashboard />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <OperationalAlerts alerts={alerts} />
        <TodaysPriorities priorities={priorities} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RevenueProtection metrics={metrics} />
        <MarketingIntelligence />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <LiveActivityFeed events={activityFeed} />
        <div className="space-y-4">
          <QuickActions onNavigate={onNavigate} />
          <FuturePlaceholders />
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <section className="overflow-hidden rounded-lg border border-emerald-950/20 bg-emerald-950 text-white shadow-sm">
      <div className="relative p-6 sm:p-8">
        <div className="absolute right-8 top-8 h-28 w-28 rounded-full border border-yellow-300/20" />
        <div className="absolute bottom-6 right-24 h-16 w-48 rounded-full border border-emerald-300/15" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="gold">Executive Control Center</Badge>
            <h2 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
              Mission Control
            </h2>
            <p className="mt-3 max-w-3xl text-base text-emerald-100">
              AfraMedico Business Growth OS
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-4 text-sm">
            <p className="text-emerald-100">Today</p>
            <p className="mt-1 text-lg font-semibold">{today}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessHealth({ metrics }: { metrics: ReturnType<typeof getMetrics> }) {
  const status =
    metrics.criticalAlerts > 0
      ? { label: "Critical", tone: "danger" as const, dot: "bg-rose-500", text: "Commission conflicts and urgent patient operations need executive review today." }
      : metrics.hospitalQuotesPending + metrics.medicalReviewsPending > 3
        ? { label: "Attention Required", tone: "warning" as const, dot: "bg-yellow-400", text: "Growth is healthy, but quote delays and medical review queue need pressure." }
        : { label: "Healthy", tone: "success" as const, dot: "bg-emerald-500", text: "Core commercial and patient workflows are operating within expected range." };

  return (
    <Card className="border-emerald-900 bg-gradient-to-br from-emerald-950 to-emerald-900 text-white">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-emerald-200">Business Health</p>
            <div className="mt-4 flex items-center gap-3">
              <span className={`h-4 w-4 rounded-full ${status.dot}`} />
              <h3 className="text-3xl font-semibold">{status.label}</h3>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100">{status.text}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <HealthMini label="Revenue at Risk" value={formatCurrency(metrics.revenueAtRisk)} />
            <HealthMini label="Pending Decisions" value={metrics.pendingDecisions} />
            <HealthMini label="Protected Cases" value={metrics.protectedCases} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: ReactNode; detail: string }) {
  return (
    <Card className="border-emerald-100 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">{icon}</span>
          <span className="text-right text-2xl font-semibold text-emerald-950">{value}</span>
        </div>
        <p className="mt-4 text-sm font-semibold text-emerald-950">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function GrowthDashboard({ rows }: { rows: Array<{ country: string; leads: number; conversion: string; revenue: number; trend: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <DataRow key={row.country} title={row.country}>
            <MetricText label="Leads" value={row.leads} />
            <MetricText label="Conversion" value={row.conversion} />
            <MetricText label="Revenue" value={formatCurrency(row.revenue)} />
            <Badge tone={row.trend.startsWith("+") ? "success" : row.trend === "New" ? "gold" : "muted"}>{row.trend}</Badge>
          </DataRow>
        ))}
      </CardContent>
    </Card>
  );
}

function ReferralPartnerDashboard({
  partners,
  inactive,
  followUps,
}: {
  partners: ReferralPartner[];
  inactive: number;
  followUps: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Partner Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {partners.map((partner) => (
          <DataRow key={partner.id} title={partner.organizationName}>
            <MetricText label="Patients" value={partner.patientsReferred} />
            <MetricText label="Revenue" value={formatCurrency(partner.estimatedRevenue)} />
            <MetricText label="Conversion" value={partner.patientsReferred ? `${Math.min(68, 28 + partner.newReferrals * 7)}%` : "0%"} />
            <Badge tone={partner.newReferrals > 0 ? "success" : "warning"}>{partner.newReferrals > 0 ? "Growing" : "Needs Follow-up"}</Badge>
          </DataRow>
        ))}
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <HealthMini light label="Inactive Partners" value={inactive} />
          <HealthMini light label="Need Follow-up" value={followUps} />
        </div>
      </CardContent>
    </Card>
  );
}

function HospitalPerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hospitalPerformance.map((row) => (
          <DataRow key={row.hospital} title={row.hospital}>
            <MetricText label="Quote Response" value={row.responseTime} />
            <MetricText label="Acceptance" value={row.acceptanceRate} />
            <MetricText label="Avg. Cost" value={formatCurrency(row.averageCost)} />
            <Badge tone={row.tone}>{row.openCases} Open Cases</Badge>
          </DataRow>
        ))}
      </CardContent>
    </Card>
  );
}

function TreatmentDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {treatmentRows.map((row) => (
          <DataRow key={row.treatment} title={row.treatment}>
            <MetricText label="Leads" value={row.leads} />
            <MetricText label="Patients" value={row.patients} />
            <MetricText label="Revenue" value={formatCurrency(row.revenue)} />
            <MetricText label="Conversion" value={row.conversion} />
          </DataRow>
        ))}
      </CardContent>
    </Card>
  );
}

function OperationalAlerts({ alerts }: { alerts: Array<{ label: string; value: number; detail: string; tone: "danger" | "warning" | "gold" | "info" }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Alerts</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {alerts.map((alert) => (
          <div key={alert.label} className="rounded-md border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-emerald-950">{alert.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
              </div>
              <Badge tone={alert.tone}>{alert.value}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TodaysPriorities({ priorities }: { priorities: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Priorities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {priorities.slice(0, 10).map((priority, index) => (
          <div key={priority} className="flex items-start gap-3 rounded-md border bg-white p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <p className="text-sm font-medium text-emerald-950">{priority}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RevenueProtection({ metrics }: { metrics: ReturnType<typeof getMetrics> }) {
  return (
    <Card className="border-yellow-200">
      <CardHeader>
        <CardTitle>Revenue Protection</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <ProtectionTile label="Commission Protected" value={formatCurrency(metrics.protectedCommission)} />
        <ProtectionTile label="Commission Pending" value={formatCurrency(metrics.pendingCommission)} />
        <ProtectionTile label="Disputed Commission" value={formatCurrency(metrics.disputedCommission)} />
        <ProtectionTile label="Partner Reviews Pending" value={metrics.partnerReviewsPending} />
      </CardContent>
    </Card>
  );
}

function MarketingIntelligence() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketing Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {trafficSources.map((source) => (
          <div key={source.source} className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
            <div>
              <p className="text-sm font-medium text-emerald-950">{source.source}</p>
              <p className="text-xs text-muted-foreground">{source.quality} quality</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{source.leads}</p>
              <p className="text-xs text-emerald-700">{source.trend}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AiCommandCenter() {
  const recommendations = [
    "Nigeria conversion increased by 15%. Increase SEO investment and referral partner activation.",
    "Medipol response time is slower than Acibadem. Escalate pending cardiac and oncology quotes today.",
    "Assign more oncology cases to Acibadem while Memorial quote speed is under review.",
    "Three patients are waiting for pathology reports. Follow up today before review queue stalls.",
    "Five referral partners have not submitted patients in 90 days. Schedule reactivation meetings.",
  ];

  return (
    <Card className="border-yellow-200 bg-gradient-to-br from-white to-yellow-50">
      <CardHeader>
        <CardTitle>AI Command Center</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((item) => (
          <div key={item} className="flex gap-3 rounded-md border border-yellow-200 bg-white p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
            <p className="text-sm leading-6 text-emerald-950">{item}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LiveActivityFeed({ events }: { events: Array<{ type: string; title: string; detail: string; date: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Activity Feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div key={`${event.type}-${event.date}-${event.title}`} className="relative pl-7">
            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
            <div className="rounded-md border bg-white p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium text-emerald-950">{event.title}</p>
                <Badge tone="muted">{event.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
              <p className="mt-2 text-xs text-muted-foreground">{event.date}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QuickActions({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => onNavigate({ name: "add-lead" })}>
          <Plus className="h-4 w-4" />
          Create Lead
        </Button>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: "CASE-1001-CARDIAC" })}>
          <BriefcaseBusiness className="h-4 w-4" />
          Open Case Workspace
        </Button>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "add-referral-partner" })}>
          <Users className="h-4 w-4" />
          Add Referral Partner
        </Button>
        <Button variant="secondary" type="button">
          <FileSearch className="h-4 w-4" />
          Request Clinical Review
        </Button>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hospital-referrals" })}>
          <Hospital className="h-4 w-4" />
          Early Hospital Registration
        </Button>
        <Button variant="secondary" type="button">
          <ClipboardCheck className="h-4 w-4" />
          Create Task
        </Button>
      </CardContent>
    </Card>
  );
}

function FuturePlaceholders() {
  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <CardTitle>Future Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {futurePlaceholders.map((item) => (
          <button
            key={item}
            className="cursor-not-allowed rounded-md border bg-slate-50 px-3 py-2 text-sm text-muted-foreground"
            disabled
            type="button"
          >
            {item} <span className="ml-2 text-[10px] uppercase tracking-wide">Future</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function DataRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 rounded-md border bg-white p-3 md:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] md:items-center">
      <p className="font-medium text-emerald-950">{title}</p>
      {children}
    </div>
  );
}

function MetricText({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function HealthMini({ label, value, light }: { label: string; value: ReactNode; light?: boolean }) {
  return (
    <div className={light ? "rounded-md border bg-white p-3" : "rounded-md border border-white/10 bg-white/10 p-3"}>
      <p className={light ? "text-xs font-medium uppercase text-muted-foreground" : "text-xs font-medium uppercase text-emerald-100"}>{label}</p>
      <p className={light ? "mt-1 text-xl font-semibold text-emerald-950" : "mt-1 text-xl font-semibold text-white"}>{value}</p>
    </div>
  );
}

function ProtectionTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function getMetrics(
  leads: Lead[],
  partners: ReferralPartner[],
  protectionCases: ProtectedReferralCase[],
  caseProfiles: CaseProfileRecord[],
) {
  const newLeads = leads.filter((lead) => ["New", "Contacted"].includes(lead.currentStatus)).length;
  const medicalReviewsPending = leads.filter((lead) =>
    ["Not Started", "Pending Documents", "In Review"].includes(lead.medicalReviewStatus),
  ).length;
  const hospitalQuotesPending = leads.filter((lead) =>
    ["Requested", "Not Requested"].includes(lead.hospitalQuoteStatus),
  ).length;
  const patientsTraveling = leads.filter((lead) => lead.expectedTravelDate <= "2026-08-01" && lead.caseStatus === "Active").length;
  const treatmentsScheduled = leads.filter((lead) => lead.currentStatus === "Accepted" || lead.pipelineStage === "Confirmed").length;
  const expectedMonthlyRevenue = leads
    .filter((lead) => lead.currentStatus !== "Lost")
    .reduce((total, lead) => total + lead.estimatedTreatmentCost, 0);
  const protectedCommission = protectionCases.reduce((total, item) => {
    const caseValue = item.hospitalReferrals.reduce((sum, referral) => sum + referral.treatmentCost, 0);
    return total + caseValue * 0.12;
  }, 0);
  const pendingCommission = leads
    .filter((lead) => lead.ownershipStatus === "Pending Review")
    .reduce((total, lead) => total + lead.estimatedTreatmentCost * 0.12, 0);
  const disputedCommission = protectionCases
    .filter((item) => item.conflict)
    .reduce((total, item) => total + item.hospitalReferrals.reduce((sum, referral) => sum + referral.treatmentCost, 0) * 0.12, 0);
  const outstandingTasks = caseProfiles.reduce((total, item) => total + item.tasks.filter((task) => task.status !== "Done").length, 0);
  const partnerReviewsPending = protectionCases.reduce(
    (total, item) => total + item.duplicateReviews.filter((review) => review.status === "Pending").length,
    0,
  );

  return {
    newLeads,
    medicalReviewsPending,
    hospitalQuotesPending,
    patientsTraveling,
    treatmentsScheduled,
    expectedMonthlyRevenue,
    protectedCommission,
    pendingCommission,
    disputedCommission,
    outstandingTasks,
    inactivePartners: partners.filter((partner) => partner.referralStatus === "Inactive").length,
    partnerFollowUps: partners.filter((partner) => partner.nextFollowUp <= "2026-06-30").length,
    partnerReviewsPending,
    pendingDecisions: partnerReviewsPending + leads.filter((lead) => lead.possibleDuplicate).length,
    protectedCases: protectionCases.length,
    criticalAlerts: protectionCases.filter((item) => item.conflict).length,
    revenueAtRisk: leads.filter((lead) => lead.currentStatus === "Lost").reduce((total, lead) => total + lead.estimatedTreatmentCost, 0),
  };
}

function buildCountryRows(leads: Lead[]) {
  return countryMarkets.map((country, index) => {
    const countryLeads = country === "Other"
      ? leads.filter((lead) => !countryMarkets.includes(lead.country))
      : leads.filter((lead) => lead.country === country);
    const accepted = countryLeads.filter((lead) => lead.currentStatus === "Accepted").length;
    const revenue = countryLeads.reduce((total, lead) => total + lead.estimatedTreatmentCost, 0);
    const conversion = countryLeads.length ? `${Math.round((accepted / countryLeads.length) * 100)}%` : "0%";
    const trend = countryLeads.length ? ["+15%", "+8%", "+11%", "+4%", "New", "+6%", "-2%"][index] : "New";

    return {
      country,
      leads: countryLeads.length,
      conversion,
      revenue,
      trend,
    };
  });
}

function buildAlerts(
  leads: Lead[],
  protectionCases: ProtectedReferralCase[],
  caseProfiles: CaseProfileRecord[],
) {
  return [
    {
      label: "Urgent Clinical Reviews",
      value: leads.filter((lead) => lead.urgency === "Urgent" && lead.medicalReviewStatus !== "Completed").length,
      detail: "High urgency patients waiting for clinical movement.",
      tone: "danger" as const,
    },
    {
      label: "Duplicate Reviews",
      value: protectionCases.reduce((total, item) => total + item.duplicateReviews.filter((review) => review.status === "Pending").length, 0),
      detail: "Ownership decisions requiring manager review.",
      tone: "warning" as const,
    },
    {
      label: "Referral Protection Issues",
      value: protectionCases.filter((item) => item.conflict).length,
      detail: "Commission-sensitive cases with active conflict.",
      tone: "danger" as const,
    },
    {
      label: "Missing Documents",
      value: leads.filter((lead) => !lead.documentsReceived).length,
      detail: "Cases blocked before medical review or quotation.",
      tone: "warning" as const,
    },
    {
      label: "Expiring Hospital Quotes",
      value: caseProfiles.flatMap((item) => item.hospitalQuotes).filter((quote) => quote.validityDate && quote.validityDate <= "2026-07-09").length,
      detail: "Quotes with near-term validity deadlines.",
      tone: "gold" as const,
    },
    {
      label: "Visa Deadlines",
      value: leads.filter((lead) => lead.expectedTravelDate <= "2026-07-31" && lead.currentStatus !== "Lost").length,
      detail: "Patients approaching travel windows.",
      tone: "info" as const,
    },
    {
      label: "Upcoming Flights",
      value: 3,
      detail: "Placeholder for travel module integration.",
      tone: "info" as const,
    },
  ];
}

function buildPriorities(leads: Lead[], partners: ReferralPartner[], protectionCases: ProtectedReferralCase[]) {
  const urgentLead = leads.find((lead) => lead.urgency === "Urgent" && lead.currentStatus !== "Lost");
  const pendingDuplicate = protectionCases.find((item) => item.duplicateReviews.some((review) => review.status === "Pending"));
  const pendingQuote = leads.find((lead) => lead.hospitalQuoteStatus === "Requested");
  const missingDocuments = leads.find((lead) => !lead.documentsReceived);
  const inactivePartner = partners.find((partner) => partner.referralStatus === "Inactive");

  return [
    urgentLead ? `Call patient ${urgentLead.patientName} about ${urgentLead.interestedTreatment}.` : "Review urgent patient queue.",
    pendingDuplicate ? `Approve referral ownership for ${pendingDuplicate.patientName}.` : "Review referral ownership queue.",
    pendingQuote ? `Follow up hospital quote for ${pendingQuote.patientName}.` : "Check hospital quote queue.",
    missingDocuments ? `Request missing documents for ${missingDocuments.patientName}.` : "Review missing document queue.",
    "Escalate Medipol pending cardiac quote.",
    inactivePartner ? `Schedule partner meeting with ${inactivePartner.organizationName}.` : "Schedule partner reactivation meeting.",
    "Review disputed commission exposure before end of day.",
    "Confirm visa checklist for patients traveling in July.",
    "Push oncology medical reviews to completion.",
    "Export executive revenue protection summary.",
  ];
}

function buildActivityFeed(
  leads: Lead[],
  protectionCases: ProtectedReferralCase[],
  caseProfiles: CaseProfileRecord[],
) {
  const leadEvents = leads.slice(0, 3).map((lead) => ({
    type: "New Lead",
    title: lead.patientName,
    detail: `${lead.country} | ${lead.interestedTreatment} | ${lead.currentStatus}`,
    date: lead.createdDate,
  }));
  const protectionEvents = protectionCases.flatMap((item) =>
    item.auditTrail.slice(-2).map((event) => ({
      type: event.action,
      title: item.patientName,
      detail: event.notes,
      date: `${event.date} ${event.time}`,
    })),
  );
  const caseEvents = caseProfiles.flatMap((item) =>
    item.caseTimeline.slice(-1).map((event) => ({
      type: event.action ?? event.title,
      title: item.patientName,
      detail: event.detail,
      date: `${event.date} ${event.time ?? ""}`,
    })),
  );

  return [...leadEvents, ...protectionEvents, ...caseEvents].slice(0, 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
