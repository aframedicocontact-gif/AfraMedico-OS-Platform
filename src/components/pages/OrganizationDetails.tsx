import { ArrowLeft, BrainCircuit, CalendarClock, ExternalLink, Handshake, Linkedin, Mail, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getOpportunityProfile } from "../../services/opportunityService";
import type {
  Organization,
  OrganizationPriority,
  OrganizationStatus,
} from "../../types/organization";

type OrganizationDetailsProps = {
  organization: Organization;
  onNavigate: (view: AppView) => void;
};

const statusLabels: Record<OrganizationStatus, string> = {
  research: "Research",
  contacted: "Contacted",
  "in-discussion": "In Discussion",
  partner: "Partner",
  "backlink-secured": "Backlink Secured",
  rejected: "Rejected",
};

export function OrganizationDetails({ organization, onNavigate }: OrganizationDetailsProps) {
  const opportunityProfile = getOpportunityProfile(organization);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            className="-ml-3 mb-2"
            type="button"
            onClick={() => onNavigate({ name: "organizations" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p className="text-sm font-medium text-primary">Organization Details</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{organization.name}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {organization.category} target in {organization.country} for {organization.opportunityType.toLowerCase()}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => onNavigate({ name: "outreach-workspace", organizationId: organization.id })}
          >
            <Handshake className="h-4 w-4" />
            Outreach Workspace
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => onNavigate({ name: "opportunity-intelligence", organizationId: organization.id })}
          >
            <BrainCircuit className="h-4 w-4" />
            Opportunity Intelligence
          </Button>
          <Button variant="secondary" type="button">
            <Pencil className="h-4 w-4" />
            Edit prototype
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Country" value={organization.country} />
              <Field label="Category" value={organization.category} />
              <Field label="Opportunity Type" value={organization.opportunityType} />
              <Field label="Priority" value={<PriorityBadge priority={organization.priority} />} />
              <Field label="Status" value={<StatusBadge status={organization.status} />} />
              <Field label="Domain Authority / DR" value={organization.domainRating} />
              <Field
                label="Opportunity Indicators"
                value={
                  <div className="flex flex-wrap gap-2">
                    {opportunityProfile.indicators.length > 0
                      ? opportunityProfile.indicators.map((indicator) => (
                          <Badge key={indicator} tone={indicator === "Quick Win" ? "gold" : "info"}>
                            {indicator}
                          </Badge>
                        ))
                      : <Badge tone="muted">Needs qualification</Badge>}
                  </div>
                }
                wide
              />
              <Field label="Notes" value={organization.notes} wide />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outreach Plan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="rounded-md border bg-emerald-50/60 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Next Step</p>
                <p className="mt-2 text-sm font-medium text-emerald-950">{organization.nextStep}</p>
              </div>
              <div className="rounded-md border bg-white p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  Next Follow-up
                </p>
                <p className="mt-2 text-lg font-semibold text-emerald-950">{organization.nextFollowUp}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organization.activity.map((item) => (
                  <div key={`${item.date}-${item.title}`} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                    <div className="rounded-md border bg-white p-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Contact Person" value={organization.contactName} />
              <ContactLine icon={<Mail className="h-4 w-4" />} label="Email" value={organization.email} />
              <ContactLine icon={<ExternalLink className="h-4 w-4" />} label="Website" value={organization.website} />
              <ContactLine icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={organization.linkedin} />
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/60">
            <CardHeader>
              <CardTitle>Authority Signal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Domain Authority / Domain Rating</p>
                  <p className="mt-2 text-5xl font-semibold text-emerald-950">{organization.domainRating}</p>
                </div>
                <Badge tone="gold">{organization.opportunityType}</Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{ width: `${organization.domainRating}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-3" : undefined}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function ContactLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-emerald-900">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: OrganizationPriority }) {
  const tone = priority === "high" ? "danger" : priority === "medium" ? "warning" : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: OrganizationStatus }) {
  const tone =
    status === "backlink-secured" || status === "partner"
      ? "success"
      : status === "in-discussion"
        ? "gold"
        : status === "rejected"
          ? "danger"
          : status === "contacted"
            ? "info"
            : "muted";

  return <Badge tone={tone}>{statusLabels[status]}</Badge>;
}
