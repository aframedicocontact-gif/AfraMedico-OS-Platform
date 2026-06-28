import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { PlatformOrganization } from "../../types/organization";

type OrganizationCardProps = {
  organization: PlatformOrganization;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusTone(status: PlatformOrganization["status"]) {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  if (status === "archived") return "muted";
  return "warning";
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Tenant Organization
            </p>
            <CardTitle className="mt-1 text-xl">{organization.name}</CardTitle>
          </div>
          <Badge tone={statusTone(organization.status)}>{organization.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Country" value={organization.country ?? "Not set"} />
          <Detail label="Plan" value={organization.plan} />
          <Detail label="Timezone" value={organization.timezone} />
          <Detail label="Currency" value={organization.currency} />
          <Detail label="Created" value={formatDate(organization.created_at)} />
          <Detail label="Slug" value={organization.slug} />
        </dl>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
