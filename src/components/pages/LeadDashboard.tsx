import {
  BadgeCheck,
  Clock3,
  FileSearch,
  FileText,
  Inbox,
  Plus,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { Lead } from "../../types/lead";
import { LeadPriorityBadge, LeadStatusBadge, formatCurrency, leadPipelineStages } from "../leads/leadUi";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type LeadDashboardProps = {
  leads: Lead[];
  onNavigate: (view: AppView) => void;
};

export function LeadDashboard({ leads, onNavigate }: LeadDashboardProps) {
  const newLeads = leads.filter((lead) => lead.currentStatus === "New").length;
  const reviewsPending = leads.filter((lead) =>
    ["Pending Documents", "In Review"].includes(lead.medicalReviewStatus),
  ).length;
  const quotesRequested = leads.filter((lead) => lead.hospitalQuoteStatus === "Requested").length;
  const quotesReceived = leads.filter((lead) =>
    ["Received", "Sent to Patient"].includes(lead.hospitalQuoteStatus),
  ).length;
  const accepted = leads.filter((lead) => lead.currentStatus === "Accepted").length;
  const conversionRate = Math.round((accepted / leads.length) * 100);
  const avgResponse = Math.round(
    leads.reduce((sum, lead) => sum + lead.responseTimeHours, 0) / leads.length,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Lead Management</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Lead Dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage potential patients from first contact through medical review, quotation, and conversion.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "lead-pipeline" })}>
            View pipeline
          </Button>
          <Button type="button" onClick={() => onNavigate({ name: "add-lead" })}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Metric icon={<Users className="h-4 w-4" />} label="Total Leads" value={leads.length} />
        <Metric icon={<Inbox className="h-4 w-4" />} label="New Leads" value={newLeads} />
        <Metric icon={<FileSearch className="h-4 w-4" />} label="Medical Reviews Pending" value={reviewsPending} />
        <Metric icon={<Send className="h-4 w-4" />} label="Hospital Quotes Requested" value={quotesRequested} />
        <Metric icon={<FileText className="h-4 w-4" />} label="Hospital Quotes Received" value={quotesReceived} />
        <Metric icon={<BadgeCheck className="h-4 w-4" />} label="Accepted Leads" value={accepted} />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Conversion Rate" value={`${conversionRate}%`} />
        <Metric icon={<Clock3 className="h-4 w-4" />} label="Average Response Time" value={`${avgResponse}h`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Patient Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leadPipelineStages.map((stage) => {
              const count = leads.filter((lead) => lead.pipelineStage === stage).length;
              const width = Math.max((count / leads.length) * 100, count > 0 ? 7 : 0);

              return (
                <button
                  key={stage}
                  className="grid w-full gap-2 rounded-md p-2 text-left hover:bg-muted sm:grid-cols-[190px_1fr_36px] sm:items-center"
                  type="button"
                  onClick={() => onNavigate({ name: "lead-pipeline" })}
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
            {leads
              .slice()
              .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp))
              .slice(0, 4)
              .map((lead) => (
                <button
                  key={lead.id}
                  className="w-full rounded-md border bg-white p-3 text-left hover:bg-muted"
                  type="button"
                  onClick={() => onNavigate({ name: "lead-profile", leadId: lead.id })}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-emerald-950">{lead.patientName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lead.interestedTreatment} | {formatCurrency(lead.estimatedTreatmentCost)}
                      </p>
                    </div>
                    <LeadPriorityBadge priority={lead.priority} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <LeadStatusBadge status={lead.currentStatus} />
                    <span className="text-xs text-muted-foreground">Next: {lead.nextFollowUp}</span>
                  </div>
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
