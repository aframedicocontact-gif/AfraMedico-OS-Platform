import {
  Building2,
  FileDown,
  FileSpreadsheet,
  Handshake,
  Hospital,
  Landmark,
  Link2,
  MailPlus,
  Megaphone,
  Plus,
  Stethoscope,
  Target,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { Organization, OrganizationPriority } from "../../types/organization";

type DashboardProps = {
  organizations: Organization[];
  onNavigate: (view: AppView) => void;
};

const countryRows = ["Nigeria", "Ghana", "Kenya", "Uganda", "Tanzania", "South Africa"];
const highlightedCountries = ["Nigeria", "Ghana", "Kenya", "Uganda", "Tanzania"];

export function Dashboard({ organizations, onNavigate }: DashboardProps) {
  const universities = countByCategory(organizations, "Universities");
  const hospitals = countByCategory(organizations, "Teaching Hospitals");
  const associations = countByCategory(organizations, "Medical Associations");
  const ngos = countByCategory(organizations, "NGOs");
  const mediaTargets =
    countByCategory(organizations, "News Media") + countByCategory(organizations, "Health Blogs");
  const activeOutreach = organizations.filter((organization) =>
    ["contacted", "in-discussion"].includes(organization.status),
  ).length;
  const backlinksSecured = organizations.filter(
    (organization) => organization.status === "backlink-secured",
  ).length;
  const partnerships = organizations.filter((organization) => organization.status === "partner").length;

  return (
    <div className="space-y-6">
      <PageHeader onAdd={() => onNavigate({ name: "add-organization" })} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
        <Metric icon={<Target className="h-4 w-4" />} label="Total Organizations" value={organizations.length} />
        <Metric icon={<Landmark className="h-4 w-4" />} label="Universities" value={universities} />
        <Metric icon={<Hospital className="h-4 w-4" />} label="Hospitals" value={hospitals} />
        <Metric icon={<Stethoscope className="h-4 w-4" />} label="Medical Associations" value={associations} />
        <Metric icon={<Users className="h-4 w-4" />} label="NGOs" value={ngos} />
        <Metric icon={<Megaphone className="h-4 w-4" />} label="Media Targets" value={mediaTargets} />
        <Metric icon={<MailPlus className="h-4 w-4" />} label="Active Outreach" value={activeOutreach} />
        <Metric icon={<Link2 className="h-4 w-4" />} label="Backlinks Secured" value={backlinksSecured} />
        <Metric icon={<Handshake className="h-4 w-4" />} label="Partnerships" value={partnerships} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <CountryProgress organizations={organizations} />
        <AfricaCoverage organizations={organizations} />
      </div>

      <QuickActions onNavigate={onNavigate} />
    </div>
  );
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Authority CRM</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Authority Intelligence Dashboard
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Track AfraMedico's authority targets, outreach progress, backlink opportunities, and country-level growth across Africa.
        </p>
      </div>
      <Button type="button" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add Organization
      </Button>
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
  value: number;
}) {
  return (
    <Card className="border-emerald-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">{icon}</span>
          <span className="text-2xl font-semibold text-emerald-950">{value}</span>
        </div>
        <p className="mt-4 min-h-10 text-sm font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function CountryProgress({ organizations }: { organizations: Organization[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Country Progress</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {countryRows.map((country) => {
          const countryTargets = organizations.filter((organization) => organization.country === country);
          const contacted = countryTargets.filter((organization) =>
            ["contacted", "in-discussion", "partner", "backlink-secured"].includes(organization.status),
          ).length;
          const progress = countryTargets.length
            ? Math.round((contacted / countryTargets.length) * 100)
            : 0;
          const priority = getCountryPriority(countryTargets);

          return (
            <div key={country} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-emerald-950">{country}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {countryTargets.length} targets | {contacted} contacted
                  </p>
                </div>
                <PriorityBadge priority={priority} />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-50">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-semibold text-emerald-900">
                  {progress}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AfricaCoverage({ organizations }: { organizations: Organization[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Africa Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-72 rounded-lg border bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-5 text-white">
          <div className="absolute right-6 top-6 h-44 w-36 rounded-[48%_42%_50%_44%] border border-emerald-300/40 bg-emerald-500/20" />
          <div className="absolute right-20 top-20 h-16 w-20 rounded-[45%] border border-yellow-300/70 bg-yellow-300/20" />
          <div className="absolute bottom-8 right-16 h-28 w-20 rounded-[50%_40%_55%_45%] border border-emerald-200/30 bg-emerald-300/10" />

          <div className="relative z-10 max-w-xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-200">
              Coverage map placeholder
            </p>
            <h3 className="mt-2 text-xl font-semibold">Priority markets highlighted</h3>
            <p className="mt-2 text-sm text-emerald-100">
              A lightweight visual for sprint review. No external map library is used.
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-2">
            {highlightedCountries.map((country) => (
              <div key={country} className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm backdrop-blur">
                <span>{country}</span>
                <Badge tone="gold">
                  {organizations.filter((organization) => organization.country === country).length} targets
                </Badge>
              </div>
            ))}
          </div>
        </div>
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
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Button type="button" onClick={() => onNavigate({ name: "add-organization" })}>
          <Plus className="h-4 w-4" />
          Add Organization
        </Button>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "csv-import" })}>
          <FileSpreadsheet className="h-4 w-4" />
          Import CSV
        </Button>
        <Button variant="secondary" type="button">
          <MailPlus className="h-4 w-4" />
          Add Contact
        </Button>
        <Button variant="secondary" type="button">
          <Building2 className="h-4 w-4" />
          Create Task
        </Button>
        <Button variant="secondary" type="button">
          <FileDown className="h-4 w-4" />
          Export Report
        </Button>
      </CardContent>
    </Card>
  );
}

function countByCategory(organizations: Organization[], category: Organization["category"]) {
  return organizations.filter((organization) => organization.category === category).length;
}

function getCountryPriority(organizations: Organization[]): OrganizationPriority {
  if (organizations.some((organization) => organization.priority === "high")) {
    return "high";
  }

  if (organizations.some((organization) => organization.priority === "medium")) {
    return "medium";
  }

  return "low";
}

function PriorityBadge({ priority }: { priority: OrganizationPriority }) {
  const tone = priority === "high" ? "danger" : priority === "medium" ? "warning" : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}
