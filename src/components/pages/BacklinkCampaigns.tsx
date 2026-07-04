import { Link2, Mail, Plus, Search, Target } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addOrganizationsToBacklinkCampaign,
  createBacklinkCampaign,
  getBacklinkCampaigns,
  updateBacklinkCampaign,
} from "../../services/backlinkCampaignService";
import {
  updateCampaignTemplate,
  updateTargetBacklinkField,
  updateTargetBacklinkStatus,
  updateTargetOutreachStatus,
} from "../../services/backlinkOutreachService";
import type {
  BacklinkCampaign,
  BacklinkCampaignStatus,
  BacklinkCampaignType,
  CampaignWizardMode,
  BacklinkOutreachStatus,
  BacklinkStatus,
  BacklinkTemplateChannel,
} from "../../types/backlinkCampaign";
import type { Organization, OrganizationCategory, OrganizationPriority, OrganizationStatus, OpportunityType } from "../../types/organization";
import { ExternalFieldLink } from "../common/ExternalFieldLink";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableScrollContainer } from "../ui/table";

type BacklinkCampaignsProps = {
  organizations: Organization[];
  initialOrganizationIds?: string[];
  initialCampaignType?: string;
  initialOpenWizard?: boolean;
};

type WorkspaceTab = "Overview" | "Organizations" | "Outreach Queue" | "Templates" | "Results" | "Backlinks" | "Partnerships";
type BacklinkPotentialFilter = "all" | "high" | "medium" | "low";

const campaignTypes: BacklinkCampaignType[] = [
  "Resource Page Backlink",
  "Guest Article",
  "Partner Page",
  "Medical Directory",
  "Conference",
  "University",
  "Medical Association",
  "Referral Partnership",
  "NGO Partnership",
];

const campaignStatuses: BacklinkCampaignStatus[] = ["Draft", "Active", "Paused", "Completed", "Archived"];
const outreachStatuses: BacklinkOutreachStatus[] = [
  "Discovered",
  "Qualified",
  "Added to Campaign",
  "Message Prepared",
  "Message Sent",
  "Waiting Reply",
  "Follow-up",
  "Backlink Won",
  "Partnership Won",
  "Archived",
];
const backlinkStatuses: BacklinkStatus[] = ["Not Requested", "Requested", "Under Review", "Won", "Rejected", "Needs Follow-up"];
const templateChannels: BacklinkTemplateChannel[] = ["Email", "LinkedIn", "Facebook", "Instagram", "Contact Form"];
const workspaceTabs: WorkspaceTab[] = ["Overview", "Organizations", "Outreach Queue", "Templates", "Results", "Backlinks", "Partnerships"];
const countries = ["Nigeria", "Ghana", "Kenya", "Uganda", "Tanzania", "South Africa"];
const categories: OrganizationCategory[] = ["Universities", "Teaching Hospitals", "Medical Associations", "NGOs", "Health Blogs", "News Media", "Business Directories"];

export function BacklinkCampaigns({
  organizations,
  initialOrganizationIds = [],
  initialCampaignType,
  initialOpenWizard = false,
}: BacklinkCampaignsProps) {
  const [campaigns, setCampaigns] = useState<BacklinkCampaign[]>(() => getBacklinkCampaigns());
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id ?? "");
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0] ?? null;
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("Overview");
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([]);
  const [wizardOpen, setWizardOpen] = useState(initialOpenWizard);
  const [wizardMode, setWizardMode] = useState<CampaignWizardMode>("existing");
  const [wizardCampaignId, setWizardCampaignId] = useState(campaigns[0]?.id ?? "");
  const [wizardCampaignType, setWizardCampaignType] = useState<BacklinkCampaignType>(normalizeCampaignType(initialCampaignType));
  const [wizardCampaignName, setWizardCampaignName] = useState("");
  const [filters, setFilters] = useState({
    country: "all",
    category: "all" as "all" | OrganizationCategory,
    treatmentKeyword: "",
    opportunity: "all" as "all" | OpportunityType,
    priority: "all" as "all" | OrganizationPriority,
    status: "all" as "all" | OrganizationStatus,
    backlinkPotential: "all" as BacklinkPotentialFilter,
  });
  const [form, setForm] = useState({
    campaignName: "",
    targetCountry: "Nigeria",
    treatmentFocus: "Cancer",
    campaignType: "Resource Page Backlink" as BacklinkCampaignType,
    goal: "Build high-quality authority backlinks and partnership pathways.",
    targetBacklinkUrl: "https://aframedico.com",
    anchorText: "AfraMedico international patient support",
    priority: "high" as OrganizationPriority,
    status: "Draft" as BacklinkCampaignStatus,
    startDate: new Date().toISOString().slice(0, 10),
    followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    notes: "",
  });

  const dashboard = useMemo(() => buildDashboard(campaigns), [campaigns]);
  const filteredOrganizations = useMemo(
    () => filterOrganizations(organizations, filters),
    [filters, organizations],
  );

  useEffect(() => {
    if (initialOrganizationIds.length === 0 && !initialOpenWizard) return;
    setSelectedOrganizationIds(initialOrganizationIds);
    setWizardCampaignType(normalizeCampaignType(initialCampaignType));
    setWizardOpen(Boolean(initialOpenWizard));
  }, [initialCampaignType, initialOpenWizard, initialOrganizationIds]);

  useEffect(() => {
    if (!wizardCampaignId && campaigns[0]) {
      setWizardCampaignId(campaigns[0].id);
    }
  }, [campaigns, wizardCampaignId]);

  function persistCampaign(nextCampaign: BacklinkCampaign) {
    const nextCampaigns = updateBacklinkCampaign(nextCampaign);
    setCampaigns(nextCampaigns);
    setSelectedCampaignId(nextCampaign.id);
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.campaignName.trim()) return;

    const nextCampaigns = createBacklinkCampaign({
      ...form,
      targetOrganizationIds: selectedOrganizationIds,
    });

    setCampaigns(nextCampaigns);
    setSelectedCampaignId(nextCampaigns[0]?.id ?? "");
    setWorkspaceTab("Overview");
    setSelectedOrganizationIds([]);
    setForm((current) => ({ ...current, campaignName: "", notes: "" }));
  }

  function handleWizardSave() {
    if (selectedOrganizationIds.length === 0) return;

    if (wizardMode === "existing" && wizardCampaignId) {
      const nextCampaigns = addOrganizationsToBacklinkCampaign(
        wizardCampaignId,
        selectedOrganizationIds,
        form.targetBacklinkUrl,
        form.anchorText,
      );
      setCampaigns(nextCampaigns);
      setSelectedCampaignId(wizardCampaignId);
      setWorkspaceTab("Organizations");
      setWizardOpen(false);
      return;
    }

    const nextCampaigns = createBacklinkCampaign({
      ...form,
      campaignName: wizardCampaignName.trim() || `${wizardCampaignType} - ${form.targetCountry} - ${form.treatmentFocus}`,
      campaignType: wizardCampaignType,
      targetOrganizationIds: selectedOrganizationIds,
    });
    setCampaigns(nextCampaigns);
    setSelectedCampaignId(nextCampaigns[0]?.id ?? "");
    setWizardCampaignId(nextCampaigns[0]?.id ?? "");
    setWorkspaceTab("Organizations");
    setWizardOpen(false);
  }

  function toggleOrganization(organizationId: string) {
    setSelectedOrganizationIds((current) =>
      current.includes(organizationId)
        ? current.filter((id) => id !== organizationId)
        : [...current, organizationId],
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Authority CRM</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Backlink Campaigns</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Build backlink and partnership campaigns, prepare outreach messages, track follow-ups, and record backlink wins.
          </p>
        </div>
        <Badge tone="warning">Copy/paste outreach only. Nothing is sent automatically.</Badge>
      </div>

      <DashboardCards dashboard={dashboard} />

      {wizardOpen ? (
        <CampaignWizard
          campaigns={campaigns}
          campaignName={wizardCampaignName}
          campaignType={wizardCampaignType}
          mode={wizardMode}
          selectedCampaignId={wizardCampaignId}
          selectedOrganizationsCount={selectedOrganizationIds.length}
          setCampaignName={setWizardCampaignName}
          setCampaignType={setWizardCampaignType}
          setMode={setWizardMode}
          setSelectedCampaignId={setWizardCampaignId}
          onCancel={() => setWizardOpen(false)}
          onSave={handleWizardSave}
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <CampaignBuilder
          form={form}
          organizationsSelected={selectedOrganizationIds.length}
          setForm={setForm}
          onSubmit={handleCreate}
        />
        <OrganizationSelector
          filters={filters}
          organizations={filteredOrganizations}
          selectedOrganizationIds={selectedOrganizationIds}
          setFilters={setFilters}
          toggleOrganization={toggleOrganization}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Campaign Workspace</CardTitle>
            <Select value={selectedCampaign?.id ?? ""} onChange={(event) => setSelectedCampaignId(event.target.value)}>
              <option value="">Select campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.campaignName}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedCampaign ? (
            <div className="rounded-lg border border-dashed bg-slate-50 p-8 text-center text-sm text-muted-foreground">
              Create a campaign to open the campaign workspace.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border bg-white p-2">
                <div className="flex min-w-max gap-2">
                  {workspaceTabs.map((tab) => (
                    <button
                      key={tab}
                      className={workspaceTab === tab ? "rounded-md bg-emerald-950 px-3 py-2 text-sm font-medium text-white" : "rounded-md px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50"}
                      type="button"
                      onClick={() => setWorkspaceTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <CampaignWorkspace
                campaign={selectedCampaign}
                organizations={organizations}
                persistCampaign={persistCampaign}
                tab={workspaceTab}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardCards({ dashboard }: { dashboard: ReturnType<typeof buildDashboard> }) {
  const cards = [
    ["Total Campaigns", dashboard.totalCampaigns],
    ["Organizations", dashboard.organizationsTargeted],
    ["Messages Prepared", dashboard.messagesPrepared],
    ["Messages Sent", dashboard.messagesSent],
    ["Replies", dashboard.replies],
    ["Backlinks Won", dashboard.backlinksWon],
    ["Partnerships Won", dashboard.partnershipsWon],
    ["Pending Follow-ups", dashboard.pendingFollowUps],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => (
        <Card key={label}>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CampaignWizard({
  campaigns,
  campaignName,
  campaignType,
  mode,
  selectedCampaignId,
  selectedOrganizationsCount,
  setCampaignName,
  setCampaignType,
  setMode,
  setSelectedCampaignId,
  onCancel,
  onSave,
}: {
  campaigns: BacklinkCampaign[];
  campaignName: string;
  campaignType: BacklinkCampaignType;
  mode: CampaignWizardMode;
  selectedCampaignId: string;
  selectedOrganizationsCount: number;
  setCampaignName: (value: string) => void;
  setCampaignType: (value: BacklinkCampaignType) => void;
  setMode: (value: CampaignWizardMode) => void;
  setSelectedCampaignId: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const canUseExisting = campaigns.length > 0;
  const canSave = selectedOrganizationsCount > 0 && (mode === "new" || selectedCampaignId);

  return (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardHeader>
        <CardTitle>Add Selected Organizations to Campaign</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Step 1</p>
            <p className="mt-1 font-semibold text-emerald-950">Select or create</p>
            <div className="mt-3 grid gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input checked={mode === "existing"} disabled={!canUseExisting} name="campaign-mode" type="radio" onChange={() => setMode("existing")} />
                Select existing campaign
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input checked={mode === "new"} name="campaign-mode" type="radio" onChange={() => setMode("new")} />
                Create new campaign
              </label>
            </div>
            {mode === "existing" ? (
              <Select className="mt-3" disabled={!canUseExisting} value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)}>
                <option value="">Select campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.campaignName}
                  </option>
                ))}
              </Select>
            ) : (
              <Input className="mt-3" placeholder="New campaign name" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} />
            )}
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Step 2</p>
            <p className="mt-1 font-semibold text-emerald-950">Campaign type</p>
            <Select className="mt-3" value={campaignType} onChange={(event) => setCampaignType(event.target.value as BacklinkCampaignType)}>
              {campaignTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
            <p className="mt-3 text-xs text-muted-foreground">{selectedOrganizationsCount} organizations selected from Authority CRM.</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Step 3</p>
            <p className="mt-1 font-semibold text-emerald-950">Save and open workspace</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={!canSave} type="button" onClick={onSave}>
                Save
              </Button>
              <Button variant="secondary" type="button" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignBuilder({
  form,
  organizationsSelected,
  setForm,
  onSubmit,
}: {
  form: {
    campaignName: string;
    targetCountry: string;
    treatmentFocus: string;
    campaignType: BacklinkCampaignType;
    goal: string;
    targetBacklinkUrl: string;
    anchorText: string;
    priority: OrganizationPriority;
    status: BacklinkCampaignStatus;
    startDate: string;
    followUpDate: string;
    notes: string;
  };
  organizationsSelected: number;
  setForm: (value: typeof form) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-emerald-700" />
          Campaign Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input placeholder="Campaign Name" value={form.campaignName} onChange={(event) => setForm({ ...form, campaignName: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={form.targetCountry} onChange={(event) => setForm({ ...form, targetCountry: event.target.value })}>{countries.map((country) => <option key={country}>{country}</option>)}</Select>
            <Input placeholder="Treatment Focus" value={form.treatmentFocus} onChange={(event) => setForm({ ...form, treatmentFocus: event.target.value })} />
          </div>
          <Select value={form.campaignType} onChange={(event) => setForm({ ...form, campaignType: event.target.value as BacklinkCampaignType })}>{campaignTypes.map((type) => <option key={type}>{type}</option>)}</Select>
          <Input placeholder="Goal" value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} />
          <Input placeholder="Target Backlink URL" value={form.targetBacklinkUrl} onChange={(event) => setForm({ ...form, targetBacklinkUrl: event.target.value })} />
          <Input placeholder="Anchor Text" value={form.anchorText} onChange={(event) => setForm({ ...form, anchorText: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as OrganizationPriority })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Select>
            <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BacklinkCampaignStatus })}>{campaignStatuses.map((status) => <option key={status}>{status}</option>)}</Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            <Input type="date" value={form.followUpDate} onChange={(event) => setForm({ ...form, followUpDate: event.target.value })} />
          </div>
          <textarea className="min-h-24 w-full rounded-md border p-3 text-sm" placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <Button className="w-full" type="submit">
            <Plus className="h-4 w-4" />
            Create Campaign ({organizationsSelected} targets)
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function OrganizationSelector({
  filters,
  organizations,
  selectedOrganizationIds,
  setFilters,
  toggleOrganization,
}: {
  filters: {
    country: string;
    category: "all" | OrganizationCategory;
    treatmentKeyword: string;
    opportunity: "all" | OpportunityType;
    priority: "all" | OrganizationPriority;
    status: "all" | OrganizationStatus;
    backlinkPotential: BacklinkPotentialFilter;
  };
  organizations: Organization[];
  selectedOrganizationIds: string[];
  setFilters: (value: typeof filters) => void;
  toggleOrganization: (organizationId: string) => void;
}) {
  const opportunities: OpportunityType[] = ["Expert citation", "Backlink", "Directory listing", "Editorial mention", "Partnership", "Research collaboration"];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-700" />
          Select Organizations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_repeat(6,160px)]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Treatment / Keyword" value={filters.treatmentKeyword} onChange={(event) => setFilters({ ...filters, treatmentKeyword: event.target.value })} />
          </label>
          <Select value={filters.country} onChange={(event) => setFilters({ ...filters, country: event.target.value })}><option value="all">All countries</option>{countries.map((country) => <option key={country}>{country}</option>)}</Select>
          <Select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value as "all" | OrganizationCategory })}><option value="all">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select>
          <Select value={filters.opportunity} onChange={(event) => setFilters({ ...filters, opportunity: event.target.value as "all" | OpportunityType })}><option value="all">All opportunities</option>{opportunities.map((opportunity) => <option key={opportunity}>{opportunity}</option>)}</Select>
          <Select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value as "all" | OrganizationPriority })}><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Select>
          <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as "all" | OrganizationStatus })}><option value="all">All statuses</option><option value="research">Research</option><option value="contacted">Contacted</option><option value="in-discussion">In Discussion</option><option value="partner">Partner</option><option value="backlink-secured">Backlink Secured</option><option value="rejected">Rejected</option></Select>
          <Select value={filters.backlinkPotential} onChange={(event) => setFilters({ ...filters, backlinkPotential: event.target.value as BacklinkPotentialFilter })}><option value="all">All backlink potential</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Select>
        </div>

        <TableScrollContainer>
          <Table className="min-w-[1120px] table-fixed">
            <TableHeader><TableRow className="bg-emerald-50/70"><TableHead className="w-[56px]">Select</TableHead><TableHead className="w-[260px]">Organization</TableHead><TableHead className="w-[140px]">Country</TableHead><TableHead className="w-[190px]">Category</TableHead><TableHead className="w-[180px]">Opportunity</TableHead><TableHead className="w-[130px]">Priority</TableHead><TableHead className="w-[160px]">Backlink Potential</TableHead></TableRow></TableHeader>
            <TableBody>
              {organizations.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell><input checked={selectedOrganizationIds.includes(organization.id)} type="checkbox" onChange={() => toggleOrganization(organization.id)} /></TableCell>
                  <TableCell className="font-medium text-emerald-950">{organization.name}</TableCell>
                  <TableCell>{organization.country}</TableCell>
                  <TableCell>{organization.category}</TableCell>
                  <TableCell>{organization.opportunityType}</TableCell>
                  <TableCell><PriorityBadge priority={organization.priority} /></TableCell>
                  <TableCell><BacklinkPotentialBadge value={getBacklinkPotential(organization)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollContainer>
      </CardContent>
    </Card>
  );
}

function CampaignWorkspace({
  campaign,
  organizations,
  persistCampaign,
  tab,
}: {
  campaign: BacklinkCampaign;
  organizations: Organization[];
  persistCampaign: (campaign: BacklinkCampaign) => void;
  tab: WorkspaceTab;
}) {
  const targetOrganizations = campaign.targets
    .map((target) => ({ target, organization: organizations.find((organization) => organization.id === target.organizationId) }))
    .filter((item): item is { target: BacklinkCampaign["targets"][number]; organization: Organization } => Boolean(item.organization));

  if (tab === "Overview") {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard label="Campaign Type" value={campaign.campaignType} />
        <SummaryCard label="Target Country" value={campaign.targetCountry} />
        <SummaryCard label="Treatment Focus" value={campaign.treatmentFocus} />
        <SummaryCard label="Goal" value={campaign.goal} />
        <SummaryCard label="Target Backlink URL" value={campaign.targetBacklinkUrl} />
        <SummaryCard label="Follow-up Date" value={campaign.followUpDate} />
      </div>
    );
  }

  if (tab === "Templates") {
    return <TemplateEditor campaign={campaign} persistCampaign={persistCampaign} />;
  }

  if (tab === "Backlinks" || tab === "Results") {
    return <BacklinkTrackingTable campaign={campaign} organizations={organizations} persistCampaign={persistCampaign} />;
  }

  if (tab === "Partnerships") {
    return <PartnershipsTable targetOrganizations={targetOrganizations} />;
  }

  if (tab === "Organizations") {
    return <FollowUpsTable campaign={campaign} organizations={organizations} />;
  }

  return (
    <OutreachQueueTable
      campaign={campaign}
      mode={tab}
      persistCampaign={persistCampaign}
      targetOrganizations={targetOrganizations}
    />
  );
}

function OutreachQueueTable({
  campaign,
  mode,
  persistCampaign,
  targetOrganizations,
}: {
  campaign: BacklinkCampaign;
  mode: WorkspaceTab;
  persistCampaign: (campaign: BacklinkCampaign) => void;
  targetOrganizations: Array<{ target: BacklinkCampaign["targets"][number]; organization: Organization }>;
}) {
  return (
    <TableScrollContainer>
      <Table className="min-w-[1900px] table-fixed">
        <TableHeader><TableRow className="bg-emerald-50/70"><TableHead className="w-[240px]">Organization</TableHead><TableHead className="w-[180px]">Website</TableHead><TableHead className="w-[180px]">Contact Page</TableHead><TableHead className="w-[220px]">Email</TableHead><TableHead className="w-[180px]">LinkedIn</TableHead><TableHead className="w-[160px]">Facebook</TableHead><TableHead className="w-[160px]">Instagram</TableHead><TableHead className="w-[160px]">WhatsApp</TableHead><TableHead className="w-[190px]">Current Status</TableHead><TableHead className="w-[160px]">Last Contact Date</TableHead><TableHead className="w-[160px]">Next Follow-up</TableHead></TableRow></TableHeader>
        <TableBody>
          {targetOrganizations.map(({ target, organization }) => (
            <TableRow key={`${mode}-${organization.id}`}>
              <TableCell className="font-medium text-emerald-950">{organization.name}</TableCell>
              <TableCell><ExternalFieldLink type="website" value={organization.website} /></TableCell>
              <TableCell><ExternalFieldLink type="website" value={organization.contactPage || ""} /></TableCell>
              <TableCell><ExternalFieldLink type="email" value={organization.email} /></TableCell>
              <TableCell><ExternalFieldLink type="linkedin" value={organization.linkedin} /></TableCell>
              <TableCell><ExternalFieldLink type="website" value="" /></TableCell>
              <TableCell><ExternalFieldLink type="website" value="" /></TableCell>
              <TableCell><ExternalFieldLink type="website" value="" /></TableCell>
              <TableCell>
                <Select value={target.outreachStatus} onChange={(event) => persistCampaign(updateTargetOutreachStatus(campaign, organization.id, event.target.value as BacklinkOutreachStatus))}>
                  {outreachStatuses.map((status) => <option key={status}>{status}</option>)}
                </Select>
              </TableCell>
              <TableCell>{target.dateRequested || campaign.startDate || "Not set"}</TableCell>
              <TableCell>{campaign.followUpDate || "Not set"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScrollContainer>
  );
}

function TemplateEditor({ campaign, persistCampaign }: { campaign: BacklinkCampaign; persistCampaign: (campaign: BacklinkCampaign) => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {templateChannels.map((channel) => (
        <Card key={channel}>
          <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-emerald-700" />{channel}</CardTitle></CardHeader>
          <CardContent>
            <textarea className="min-h-64 w-full rounded-md border p-3 text-sm leading-6" value={campaign.templates[channel]} onChange={(event) => persistCampaign(updateCampaignTemplate(campaign, channel, event.target.value))} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BacklinkTrackingTable({ campaign, organizations, persistCampaign }: { campaign: BacklinkCampaign; organizations: Organization[]; persistCampaign: (campaign: BacklinkCampaign) => void }) {
  return (
    <TableScrollContainer>
      <Table className="min-w-[1500px] table-fixed">
        <TableHeader><TableRow className="bg-emerald-50/70"><TableHead className="w-[240px]">Organization</TableHead><TableHead className="w-[200px]">Requested URL</TableHead><TableHead className="w-[200px]">Target Page</TableHead><TableHead className="w-[180px]">Anchor Text</TableHead><TableHead className="w-[170px]">Status</TableHead><TableHead className="w-[150px]">Date Requested</TableHead><TableHead className="w-[150px]">Date Won</TableHead><TableHead className="w-[200px]">Backlink URL</TableHead><TableHead className="w-[220px]">Notes</TableHead></TableRow></TableHeader>
        <TableBody>
          {campaign.targets.map((target) => {
            const organization = organizations.find((item) => item.id === target.organizationId);
            if (!organization) return null;
            return (
              <TableRow key={`backlink-${target.organizationId}`}>
                <TableCell className="font-medium text-emerald-950">{organization.name}</TableCell>
                <TableCell><Input value={target.requestedUrl} onChange={(event) => persistCampaign(updateTargetBacklinkField(campaign, target.organizationId, "requestedUrl", event.target.value))} /></TableCell>
                <TableCell><Input value={target.targetPage} onChange={(event) => persistCampaign(updateTargetBacklinkField(campaign, target.organizationId, "targetPage", event.target.value))} /></TableCell>
                <TableCell><Input value={target.anchorText} onChange={(event) => persistCampaign(updateTargetBacklinkField(campaign, target.organizationId, "anchorText", event.target.value))} /></TableCell>
                <TableCell><Select value={target.backlinkStatus} onChange={(event) => persistCampaign(updateTargetBacklinkStatus(campaign, target.organizationId, event.target.value as BacklinkStatus))}>{backlinkStatuses.map((status) => <option key={status}>{status}</option>)}</Select></TableCell>
                <TableCell><Input type="date" value={target.dateRequested} onChange={(event) => persistCampaign(updateTargetBacklinkField(campaign, target.organizationId, "dateRequested", event.target.value))} /></TableCell>
                <TableCell><Input type="date" value={target.dateWon} onChange={(event) => persistCampaign(updateTargetBacklinkField(campaign, target.organizationId, "dateWon", event.target.value))} /></TableCell>
                <TableCell><Input value={target.backlinkUrl} onChange={(event) => persistCampaign(updateTargetBacklinkField(campaign, target.organizationId, "backlinkUrl", event.target.value))} /></TableCell>
                <TableCell><Input value={target.notes} onChange={(event) => persistCampaign(updateTargetBacklinkField(campaign, target.organizationId, "notes", event.target.value))} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableScrollContainer>
  );
}

function FollowUpsTable({ campaign, organizations }: { campaign: BacklinkCampaign; organizations: Organization[] }) {
  const targetOrganizations = campaign.targets
    .map((target) => ({ target, organization: organizations.find((organization) => organization.id === target.organizationId) }))
    .filter((item): item is { target: BacklinkCampaign["targets"][number]; organization: Organization } => Boolean(item.organization));

  return (
    <TableScrollContainer>
      <Table className="min-w-[980px] table-fixed">
        <TableHeader><TableRow className="bg-emerald-50/70"><TableHead className="w-[260px]">Organization</TableHead><TableHead className="w-[180px]">Website</TableHead><TableHead className="w-[180px]">Outreach Status</TableHead><TableHead className="w-[180px]">Backlink Status</TableHead><TableHead className="w-[180px]">Next Follow-up</TableHead></TableRow></TableHeader>
        <TableBody>
          {targetOrganizations.map(({ target, organization }) => (
            <TableRow key={`organization-${target.organizationId}`}>
              <TableCell className="font-medium text-emerald-950">{organization.name}</TableCell>
              <TableCell><ExternalFieldLink type="website" value={organization.website} /></TableCell>
              <TableCell>{target.outreachStatus}</TableCell>
              <TableCell>{target.backlinkStatus}</TableCell>
              <TableCell>{campaign.followUpDate || "Not set"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScrollContainer>
  );
}

function PartnershipsTable({ targetOrganizations }: { targetOrganizations: Array<{ target: BacklinkCampaign["targets"][number]; organization: Organization }> }) {
  const partnershipTargets = targetOrganizations.filter(({ target }) => target.outreachStatus === "Partnership Won");

  return (
    <div className="space-y-3">
      {partnershipTargets.length === 0 ? (
        <p className="rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">No partnership wins have been recorded in this campaign yet.</p>
      ) : null}
      {partnershipTargets.map(({ target, organization }) => (
        <div key={`partnership-${target.organizationId}`} className="rounded-lg border bg-white p-4">
          <div className="font-medium text-emerald-950">{organization.name}</div>
          <p className="mt-1 text-sm text-muted-foreground">Status: {target.outreachStatus}. Notes: {target.notes || "No notes yet."}</p>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-2 font-semibold text-emerald-950">{value || "Not set"}</p></CardContent></Card>;
}

function PriorityBadge({ priority }: { priority: OrganizationPriority }) {
  return <Badge tone={priority === "high" ? "danger" : priority === "medium" ? "warning" : "muted"}>{priority}</Badge>;
}

function BacklinkPotentialBadge({ value }: { value: BacklinkPotentialFilter }) {
  return <Badge tone={value === "high" ? "success" : value === "medium" ? "gold" : "muted"}>{value}</Badge>;
}

function getBacklinkPotential(organization: Organization): BacklinkPotentialFilter {
  if (organization.opportunityType === "Backlink" || organization.domainRating >= 80) return "high";
  if (organization.domainRating >= 55 || ["News Media", "Health Blogs", "Business Directories"].includes(organization.category)) return "medium";
  return "low";
}

function filterOrganizations(
  organizations: Organization[],
  filters: {
    country: string;
    category: "all" | OrganizationCategory;
    treatmentKeyword: string;
    opportunity: "all" | OpportunityType;
    priority: "all" | OrganizationPriority;
    status: "all" | OrganizationStatus;
    backlinkPotential: BacklinkPotentialFilter;
  },
) {
  const keyword = filters.treatmentKeyword.trim().toLowerCase();
  return organizations.filter((organization) => {
    const searchable = [
      organization.treatmentFocus,
      organization.medicalSpecialty,
      organization.notes,
      organization.opportunityType,
      organization.category,
      organization.description,
      organization.aiSummary,
    ].filter(Boolean).join(" ").toLowerCase();

    return (
      (filters.country === "all" || organization.country === filters.country) &&
      (filters.category === "all" || organization.category === filters.category) &&
      (filters.opportunity === "all" || organization.opportunityType === filters.opportunity) &&
      (filters.priority === "all" || organization.priority === filters.priority) &&
      (filters.status === "all" || organization.status === filters.status) &&
      (filters.backlinkPotential === "all" || getBacklinkPotential(organization) === filters.backlinkPotential) &&
      (!keyword || searchable.includes(keyword))
    );
  });
}

function buildDashboard(campaigns: BacklinkCampaign[]) {
  const targets = campaigns.flatMap((campaign) => campaign.targets);
  return {
    totalCampaigns: campaigns.length,
    organizationsTargeted: new Set(targets.map((target) => target.organizationId)).size,
    messagesPrepared: targets.filter((target) => ["Message Prepared", "Message Sent", "Waiting Reply", "Follow-up", "Backlink Won", "Partnership Won"].includes(target.outreachStatus)).length,
    messagesSent: targets.filter((target) => ["Message Sent", "Waiting Reply", "Follow-up", "Backlink Won", "Partnership Won"].includes(target.outreachStatus)).length,
    replies: targets.filter((target) => ["Follow-up", "Backlink Won", "Partnership Won"].includes(target.outreachStatus)).length,
    backlinksWon: targets.filter((target) => target.outreachStatus === "Backlink Won" || target.backlinkStatus === "Won").length,
    partnershipsWon: targets.filter((target) => target.outreachStatus === "Partnership Won").length,
    pendingFollowUps: targets.filter((target) => target.outreachStatus === "Follow-up" || target.backlinkStatus === "Needs Follow-up").length,
  };
}

function normalizeCampaignType(value?: string): BacklinkCampaignType {
  if (value && campaignTypes.includes(value as BacklinkCampaignType)) {
    return value as BacklinkCampaignType;
  }

  if (value === "Conference Collaboration") return "Conference";
  if (value === "Partner Page Listing") return "Partner Page";
  if (value === "Medical Directory Listing") return "Medical Directory";
  if (value === "NGO Awareness Partnership") return "NGO Partnership";

  return "Resource Page Backlink";
}
