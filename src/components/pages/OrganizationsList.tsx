import { CircleDollarSign, FileSpreadsheet, KanbanSquare, Link2, Plus, Search, Sparkles, Target } from "lucide-react";
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
  TableScrollContainer,
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

type SortColumn =
  | "organization"
  | "country"
  | "category"
  | "priority"
  | "status"
  | "opportunity"
  | "domainRating"
  | "createdDate"
  | "updatedDate"
  | "contactEmail"
  | "website"
  | "nextStep";

type SortDirection = "asc" | "desc";

type SortRule = {
  column: SortColumn;
  direction: SortDirection;
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
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([]);

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = organizations.filter((organization) => {
      const matchesCountry = country === "all" || organization.country === country;
      const matchesCategory = category === "all" || organization.category === category;
      const matchesPriority = priority === "all" || organization.priority === priority;
      const matchesStatus = status === "all" || organization.status === status;
      const normalizedTreatmentKeyword = treatmentKeyword.trim().toLowerCase();
      const metadata = organization as Organization & {
        specialty?: string;
        treatment_focus?: string;
        treatmentFocus?: string;
        medicalSpecialty?: string;
        opportunity?: string;
        description?: string;
        aiSummary?: string;
        tags?: string[] | string;
        importedMetadata?: Record<string, unknown>;
        imported_metadata?: Record<string, unknown>;
      };
      const matchesTreatmentKeyword =
        normalizedTreatmentKeyword.length === 0 ||
        [
          metadata.specialty,
          metadata.treatment_focus,
          metadata.treatmentFocus,
          metadata.medicalSpecialty,
          organization.notes,
          metadata.opportunity,
          organization.opportunityType,
          organization.category,
          metadata.description,
          metadata.aiSummary,
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

    if (sortRules.length === 0) return filtered;

    return [...filtered].sort((first, second) => compareOrganizations(first, second, sortRules));
  }, [category, country, organizations, priority, query, sortRules, status, treatmentKeyword]);

  function toggleSort(column: SortColumn) {
    setSortRules((current) => {
      const existing = current.find((rule) => rule.column === column);

      if (!existing) {
        return [...current, { column, direction: "asc" }];
      }

      if (existing.direction === "asc") {
        return current.map((rule) =>
          rule.column === column ? { ...rule, direction: "desc" } : rule,
        );
      }

      return current.filter((rule) => rule.column !== column);
    });
  }

  function toggleSelected(organizationId: string) {
    setSelectedOrganizationIds((current) =>
      current.includes(organizationId)
        ? current.filter((id) => id !== organizationId)
        : [...current, organizationId],
    );
  }

  function toggleAllFiltered() {
    const filteredIds = filteredOrganizations.map((organization) => organization.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedOrganizationIds.includes(id));
    setSelectedOrganizationIds((current) =>
      allSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : Array.from(new Set([...current, ...filteredIds])),
    );
  }

  function handleBulkAction(action: string) {
    if (!action || selectedOrganizationIds.length === 0) return;

    if (action === "export") {
      exportSelectedOrganizations(organizations.filter((organization) => selectedOrganizationIds.includes(organization.id)));
      return;
    }

    const campaignType =
      action === "conference"
        ? "Conference Collaboration"
        : action === "partnership"
          ? "Referral Partnership"
          : "Resource Page Backlink";

    onNavigate({
      name: "backlink-campaigns",
      organizationIds: selectedOrganizationIds,
      campaignType,
      openWizard: true,
    });
  }

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
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "enterprise-task-board" })}>
            <KanbanSquare className="h-4 w-4" />
            Task Board
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "opportunity-dashboard" })}>
            <Target className="h-4 w-4" />
            Opportunity Dashboard
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "revenue-pipeline" })}>
            <CircleDollarSign className="h-4 w-4" />
            Revenue Pipeline
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "backlink-campaigns" })}>
            <Link2 className="h-4 w-4" />
            Backlink Campaigns
          </Button>
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
              placeholder="Search organization"
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

      <div className="flex flex-col gap-3 rounded-lg border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-emerald-950">
            <input
              checked={filteredOrganizations.length > 0 && filteredOrganizations.every((organization) => selectedOrganizationIds.includes(organization.id))}
              type="checkbox"
              onChange={toggleAllFiltered}
            />
            Select All
          </label>
          <span className="text-sm text-muted-foreground">{selectedOrganizationIds.length} selected</span>
        </div>
        <Select
          aria-label="Bulk actions"
          className="sm:w-[260px]"
          value=""
          onChange={(event) => handleBulkAction(event.target.value)}
        >
          <option value="">Actions</option>
          <option value="backlink">Add to Backlink Campaign</option>
          <option value="partnership">Add to Partnership Campaign</option>
          <option value="conference">Add to Conference Campaign</option>
          <option value="export">Export Selected</option>
        </Select>
      </div>

      <TableScrollContainer>
        <Table className="min-w-[2380px] table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-white">
            <TableRow className="bg-emerald-50/70">
              <TableHead className="w-[60px] min-w-[60px] bg-emerald-50">Select</TableHead>
              <SortableTableHead className="w-[260px] min-w-[260px]" column="organization" label="Organization" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[140px] min-w-[140px]" column="country" label="Country" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[210px] min-w-[210px]" column="category" label="Category" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[130px] min-w-[130px]" column="priority" label="Priority" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[180px] min-w-[180px]" column="status" label="Status" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[220px] min-w-[220px]" column="opportunity" label="Opportunity" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[130px] min-w-[130px]" column="domainRating" label="Domain Rating" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[150px] min-w-[150px]" column="createdDate" label="Created Date" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[150px] min-w-[150px]" column="updatedDate" label="Updated Date" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[220px] min-w-[220px]" column="contactEmail" label="Contact Email" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[180px] min-w-[180px]" column="website" label="Website" sortRules={sortRules} onSort={toggleSort} />
              <SortableTableHead className="w-[240px] min-w-[240px]" column="nextStep" label="Next Step" sortRules={sortRules} onSort={toggleSort} />
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
                <TableCell className="w-[60px] min-w-[60px]" onClick={(event) => event.stopPropagation()}>
                  <input
                    checked={selectedOrganizationIds.includes(organization.id)}
                    type="checkbox"
                    onChange={() => toggleSelected(organization.id)}
                  />
                </TableCell>
                <TableCell className="w-[260px] min-w-[260px]">
                  <div className="font-medium text-emerald-950">{organization.name}</div>
                  <div className="text-xs text-muted-foreground">DR {organization.domainRating}</div>
                </TableCell>
                <TableCell className="w-[140px] min-w-[140px]">{organization.country}</TableCell>
                <TableCell className="w-[210px] min-w-[210px]">{organization.category}</TableCell>
                <TableCell className="w-[130px] min-w-[130px]">
                  <PriorityBadge priority={organization.priority} />
                </TableCell>
                <TableCell className="w-[180px] min-w-[180px]">
                  <StatusBadge status={organization.status} />
                </TableCell>
                <TableCell className="w-[220px] min-w-[220px]">{organization.opportunityType}</TableCell>
                <TableCell className="w-[130px] min-w-[130px]">{organization.domainRating}</TableCell>
                <TableCell className="w-[150px] min-w-[150px]">{getOrganizationCreatedDate(organization)}</TableCell>
                <TableCell className="w-[150px] min-w-[150px]">{getOrganizationUpdatedDate(organization)}</TableCell>
                <TableCell className="w-[220px] min-w-[220px] text-sm">
                  <ExternalFieldLink type="email" value={organization.email} />
                </TableCell>
                <TableCell className="w-[180px] min-w-[180px] text-sm">
                  <ExternalFieldLink type="website" value={organization.website} />
                </TableCell>
                <TableCell className="w-[240px] min-w-[240px] break-words">{organization.nextStep}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollContainer>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: OrganizationPriority }) {
  const tone = priority === "high" ? "danger" : priority === "medium" ? "warning" : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}

function SortableTableHead({
  className,
  column,
  label,
  sortRules,
  onSort,
}: {
  className: string;
  column: SortColumn;
  label: string;
  sortRules: SortRule[];
  onSort: (column: SortColumn) => void;
}) {
  const sortIndex = sortRules.findIndex((rule) => rule.column === column);
  const activeRule = sortIndex >= 0 ? sortRules[sortIndex] : null;
  const indicator = activeRule ? (activeRule.direction === "asc" ? "▲" : "▼") : "Sort";

  return (
    <TableHead className={`${className} bg-emerald-50`}>
      <button
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left text-xs font-medium text-muted-foreground hover:text-emerald-950"
        type="button"
        title={`Sort by ${label}`}
        onClick={() => onSort(column)}
      >
        <span>{label}</span>
        <span className={activeRule ? "flex items-center gap-1 text-[10px] text-emerald-800" : "flex items-center gap-1 text-[10px] text-muted-foreground/70"}>
          {activeRule ? <span className="rounded bg-emerald-100 px-1 text-emerald-800">{sortIndex + 1}</span> : null}
          <span>{indicator}</span>
        </span>
      </button>
    </TableHead>
  );
}

function compareOrganizations(first: Organization, second: Organization, sortRules: SortRule[]) {
  for (const rule of sortRules) {
    const firstValue = getSortValue(first, rule.column);
    const secondValue = getSortValue(second, rule.column);
    const comparison = compareValues(firstValue, secondValue);

    if (comparison !== 0) {
      return rule.direction === "asc" ? comparison : -comparison;
    }
  }

  return 0;
}

function compareValues(first: string | number, second: string | number) {
  if (typeof first === "number" && typeof second === "number") {
    return first - second;
  }

  return String(first).localeCompare(String(second), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getSortValue(organization: Organization, column: SortColumn) {
  switch (column) {
    case "organization":
      return organization.name;
    case "country":
      return organization.country;
    case "category":
      return organization.category;
    case "priority":
      return priorityRank(organization.priority);
    case "status":
      return statusLabels[organization.status];
    case "opportunity":
      return organization.opportunityType;
    case "domainRating":
      return organization.domainRating;
    case "createdDate":
      return Date.parse(getOrganizationCreatedDate(organization)) || 0;
    case "updatedDate":
      return Date.parse(getOrganizationUpdatedDate(organization)) || 0;
    case "contactEmail":
      return organization.email;
    case "website":
      return organization.website;
    case "nextStep":
      return organization.nextStep;
    default:
      return "";
  }
}

function priorityRank(priority: OrganizationPriority) {
  if (priority === "high") return 1;
  if (priority === "medium") return 2;
  return 3;
}

function getOrganizationCreatedDate(organization: Organization) {
  const metadata = organization as Organization & {
    createdAt?: string;
    created_at?: string;
  };

  return metadata.createdAt || metadata.created_at || organization.activity.at(-1)?.date || organization.activity[0]?.date || "";
}

function getOrganizationUpdatedDate(organization: Organization) {
  const metadata = organization as Organization & {
    updatedAt?: string;
    updated_at?: string;
  };

  return metadata.updatedAt || metadata.updated_at || organization.activity[0]?.date || getOrganizationCreatedDate(organization);
}

function exportSelectedOrganizations(selectedOrganizations: Organization[]) {
  if (typeof window === "undefined" || selectedOrganizations.length === 0) return;
  const headers = ["Organization", "Country", "Category", "Priority", "Status", "Opportunity", "Email", "Website", "Next Step"];
  const rows = selectedOrganizations.map((organization) => [
    organization.name,
    organization.country,
    organization.category,
    organization.priority,
    statusLabels[organization.status],
    organization.opportunityType,
    organization.email,
    organization.website,
    organization.nextStep,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "authority-crm-selected-organizations.csv";
  link.click();
  URL.revokeObjectURL(url);
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
