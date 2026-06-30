import { FileSpreadsheet, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppView } from "../../app/App";
import { ExternalFieldLink } from "../common/ExternalFieldLink";
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
import type {
  Organization,
  OrganizationCategory,
  OrganizationPriority,
  OrganizationStatus,
} from "../../types/organization";

type OrganizationsListProps = {
  organizations: Organization[];
  onNavigate: (view: AppView) => void;
};

const countries = ["Nigeria", "Ghana", "Kenya", "Uganda", "Tanzania", "South Africa"];
const categories: OrganizationCategory[] = [
  "Universities",
  "Teaching Hospitals",
  "Medical Associations",
  "NGOs",
  "Health Blogs",
  "News Media",
  "Business Directories",
];

const statusLabels: Record<OrganizationStatus, string> = {
  research: "Research",
  contacted: "Contacted",
  "in-discussion": "In Discussion",
  partner: "Partner",
  "backlink-secured": "Backlink Secured",
  rejected: "Rejected",
};

export function OrganizationsList({ organizations, onNavigate }: OrganizationsListProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [category, setCategory] = useState<"all" | OrganizationCategory>("all");
  const [treatmentKeyword, setTreatmentKeyword] = useState("");
  const [priority, setPriority] = useState<"all" | OrganizationPriority>("all");
  const [status, setStatus] = useState<"all" | OrganizationStatus>("all");

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return organizations.filter((organization) => {
      const matchesCountry = country === "all" || organization.country === country;
      const matchesCategory = category === "all" || organization.category === category;
      const matchesPriority = priority === "all" || organization.priority === priority;
      const matchesStatus = status === "all" || organization.status === status;
      const normalizedTreatmentKeyword = treatmentKeyword.trim().toLowerCase();
      const metadata = organization as Organization & {
        specialty?: string;
        treatment_focus?: string;
        opportunity?: string;
        tags?: string[] | string;
        importedMetadata?: Record<string, unknown>;
        imported_metadata?: Record<string, unknown>;
      };
      const matchesTreatmentKeyword =
        normalizedTreatmentKeyword.length === 0 ||
        [
          metadata.specialty,
          metadata.treatment_focus,
          organization.notes,
          metadata.opportunity,
          organization.opportunityType,
          Array.isArray(metadata.tags) ? metadata.tags.join(" ") : metadata.tags,
          metadata.importedMetadata ? Object.values(metadata.importedMetadata).join(" ") : undefined,
          metadata.imported_metadata ? Object.values(metadata.imported_metadata).join(" ") : undefined,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedTreatmentKeyword);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          organization.name,
          organization.category,
          organization.country,
          organization.email,
          organization.website,
          organization.opportunityType,
          organization.nextStep,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCountry && matchesCategory && matchesTreatmentKeyword && matchesPriority && matchesStatus && matchesQuery;
    });
  }, [category, country, organizations, priority, query, status, treatmentKeyword]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Authority targets</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Organizations List</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Prioritize universities, teaching hospitals, associations, NGOs, media, blogs, and directories for Africa authority building.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "authority-discovery" })}>
            <Sparkles className="h-4 w-4" />
            Authority Discovery
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "csv-import" })}>
            <FileSpreadsheet className="h-4 w-4" />
            Import CSV
          </Button>
          <Button type="button" onClick={() => onNavigate({ name: "add-organization" })}>
            <Plus className="h-4 w-4" />
            Add organization
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_repeat(5,180px)]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search organization, email, website, opportunity"
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
            value={category}
            onChange={(event) => setCategory(event.target.value as "all" | OrganizationCategory)}
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Treatment / Keyword"
            placeholder="Treatment / Keyword"
            value={treatmentKeyword}
            onChange={(event) => setTreatmentKeyword(event.target.value)}
          />
          <Select
            value={priority}
            onChange={(event) => setPriority(event.target.value as "all" | OrganizationPriority)}
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | OrganizationStatus)}
          >
            <option value="all">All statuses</option>
            <option value="research">Research</option>
            <option value="contacted">Contacted</option>
            <option value="in-discussion">In Discussion</option>
            <option value="partner">Partner</option>
            <option value="backlink-secured">Backlink Secured</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-emerald-50/70">
              <TableHead>Organization</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Next Step</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.map((organization) => (
              <TableRow
                key={organization.id}
                className="cursor-pointer"
                onClick={() =>
                  onNavigate({
                    name: "organization-details",
                    organizationId: organization.id,
                  })
                }
              >
                <TableCell>
                  <div className="font-medium text-emerald-950">{organization.name}</div>
                  <div className="text-xs text-muted-foreground">DR {organization.domainRating}</div>
                </TableCell>
                <TableCell>{organization.country}</TableCell>
                <TableCell>{organization.category}</TableCell>
                <TableCell>
                  <PriorityBadge priority={organization.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={organization.status} />
                </TableCell>
                <TableCell>{organization.opportunityType}</TableCell>
                <TableCell className="text-sm">
                  <ExternalFieldLink type="email" value={organization.email} />
                </TableCell>
                <TableCell className="text-sm">
                  <ExternalFieldLink type="website" value={organization.website} />
                </TableCell>
                <TableCell className="max-w-80">{organization.nextStep}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
