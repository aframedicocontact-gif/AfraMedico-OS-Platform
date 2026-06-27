import {
  Activity,
  Building2,
  FilePlus2,
  GitBranch,
  Link2,
  Network,
  Plus,
  Search,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type {
  CaseLinkedProviderIntelligence,
  CoordinatorContact,
  HpnData,
  Physician,
  ProviderOrganization,
  ProviderPerformanceRecord,
  ProviderRelationshipActivity,
  ProviderRelationshipNote,
  RegionalContact,
} from "../../types/hpn";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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

type HpnPage =
  | "dashboard"
  | "directory"
  | "profile"
  | "case-intelligence"
  | "regional-contacts"
  | "performance"
  | "relationship-management"
  | "add-provider";

type HealthcareProviderNetworkProps = {
  data: HpnData;
  page: HpnPage;
  providerId?: string;
  onNavigate: (view: AppView) => void;
};

const hpnPages: Array<{ label: string; view: AppView }> = [
  { label: "Executive Dashboard", view: { name: "hpn-dashboard" } },
  { label: "Provider Explorer", view: { name: "hpn-directory" } },
  { label: "Provider Profile", view: { name: "hpn-provider-profile", providerId: "prov-acibadem-group" } },
  { label: "Case Intelligence", view: { name: "hpn-case-intelligence" } },
  { label: "Regional Contacts", view: { name: "hpn-regional-contacts" } },
  { label: "Provider Performance", view: { name: "hpn-performance" } },
  { label: "Relationship Management", view: { name: "hpn-relationship-management" } },
  { label: "Add Lightweight Provider", view: { name: "hpn-add-provider" } },
];

export function HealthcareProviderNetwork({ data, page, providerId, onNavigate }: HealthcareProviderNetworkProps) {
  const selectedProvider = useMemo(
    () =>
      data.providerOrganizations.find((provider) => provider.id === providerId) ??
      data.providerOrganizations[0],
    [data.providerOrganizations, providerId],
  );

  return (
    <div className="space-y-6">
      <HpnHeader page={page} selectedProvider={selectedProvider} onNavigate={onNavigate} />
      {page === "dashboard" ? <HpnDashboard data={data} onNavigate={onNavigate} /> : null}
      {page === "directory" ? <ProviderDirectory data={data} onNavigate={onNavigate} /> : null}
      {page === "profile" ? <ProviderProfile data={data} provider={selectedProvider} onNavigate={onNavigate} /> : null}
      {page === "case-intelligence" ? <CaseLinkedProviderIntelligenceView data={data} onNavigate={onNavigate} /> : null}
      {page === "regional-contacts" ? <RegionalContacts data={data} /> : null}
      {page === "performance" ? <ProviderPerformance data={data} onNavigate={onNavigate} /> : null}
      {page === "relationship-management" ? <RelationshipManagement data={data} onNavigate={onNavigate} /> : null}
      {page === "add-provider" ? <AddLightweightProvider /> : null}
    </div>
  );
}

function HpnHeader({
  page,
  selectedProvider,
  onNavigate,
}: {
  page: HpnPage;
  selectedProvider: ProviderOrganization;
  onNavigate: (view: AppView) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-200">Healthcare Provider Network</p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{pageTitle(page)}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-emerald-50">
              HPN is not a hospital directory. It is a case-driven provider knowledge base that grows from referrals, MSO responses, quotes, outcomes, coordinator notes, and commission experience.
            </p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-950 ring-1 ring-yellow-200">Data grows from cases</Badge>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {hpnPages.map((item) => {
            const active = currentPageName(page) === item.view.name;
            return (
              <Button
                key={item.label}
                className={active ? "" : "bg-white text-emerald-950 ring-1 ring-border hover:bg-emerald-50"}
                type="button"
                variant={active ? "primary" : "ghost"}
                onClick={() => onNavigate(item.view)}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>

      {page === "profile" ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current provider profile</p>
              <p className="mt-1 font-semibold text-emerald-950">{selectedProvider.name}</p>
            </div>
            <HpnActions onNavigate={onNavigate} providerId={selectedProvider.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function HpnDashboard({ data, onNavigate }: { data: HpnData; onNavigate: (view: AppView) => void }) {
  const activeCases = data.providerOrganizations.reduce((sum, provider) => sum + provider.activeCases, 0);
  const completedCases = data.providerOrganizations.reduce((sum, provider) => sum + provider.completedCases, 0);
  const countries = new Set(data.providerOrganizations.map((provider) => provider.country));
  const averageMsoHours = averageHours(data.performanceRecords.map((record) => record.averageMsoResponseTime));
  const averageQuoteHours = averageHours(data.performanceRecords.map((record) => record.averageQuoteResponseTime));
  const bestProviders = [...data.performanceRecords].sort((a, b) => b.caseSuccessRate - a.caseSuccessRate).slice(0, 3);
  const recentlyUpdated = [...data.relationshipNotes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Network />} label="Provider Organizations" value={data.providerOrganizations.length} helper="Hospital groups, branches, and related providers" />
        <MetricCard icon={<Building2 />} label="Hospital Branches" value={data.hospitalBranches.length} helper="Operational locations" />
        <MetricCard icon={<GitBranch />} label="Departments" value={data.departments.length} helper="Clinical and operational departments" tone="info" />
        <MetricCard icon={<Stethoscope />} label="Treatment Programs" value={data.treatmentPrograms.length} helper="Gamma Knife, CyberKnife, robotic surgery" tone="gold" />
        <MetricCard icon={<Users />} label="Physicians" value={data.physicians.length} helper="Case-linked physician knowledge" />
        <MetricCard icon={<Users />} label="Regional Coordinators" value={data.regionalContacts.length} helper="Region-specific contact paths" tone="info" />
        <MetricCard icon={<Search />} label="Countries" value={countries.size} helper="Provider operating countries" tone="success" />
        <MetricCard icon={<Link2 />} label="Cases Linked" value={activeCases + completedCases} helper="Cases enriching provider knowledge" tone="gold" />
        <MetricCard icon={<Activity />} label="MSO Requests" value={data.caseLinkedIntelligence.filter((item) => item.msoStatus !== "Not requested").length} helper="MSO evidence events" tone="info" />
        <MetricCard icon={<FilePlus2 />} label="Quotes" value={data.caseLinkedIntelligence.filter((item) => item.quoteStatus !== "Not requested").length} helper="Quote intelligence events" />
        <MetricCard icon={<Activity />} label="Average MSO Time" value={`${averageMsoHours}h`} helper="Across provider performance records" tone="success" />
        <MetricCard icon={<Activity />} label="Average Quote Time" value={`${averageQuoteHours}h`} helper="Quote response intelligence" tone="warning" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Case-driven Provider Growth</CardTitle>
              <p className="text-sm text-muted-foreground">Each provider record is enriched by real operational evidence.</p>
            </div>
            <Button type="button" onClick={() => onNavigate({ name: "hpn-directory" })}>Open Provider Explorer</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.providerOrganizations.map((provider) => (
              <button
                key={provider.id}
                className="w-full rounded-lg border bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60"
                type="button"
                onClick={() => onNavigate({ name: "hpn-provider-profile", providerId: provider.id })}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-emerald-950">{provider.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{provider.dataGrowthNote}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ProviderTypeBadge type={provider.type} />
                    {provider.lightweight ? <Badge tone="warning">Lightweight</Badge> : <Badge tone="success">Enriched</Badge>}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Best Performing Providers</CardTitle>
              <p className="text-sm text-muted-foreground">Ranked by accumulated case success evidence.</p>
            </div>
            <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hpn-performance" })}>View performance</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestProviders.map((record, index) => (
              <button
                key={record.providerId}
                className="w-full rounded-md border bg-slate-50 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50"
                type="button"
                onClick={() => onNavigate({ name: "hpn-provider-profile", providerId: record.providerId })}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">{index + 1}. {providerName(data, record.providerId)}</p>
                    <p className="text-xs text-muted-foreground">{record.specialtyStrength}</p>
                  </div>
                  <Badge tone="success">{record.caseSuccessRate}% success</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Updated Providers</CardTitle>
          <p className="text-sm text-muted-foreground">Recent case-linked notes that changed provider knowledge.</p>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {recentlyUpdated.map((note) => (
            <div key={note.id} className="rounded-md border bg-white p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{note.date}</span>
                <Badge tone="info">{note.source}</Badge>
                <Badge tone="muted">{note.linkedCase}</Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-emerald-950">{providerName(data, note.providerId)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{note.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HPN Operating Rule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          {[
            "Search existing records.",
            "Link the Case if found.",
            "Create lightweight records if missing.",
            "Enrich through future Cases.",
            "Never overwrite history.",
          ].map((item, index) => (
            <div key={item} className="flex gap-3 rounded-md border bg-slate-50 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">{index + 1}</span>
              <p className="text-sm text-emerald-950">{item}</p>
            </div>
          ))}
          </CardContent>
        </Card>
    </div>
  );
}

function ProviderDirectory({ data, onNavigate }: { data: HpnData; onNavigate: (view: AppView) => void }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [treatment, setTreatment] = useState("all");
  const [language, setLanguage] = useState("all");
  const countries = Array.from(new Set(data.providerOrganizations.map((provider) => provider.country)));
  const treatments = Array.from(new Set(data.providerOrganizations.flatMap((provider) => provider.treatmentAreas)));
  const languages = Array.from(new Set([...data.physicians.flatMap((item) => item.languages), ...data.regionalContacts.flatMap((item) => item.languages)]));

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.providerOrganizations.filter((provider) =>
      (country === "all" || provider.country === country) &&
      (treatment === "all" || provider.treatmentAreas.includes(treatment)) &&
      (language === "all" || providerHasLanguage(data, provider.id, language)) &&
      (
        !normalized ||
        [provider.name, provider.type, provider.city, provider.country, provider.treatmentAreas.join(" "), provider.primaryContact]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      ),
    );
  }, [country, data, language, query, treatment]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_180px_220px_180px_auto]">
          <label className="relative w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search provider, branch, treatment, contact, country" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <Select value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="all">All countries</option>
            {countries.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={treatment} onChange={(event) => setTreatment(event.target.value)}>
            <option value="all">All treatments</option>
            {treatments.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="all">All languages</option>
            {languages.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Button type="button" onClick={() => onNavigate({ name: "hpn-add-provider" })}>
            <Plus className="h-4 w-4" />
            Create Lightweight Provider
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Explorer</CardTitle>
          <p className="text-sm text-muted-foreground">Expandable operational hierarchy: Provider Organization to Branch to Department to Program to Physician to Regional Coordinator.</p>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {filtered.map((provider) => (
            <ProviderTree key={provider.id} data={data} provider={provider} onNavigate={onNavigate} />
          ))}
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <Table className="min-w-[1150px]">
          <TableHeader>
            <TableRow className="bg-emerald-50/70">
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Treatment Areas</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Data Completeness</TableHead>
              <TableHead>Active Cases</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Growth Model</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((provider) => (
              <TableRow key={provider.id} className="cursor-pointer" onClick={() => onNavigate({ name: "hpn-provider-profile", providerId: provider.id })}>
                <TableCell>
                  <div className="font-medium text-emerald-950">{provider.name}</div>
                  <div className="text-xs text-muted-foreground">{provider.linkedCases.length} linked case signals</div>
                </TableCell>
                <TableCell><ProviderTypeBadge type={provider.type} /></TableCell>
                <TableCell>{provider.city}, {provider.country}</TableCell>
                <TableCell className="max-w-80">{provider.treatmentAreas.join(", ")}</TableCell>
                <TableCell>{provider.primaryContact}</TableCell>
                <TableCell><Completeness value={provider.dataCompleteness} /></TableCell>
                <TableCell>{provider.activeCases}</TableCell>
                <TableCell>{provider.completedCases}</TableCell>
                <TableCell>{provider.lightweight ? <Badge tone="warning">Lightweight</Badge> : <Badge tone="success">Case-enriched</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProviderProfile({ data, provider, onNavigate }: { data: HpnData; provider: ProviderOrganization; onNavigate: (view: AppView) => void }) {
  const branches = data.hospitalBranches.filter((item) => item.providerId === provider.id || provider.id === "prov-acibadem-group");
  const departments = data.departments.filter((item) => item.providerId === provider.id);
  const programs = data.treatmentPrograms.filter((item) => item.providerId === provider.id);
  const physicians = data.physicians.filter((item) => item.providerId === provider.id);
  const contacts = data.coordinators.filter((item) => item.providerId === provider.id);
  const regionalContacts = data.regionalContacts.filter((item) => item.providerId === provider.id);
  const performance = findPerformance(data.performanceRecords, provider.id);
  const notes = data.relationshipNotes.filter((item) => item.providerId === provider.id);
  const relationshipActivities = data.relationshipActivities.filter((item) => item.providerId === provider.id);
  const intelligence = data.caseLinkedIntelligence.filter((item) => item.providerId === provider.id);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{provider.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{provider.city}, {provider.country}</p>
              </div>
              {provider.lightweight ? <Badge tone="warning">Lightweight record</Badge> : <Badge tone="success">Case-enriched</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-950">
              Data grows from cases. This profile is intentionally allowed to be incomplete and should be enriched by referrals, MSO responses, quotes, outcomes, notes, and feedback.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Provider Type" value={provider.type} />
              <Field label="Primary Contact" value={provider.primaryContact} />
              <Field label="Active Cases" value={String(provider.activeCases)} />
              <Field label="Completed Cases" value={String(provider.completedCases)} />
              <Field label="MSO Response Time" value={performance.averageMsoResponseTime} />
              <Field label="Quote Response Time" value={performance.averageQuoteResponseTime} />
              <Field label="Case Success Rate" value={`${performance.caseSuccessRate}%`} />
              <Field label="Commission Reliability" value={`${performance.commissionReliability}%`} />
            </div>
            <Completeness value={provider.dataCompleteness} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <HierarchyRow label="Provider Network" value="Acibadem Healthcare Group" />
              <HierarchyRow label="Provider Organization" value={provider.name} />
              <HierarchyRow label="Hospital Branches" value={branches.map((item) => item.name).join(", ") || "Grows from future cases"} />
              <HierarchyRow label="Departments" value={departments.map((item) => item.name).join(", ") || "Not yet enriched"} />
              <HierarchyRow label="Treatment Programs" value={programs.map((item) => item.name).join(", ") || "Not yet enriched"} />
              <HierarchyRow label="Physicians" value={physicians.map((item) => item.name).join(", ") || "Not yet enriched"} />
              <HierarchyRow label="Regional Contacts" value={regionalContacts.map((item) => item.name).join(", ") || "Not yet enriched"} />
              <HierarchyRow label="Case History" value={provider.linkedCases.join(", ")} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <EntityList title="Branches" items={branches.map((item) => `${item.name} - ${item.strengths.join(", ")}`)} />
        <EntityList title="Departments" items={departments.map((item) => `${item.name} - ${item.specialty}`)} />
        <EntityList title="Treatment Programs" items={programs.map((item) => `${item.name} - ${item.evidenceCount} evidence signals`)} />
        <EntityList title="Physicians" items={physicians.map((item) => `${item.name} - ${item.specialty}`)} />
        <EntityList title="Coordinators" items={contacts.map((item) => `${item.name} - reliability ${item.reliability}%`)} />
        <EntityList title="Regional Contacts" items={regionalContacts.map((item) => `${item.name} - ${item.region}`)} />
        <EntityList title="International Office" items={contacts.filter((item) => item.office.toLowerCase().includes("international")).map((item) => `${item.name} - ${item.languages.join(", ")}`)} />
        <EntityList title="Financial Contacts" items={notes.filter((item) => item.source === "Commission Experience").map((item) => `${item.author} - ${item.linkedCase}`)} />
        <EntityList title="Patient Feedback" items={intelligence.filter((item) => item.evidenceSource === "Patient Feedback" || item.treatmentOutcome).map((item) => `${item.caseId} - ${item.treatmentOutcome}`)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <RelationshipNotes notes={notes} />
        <LinkedCases intelligence={intelligence} onNavigate={onNavigate} />
      </div>
      <RelationshipActivityTimeline activities={relationshipActivities} />
    </div>
  );
}

function ProviderTree({ data, provider, onNavigate }: { data: HpnData; provider: ProviderOrganization; onNavigate: (view: AppView) => void }) {
  const branches = data.hospitalBranches.filter((branch) => branch.providerId === provider.id || provider.id === "prov-acibadem-group");

  return (
    <details className="rounded-lg border bg-white p-4" open={provider.id === "prov-acibadem-group"}>
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-emerald-950">{provider.name}</p>
            <p className="text-sm text-muted-foreground">Provider Organization | {provider.city}, {provider.country}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ProviderTypeBadge type={provider.type} />
            <Badge tone={provider.lightweight ? "warning" : "success"}>{provider.lightweight ? "Lightweight" : "Case-enriched"}</Badge>
          </div>
        </div>
      </summary>
      <div className="mt-4 space-y-3 border-l-2 border-emerald-100 pl-4">
        {branches.length === 0 ? <EmptyState text="Branches will grow from future Cases." /> : null}
        {branches.map((branch) => {
          const departments = data.departments.filter((department) => department.branchId === branch.id);
          return (
            <details key={branch.id} className="rounded-md border bg-emerald-50/40 p-3">
              <summary className="cursor-pointer list-none font-medium text-emerald-950">Hospital Branch: {branch.name}</summary>
              <div className="mt-3 space-y-3 border-l-2 border-emerald-200 pl-4">
                {departments.map((department) => {
                  const programs = data.treatmentPrograms.filter((program) => program.departmentId === department.id);
                  return (
                    <details key={department.id} className="rounded-md border bg-white p-3">
                      <summary className="cursor-pointer list-none text-sm font-medium text-emerald-950">Department: {department.name}</summary>
                      <div className="mt-3 space-y-2 border-l-2 border-slate-200 pl-4">
                        {programs.map((program) => {
                          const physicians = data.physicians.filter((physician) => physician.programId === program.id);
                          return (
                            <div key={program.id} className="rounded-md bg-slate-50 p-3">
                              <p className="text-sm font-medium text-emerald-950">Treatment Program: {program.name}</p>
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                {physicians.map((physician) => <p key={physician.id}>Physician: {physician.name}</p>)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
                <div className="rounded-md bg-white p-3">
                  <p className="text-sm font-medium text-emerald-950">Regional Coordinators</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.regionalContacts.filter((contact) => contact.providerId === provider.id || provider.id === "prov-acibadem-group").map((contact) => (
                      <Badge key={contact.id} tone="info">{contact.name} | {contact.region}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          );
        })}
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hpn-provider-profile", providerId: provider.id })}>Open Provider Profile</Button>
      </div>
    </details>
  );
}

function CaseLinkedProviderIntelligenceView({ data, onNavigate }: { data: HpnData; onNavigate: (view: AppView) => void }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>The Provider Grows Through Cases</CardTitle>
          <p className="text-sm text-muted-foreground">Case Intelligence is the heart of HPN. Every operational event adds durable provider knowledge.</p>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {[
            ["Case 001", "Created Provider"],
            ["Case 018", "Added new physician"],
            ["Case 024", "Added Africa Coordinator"],
            ["Case 031", "Improved MSO metrics"],
            ["Case 044", "Updated quote response"],
            ["Case 061", "Added patient satisfaction"],
          ].map(([caseLabel, action]) => (
            <div key={caseLabel} className="rounded-lg border bg-emerald-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{caseLabel}</p>
              <p className="mt-1 font-semibold text-emerald-950">{action}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Case-Linked Provider Intelligence</CardTitle>
            <p className="text-sm text-muted-foreground">Shows which cases created or enriched provider records.</p>
          </div>
          <Button type="button" onClick={() => onNavigate({ name: "case-profile", caseId: "CASE-1001-CARDIAC" })}>Open Case Workspace</Button>
        </CardHeader>
        <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[1300px]">
            <TableHeader>
              <TableRow className="bg-emerald-50/70">
                <TableHead>Case</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Evidence Source</TableHead>
                <TableHead>Referral</TableHead>
                <TableHead>MSO</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Treatment Outcome</TableHead>
                <TableHead>Coordinator Notes</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.caseLinkedIntelligence.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium text-emerald-950">{item.caseId}</div>
                    <div className="text-xs text-muted-foreground">{item.patientName} | {item.treatment}</div>
                  </TableCell>
                  <TableCell>{providerName(data, item.providerId)}</TableCell>
                  <TableCell><Badge tone="info">{item.evidenceSource}</Badge></TableCell>
                  <TableCell>{item.referralStatus}</TableCell>
                  <TableCell>{item.msoStatus}</TableCell>
                  <TableCell>{item.quoteStatus}</TableCell>
                  <TableCell>{item.treatmentOutcome}</TableCell>
                  <TableCell className="max-w-96">{item.coordinatorNote}</TableCell>
                  <TableCell>
                    <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: item.caseId })}>Open Case Workspace</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RegionalContacts({ data }: { data: HpnData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {data.regionalContacts.map((contact) => (
        <Card key={contact.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{contact.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{contact.region}</p>
              </div>
              <Badge tone="success">{contact.responsiveness}% responsive</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Provider" value={providerName(data, contact.providerId)} />
              <Field label="Countries Covered" value={contact.countriesCovered.join(", ")} />
              <Field label="Languages" value={contact.languages.join(", ")} />
              <Field label="Linked Cases" value={contact.linkedCases.join(", ")} />
            </div>
            <p className="rounded-md border bg-slate-50 p-3 text-sm text-muted-foreground">
              Contacts may differ by region, language, patient nationality, urgency, and treatment type. HPN preserves these contact paths instead of assuming one universal hospital contact.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProviderPerformance({ data, onNavigate }: { data: HpnData; onNavigate: (view: AppView) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-2">
        {data.performanceRecords.map((record) => (
          <Card key={record.providerId}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{providerName(data, record.providerId)}</CardTitle>
                  <p className="text-sm text-muted-foreground">{record.specialtyStrength}</p>
                </div>
                <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hpn-provider-profile", providerId: record.providerId })}>Open profile</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScoreBar label="Acceptance Rate" value={record.acceptanceRate} />
              <ScoreBar label="Case Success" value={record.caseSuccessRate} />
              <ScoreBar label="Coordinator Responsiveness" value={record.coordinatorResponsiveness} />
              <ScoreBar label="Patient Satisfaction" value={record.patientSatisfaction} />
              <ScoreBar label="Commission Reliability" value={record.commissionReliability} />
              <ScoreBar label="Clinical Communication" value={record.clinicalCommunication} />
              <ScoreBar label="Treatment Strength" value={record.treatmentStrength} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Average MSO Time" value={record.averageMsoResponseTime} />
                <Field label="Average Quote Time" value={record.averageQuoteResponseTime} />
                <Field label="Cases Completed" value={String(record.casesCompleted)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <Table className="min-w-[1500px]">
          <TableHeader>
            <TableRow className="bg-emerald-50/70">
              <TableHead>Provider</TableHead>
              <TableHead>MSO Time</TableHead>
              <TableHead>Quote Time</TableHead>
              <TableHead>Surgery Scheduling</TableHead>
              <TableHead>Admission Time</TableHead>
              <TableHead>Acceptance</TableHead>
              <TableHead>Case Success</TableHead>
              <TableHead>Coordinator Responsiveness</TableHead>
              <TableHead>Patient Satisfaction</TableHead>
              <TableHead>Commission Reliability</TableHead>
              <TableHead>Clinical Communication</TableHead>
              <TableHead>Treatment Strength</TableHead>
              <TableHead>Cases Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.performanceRecords.map((record) => (
              <TableRow key={record.providerId} className="cursor-pointer" onClick={() => onNavigate({ name: "hpn-provider-profile", providerId: record.providerId })}>
                <TableCell className="font-medium text-emerald-950">{providerName(data, record.providerId)}</TableCell>
                <TableCell>{record.averageMsoResponseTime}</TableCell>
                <TableCell>{record.averageQuoteResponseTime}</TableCell>
                <TableCell>{record.averageSurgerySchedulingTime}</TableCell>
                <TableCell>{record.averageAdmissionTime}</TableCell>
                <TableCell>{record.acceptanceRate}%</TableCell>
                <TableCell>{record.caseSuccessRate}%</TableCell>
                <TableCell>{record.coordinatorResponsiveness}%</TableCell>
                <TableCell>{record.patientSatisfaction}%</TableCell>
                <TableCell>{record.commissionReliability}%</TableCell>
                <TableCell>{record.clinicalCommunication}%</TableCell>
                <TableCell>{record.treatmentStrength}%</TableCell>
                <TableCell>{record.casesCompleted}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RelationshipManagement({ data, onNavigate }: { data: HpnData; onNavigate: (view: AppView) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Users />} label="Visits" value={data.relationshipActivities.filter((item) => item.type === "Visit").length} helper="Provider site relationship history" />
        <MetricCard icon={<Activity />} label="Meetings" value={data.relationshipActivities.filter((item) => item.type === "Meeting" || item.type === "Conference Meeting").length} helper="Formal and conference meetings" tone="info" />
        <MetricCard icon={<FilePlus2 />} label="Contracts" value={data.relationshipActivities.filter((item) => item.type === "Contract").length} helper="Commercial relationship records" tone="gold" />
        <MetricCard icon={<Network />} label="Avg Relationship Score" value={`${Math.round(data.relationshipActivities.reduce((sum, item) => sum + item.relationshipScore, 0) / data.relationshipActivities.length)}%`} helper="From local relationship activity" tone="success" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Relationship Management</CardTitle>
          <p className="text-sm text-muted-foreground">Visits, meetings, emails, conference meetings, contracts, operational notes, and important conversations.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1150px]">
              <TableHeader>
                <TableRow className="bg-emerald-50/70">
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Linked Case</TableHead>
                  <TableHead>Relationship Score</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.relationshipActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.date}</TableCell>
                    <TableCell className="font-medium text-emerald-950">{providerName(data, activity.providerId)}</TableCell>
                    <TableCell><Badge tone="info">{activity.type}</Badge></TableCell>
                    <TableCell>{activity.owner}</TableCell>
                    <TableCell className="max-w-96">{activity.summary}</TableCell>
                    <TableCell>{activity.linkedCase}</TableCell>
                    <TableCell><ScorePill value={activity.relationshipScore} /></TableCell>
                    <TableCell>
                      <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hpn-provider-profile", providerId: activity.providerId })}>Open profile</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddLightweightProvider() {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create Lightweight Provider</CardTitle>
          <p className="text-sm text-muted-foreground">No full provider database required. Start minimal and enrich from future cases.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {["Hospital Name", "Country", "City", "Treatment Area", "Primary Contact"].map((label) => (
            <label key={label} className="block">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <Input className="mt-1" placeholder={label} />
            </label>
          ))}
          <Button type="button">
            <FilePlus2 className="h-4 w-4" />
            Create Lightweight Provider
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>What Happens Next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Link the first Case to this provider.",
            "Add branch, department, physician, or coordinator only when evidence exists.",
            "Use referrals, MSO responses, quotes, outcomes, and notes to enrich the profile.",
            "Never overwrite provider history.",
          ].map((item) => (
            <div key={item} className="rounded-md border bg-emerald-50/50 p-3 text-sm text-emerald-950">{item}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function HpnActions({ onNavigate, providerId }: { onNavigate: (view: AppView) => void; providerId: string }) {
  const defaultCaseId = providerId === "prov-acibadem-maslak" ? "CASE-1002-ONCO" : providerId === "prov-acibadem-atasehir" ? "CASE-1011-ROBOTIC" : "CASE-1001-CARDIAC";
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => onNavigate({ name: "hpn-case-intelligence" })}><Link2 className="h-4 w-4" />Link Case to Existing Provider</Button>
      <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hpn-add-provider" })}><Plus className="h-4 w-4" />Create Lightweight Provider</Button>
      <Button variant="secondary" type="button"><UserPlus className="h-4 w-4" />Add Contact</Button>
      <Button variant="secondary" type="button"><Stethoscope className="h-4 w-4" />Add Physician</Button>
      <Button variant="secondary" type="button"><FilePlus2 className="h-4 w-4" />Add Relationship Note</Button>
      <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: defaultCaseId })}>Open Case Workspace</Button>
      <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "clinical-decision-dashboard" })}>Open Clinical Decision</Button>
      <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hospital-referrals" })}>Open Referral</Button>
      <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "operations-dashboard" })}>Open Patient Journey</Button>
      <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "operations-work-items" })}>Open Finance</Button>
    </div>
  );
}

function RelationshipNotes({ notes }: { notes: ProviderRelationshipNote[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relationship Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notes.length === 0 ? <EmptyState text="No relationship notes yet. Future cases should enrich this profile." /> : null}
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg border bg-white p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{note.date}</span>
              <span>|</span>
              <span>{note.author}</span>
              <Badge tone="info">{note.source}</Badge>
              <Badge tone="muted">{note.linkedCase}</Badge>
            </div>
            <p className="mt-2 text-sm text-emerald-950">{note.note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RelationshipActivityTimeline({ activities }: { activities: ProviderRelationshipActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">Relationship history is immutable and grows from real interactions.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? <EmptyState text="No relationship activity yet. Future Cases and provider interactions should create history." /> : null}
        {activities.map((activity) => (
          <div key={activity.id} className="border-l-2 border-emerald-200 pl-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{activity.date}</span>
              <Badge tone="info">{activity.type}</Badge>
              <Badge tone="muted">{activity.linkedCase}</Badge>
              <ScorePill value={activity.relationshipScore} />
            </div>
            <p className="mt-1 text-sm font-medium text-emerald-950">{activity.owner}</p>
            <p className="text-sm text-muted-foreground">{activity.summary}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LinkedCases({ intelligence, onNavigate }: { intelligence: CaseLinkedProviderIntelligence[]; onNavigate: (view: AppView) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Cases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {intelligence.length === 0 ? <EmptyState text="No linked cases yet. This provider should grow through future referrals." /> : null}
        {intelligence.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-emerald-950">{item.caseId}</p>
                <p className="text-sm text-muted-foreground">{item.patientName} | {item.treatment}</p>
              </div>
              <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: item.caseId })}>Open Case Workspace</Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.coordinatorNote}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EntityList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? <EmptyState text="Not yet enriched from cases." /> : null}
        {items.map((item) => (
          <div key={item} className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-emerald-950">{item}</div>
        ))}
      </CardContent>
    </Card>
  );
}

function MetricCard({ icon, label, value, helper, tone = "success" }: { icon: ReactNode; label: string; value: number | string; helper: string; tone?: "success" | "warning" | "info" | "gold" }) {
  const toneClass = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-sky-50 text-sky-700",
    gold: "bg-yellow-50 text-yellow-700",
  }[tone];

  return (
    <Card>
      <CardContent className="flex gap-4 p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-950">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Completeness({ value }: { value: number }) {
  return (
    <div className="min-w-36 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Completeness</span>
        <span className="font-medium text-emerald-950">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-emerald-950">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ScorePill({ value }: { value: number }) {
  const tone = value >= 80 ? "success" : value >= 70 ? "gold" : "warning";
  return <Badge tone={tone}>{value}%</Badge>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-emerald-950">{value}</p>
    </div>
  );
}

function HierarchyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-md border bg-slate-50 p-3 md:grid-cols-[180px_1fr]">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-emerald-950">{value}</p>
    </div>
  );
}

function ProviderTypeBadge({ type }: { type: ProviderOrganization["type"] }) {
  const tone = type === "Hospital Group" ? "gold" : type === "Hospital Branch" ? "success" : type === "Physician" ? "info" : "muted";
  return <Badge tone={tone}>{type}</Badge>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">{text}</div>;
}

function findPerformance(records: ProviderPerformanceRecord[], providerId: string) {
  return (
    records.find((record) => record.providerId === providerId) ?? {
      providerId,
      averageMsoResponseTime: "Not enough data",
      averageQuoteResponseTime: "Not enough data",
      averageSurgerySchedulingTime: "Not enough data",
      averageAdmissionTime: "Not enough data",
      acceptanceRate: 0,
      caseSuccessRate: 0,
      casesCompleted: 0,
      specialtyStrength: "Grows from cases",
      regionalResponsiveness: 0,
      coordinatorResponsiveness: 0,
      coordinatorReliability: 0,
      patientSatisfaction: 0,
      commissionReliability: 0,
      clinicalCommunication: 0,
      followUpQuality: 0,
      treatmentStrength: 0,
      evidenceCases: [],
    }
  );
}

function providerName(data: HpnData, providerId: string) {
  return data.providerOrganizations.find((provider) => provider.id === providerId)?.name ?? providerId;
}

function providerHasLanguage(data: HpnData, providerId: string, language: string) {
  return (
    data.physicians.some((item) => item.providerId === providerId && item.languages.includes(language)) ||
    data.regionalContacts.some((item) => item.providerId === providerId && item.languages.includes(language)) ||
    data.coordinators.some((item) => item.providerId === providerId && item.languages.includes(language))
  );
}

function averageHours(values: string[]) {
  const numeric = values
    .map((value) => Number.parseInt(value.replace(/[^0-9]/g, ""), 10))
    .filter((value) => Number.isFinite(value));
  if (numeric.length === 0) return 0;
  return Math.round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length);
}

function pageTitle(page: HpnPage) {
  const titles: Record<HpnPage, string> = {
    dashboard: "HPN Executive Dashboard",
    directory: "Provider Explorer",
    profile: "Provider Profile",
    "case-intelligence": "Case-Linked Provider Intelligence",
    "regional-contacts": "Regional Contacts",
    performance: "Provider Performance",
    "relationship-management": "Relationship Management",
    "add-provider": "Add Lightweight Provider",
  };
  return titles[page];
}

function currentPageName(page: HpnPage): AppView["name"] {
  const names: Record<HpnPage, AppView["name"]> = {
    dashboard: "hpn-dashboard",
    directory: "hpn-directory",
    profile: "hpn-provider-profile",
    "case-intelligence": "hpn-case-intelligence",
    "regional-contacts": "hpn-regional-contacts",
    performance: "hpn-performance",
    "relationship-management": "hpn-relationship-management",
    "add-provider": "hpn-add-provider",
  };
  return names[page];
}
