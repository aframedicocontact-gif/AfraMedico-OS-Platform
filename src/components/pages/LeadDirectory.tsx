import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppView } from "../../app/App";
import type { Lead, LeadSource, LeadStatus } from "../../types/lead";
import { CaseStatusBadge, LeadPriorityBadge, LeadStatusBadge, formatCurrency } from "../leads/leadUi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type LeadDirectoryProps = {
  leads: Lead[];
  onNavigate: (view: AppView) => void;
};

const leadSources: LeadSource[] = [
  "Website",
  "WhatsApp",
  "Facebook",
  "Instagram",
  "Google Search",
  "Google Ads",
  "YouTube",
  "Referral Partner",
  "Hospital",
  "Doctor",
  "NGO",
  "Conference",
  "University",
  "Phone Call",
  "Email",
  "Walk-in",
  "Other",
];

const statuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Medical Documents Requested",
  "Documents Received",
  "Medical Review",
  "Hospital Quotes Requested",
  "Hospital Quotes Received",
  "Patient Decision Pending",
  "Accepted",
  "Lost",
];

export function LeadDirectory({ leads, onNavigate }: LeadDirectoryProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [source, setSource] = useState<"all" | LeadSource>("all");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");

  const countries = Array.from(new Set(leads.map((lead) => lead.country))).sort();

  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesCountry = country === "all" || lead.country === country;
      const matchesSource = source === "all" || lead.leadSource === source;
      const matchesStatus = status === "all" || lead.currentStatus === status;
      const matchesQuery =
        normalized.length === 0 ||
        [
          lead.patientName,
          lead.patientId,
          lead.caseId,
          lead.country,
          lead.city,
          lead.email,
          lead.phone,
          lead.interestedTreatment,
          lead.medicalCondition,
          lead.assignedCoordinator,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchesCountry && matchesSource && matchesStatus && matchesQuery;
    });
  }, [country, leads, query, source, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Lead Management</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Lead Directory</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Search potential patients by source, country, treatment interest, coordinator, and status.
          </p>
        </div>
        <Button type="button" onClick={() => onNavigate({ name: "add-lead" })}>
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_180px_220px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient, treatment, condition, coordinator"
            />
          </label>
          <Select value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="all">All countries</option>
            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={source}
            onChange={(event) => setSource(event.target.value as "all" | LeadSource)}
          >
            <option value="all">All sources</option>
            {leadSources.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | LeadStatus)}
          >
            <option value="all">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <Table className="min-w-[1280px]">
          <TableHeader>
            <TableRow className="bg-emerald-50/70">
              <TableHead>Patient</TableHead>
              <TableHead>Case</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Treatment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Coordinator</TableHead>
              <TableHead>Estimated Cost</TableHead>
              <TableHead>Next Follow-up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => onNavigate({ name: "lead-profile", leadId: lead.id })}
              >
                <TableCell>
                  <div className="font-medium text-emerald-950">{lead.patientName}</div>
                  <div className="text-xs text-muted-foreground">{lead.patientId} | {lead.email}</div>
                  {lead.possibleDuplicate ? (
                    <Badge className="mt-2" tone="warning">Possible duplicate</Badge>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-emerald-950">{lead.caseId}</div>
                  <div className="mt-1">
                    <CaseStatusBadge status={lead.caseStatus} />
                  </div>
                </TableCell>
                <TableCell>
                  {lead.city}, {lead.country}
                </TableCell>
                <TableCell>{lead.leadSource}</TableCell>
                <TableCell className="max-w-56">{lead.interestedTreatment}</TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.currentStatus} />
                </TableCell>
                <TableCell>
                  <LeadPriorityBadge priority={lead.priority} />
                </TableCell>
                <TableCell>{lead.assignedCoordinator}</TableCell>
                <TableCell>{formatCurrency(lead.estimatedTreatmentCost)}</TableCell>
                <TableCell>{lead.nextFollowUp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
