import { Download, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppView } from "../../app/App";
import {
  getAuthorityDiscoveryHistory,
  runAuthorityDiscovery,
  updateAuthorityDiscoveryImportCount,
} from "../../services/authorityDiscoveryService";
import { importAuthorityDiscoveryResults } from "../../services/authorityImportService";
import type {
  AuthorityDiscoveryHistoryItem,
  AuthorityDiscoveryParameters,
  AuthorityDiscoveryResult,
  AuthorityDiscoverySourceType,
  AuthorityDiscoveryStatus,
  AuthorityImportSummary,
} from "../../types/authorityDiscovery";
import type { Organization, OrganizationCategory } from "../../types/organization";
import { ExternalFieldLink } from "../common/ExternalFieldLink";
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
  TableScrollContainer,
} from "../ui/table";

type AuthorityDiscoveryProps = {
  organizations: Organization[];
  onImport: (organizations: Organization[]) => void;
  onNavigate: (view: AppView) => void;
};

const countries = ["Nigeria", "Ghana", "Kenya", "Uganda", "Tanzania", "South Africa"];
const categories: OrganizationCategory[] = [
  "Teaching Hospitals",
  "Medical Associations",
  "Universities",
  "NGOs",
  "News Media",
  "Health Blogs",
  "Business Directories",
];
const dataSources: AuthorityDiscoverySourceType[] = [
  "Curated Data",
  "CSV Imported Data",
  "Tavily Web Search",
];

export function AuthorityDiscovery({ organizations, onImport, onNavigate }: AuthorityDiscoveryProps) {
  const [parameters, setParameters] = useState<AuthorityDiscoveryParameters>({
    searchText: "",
    country: "Nigeria",
    category: "Teaching Hospitals",
    treatmentKeyword: "Cancer",
    maximumResults: 25,
    sourceType: "Curated Data",
    csvText: "",
  });
  const [results, setResults] = useState<AuthorityDiscoveryResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<AuthorityDiscoveryHistoryItem[]>(() => getAuthorityDiscoveryHistory());
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<AuthorityImportSummary | null>(null);
  const [discoveryError, setDiscoveryError] = useState("");

  const selectedResults = useMemo(
    () => results.filter((result) => selectedIds.includes(result.id)),
    [results, selectedIds],
  );
  const selectableResults = useMemo(
    () => results.filter((result) => result.status === "New"),
    [results],
  );

  async function handleDiscovery() {
    setImportSummary(null);
    setDiscoveryError("");
    const discovery = await runAuthorityDiscovery(parameters);
    setResults(discovery.results);
    setHistory(discovery.history);
    setActiveHistoryId(discovery.historyItem.id);
    setSelectedIds([]);
    setDiscoveryError(discovery.errorMessage);
  }

  function toggleSelected(resultId: string) {
    setSelectedIds((current) =>
      current.includes(resultId)
        ? current.filter((id) => id !== resultId)
        : [...current, resultId],
    );
  }

  function toggleAll() {
    setSelectedIds((current) =>
      current.length === selectableResults.length ? [] : selectableResults.map((result) => result.id),
    );
  }

  function handleImport() {
    const importResult = importAuthorityDiscoveryResults(organizations, selectedResults);
    const selectedIdSet = new Set(selectedResults.map((result) => result.id));
    const duplicateNameSet = new Set(importResult.summary.duplicateNames);
    const nextResults = results.map((result) =>
      selectedIdSet.has(result.id)
        ? {
            ...result,
            status: (duplicateNameSet.has(result.organization) ? "Duplicate" : "Imported") as AuthorityDiscoveryStatus,
          }
        : result,
    );

    setResults(nextResults);
    setSelectedIds([]);
    setImportSummary(importResult.summary);
    onImport(importResult.organizations);

    if (activeHistoryId) {
      setHistory(updateAuthorityDiscoveryImportCount(activeHistoryId, importResult.summary.importedOrganizations));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Authority CRM</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Authority Discovery</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Discover, qualify, and import real authority targets into the existing AfraMedico Authority CRM.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="success">Real Data Mode</Badge>
            <Badge tone="info">Source: {parameters.sourceType}</Badge>
          </div>
        </div>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "organizations" })}>
          Manage Authority CRM
        </Button>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        Curated and CSV discovery run locally. Tavily Web Search runs through the secure backend route and requires
        server-side Vercel environment variables. No AI scoring is used in this discovery foundation.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Discovery Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_160px_210px_1fr_150px_220px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={parameters.searchText}
                onChange={(event) => setParameters((current) => ({ ...current, searchText: event.target.value }))}
                placeholder="Search organization, website, source"
              />
            </label>
            <Select
              aria-label="Country"
              value={parameters.country}
              onChange={(event) => setParameters((current) => ({ ...current, country: event.target.value }))}
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Category"
              value={parameters.category}
              onChange={(event) =>
                setParameters((current) => ({
                  ...current,
                  category: event.target.value as OrganizationCategory,
                }))
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
            <Input
              aria-label="Treatment or keyword"
              value={parameters.treatmentKeyword}
              onChange={(event) => setParameters((current) => ({ ...current, treatmentKeyword: event.target.value }))}
              placeholder="Treatment / Keyword"
            />
            <Input
              aria-label="Maximum results"
              min={1}
              max={100}
              type="number"
              value={parameters.maximumResults}
              onChange={(event) =>
                setParameters((current) => ({
                  ...current,
                  maximumResults: Number(event.target.value),
                }))
              }
            />
            <Select
              aria-label="Data source"
              value={parameters.sourceType}
              onChange={(event) =>
                setParameters((current) => ({
                  ...current,
                  sourceType: event.target.value as AuthorityDiscoverySourceType,
                }))
              }
            >
              {dataSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
            <Button type="button" onClick={() => void handleDiscovery()}>
              Run Discovery
            </Button>
          </div>

          {parameters.sourceType === "CSV Imported Data" ? (
            <div className="mt-3">
              <label className="text-xs font-medium uppercase text-muted-foreground">
                CSV real-data input
              </label>
              <textarea
                className="mt-2 min-h-28 w-full rounded-md border p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="organization_name,country,category,website,contact_email,linkedin,tags"
                value={parameters.csvText}
                onChange={(event) => setParameters((current) => ({ ...current, csvText: event.target.value }))}
              />
            </div>
          ) : null}

          {parameters.sourceType === "Tavily Web Search" ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Tavily Web Search uses POST /api/authority-discovery/search. If server-side provider keys are missing,
              discovery will return a configuration error instead of fake results.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Discovery Results</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Real search results require human verification before outreach. No authority, backlink, or referral value is estimated here.
              </p>
            </div>
          </CardHeader>
          <CardContent className="min-w-0">
            {importSummary ? (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Imported {importSummary.importedOrganizations} organizations. Skipped{" "}
                {importSummary.duplicateOrganizations} duplicates.
              </div>
            ) : null}
            {discoveryError ? (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {discoveryError}
              </div>
            ) : null}
            <div className="mb-3 flex flex-col gap-2 rounded-md border bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedResults.length} selected from {selectableResults.length} import-ready results.
              </div>
              <Button disabled={selectedResults.length === 0} type="button" onClick={handleImport}>
                <Download className="h-4 w-4" />
                Import Selected
              </Button>
            </div>
            <TableScrollContainer className="w-full shadow-none">
              <Table className="min-w-[2360px] table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="bg-emerald-50/70">
                    <TableHead className="w-[56px] min-w-[56px] bg-emerald-50">
                      <input
                        aria-label="Select all results"
                        checked={selectableResults.length > 0 && selectedIds.length === selectableResults.length}
                        type="checkbox"
                        onChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="w-[260px] min-w-[260px] bg-emerald-50">Organization</TableHead>
                    <TableHead className="w-[140px] min-w-[140px] bg-emerald-50">Country</TableHead>
                    <TableHead className="w-[200px] min-w-[200px] bg-emerald-50">Category</TableHead>
                    <TableHead className="w-[180px] min-w-[180px] bg-emerald-50">Website</TableHead>
                    <TableHead className="w-[220px] min-w-[220px] bg-emerald-50">Source URL</TableHead>
                    <TableHead className="w-[260px] min-w-[260px] bg-emerald-50">Snippet</TableHead>
                    <TableHead className="w-[180px] min-w-[180px] bg-emerald-50">LinkedIn</TableHead>
                    <TableHead className="w-[220px] min-w-[220px] bg-emerald-50">Email</TableHead>
                    <TableHead className="w-[180px] min-w-[180px] bg-emerald-50">Raw Search Source</TableHead>
                    <TableHead className="w-[170px] min-w-[170px] bg-emerald-50">Verification Status</TableHead>
                    <TableHead className="w-[240px] min-w-[240px] bg-emerald-50">Suggested Next Step</TableHead>
                    <TableHead className="w-[120px] min-w-[120px] bg-emerald-50">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-8 text-center text-sm text-muted-foreground" colSpan={13}>
                        No real organizations found in configured sources. Import CSV or configure a real search provider.
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="w-[56px] min-w-[56px]">
                          <input
                            aria-label={`Select ${result.organization}`}
                            checked={selectedIds.includes(result.id)}
                            disabled={result.status !== "New"}
                            type="checkbox"
                            onChange={() => toggleSelected(result.id)}
                          />
                        </TableCell>
                        <TableCell className="w-[260px] min-w-[260px] font-medium text-emerald-950">
                          {result.organization}
                        </TableCell>
                        <TableCell className="w-[140px] min-w-[140px]">{result.country}</TableCell>
                        <TableCell className="w-[200px] min-w-[200px]">{result.category}</TableCell>
                        <TableCell className="w-[180px] min-w-[180px]">
                          <ExternalFieldLink type="website" value={result.website} />
                        </TableCell>
                        <TableCell className="w-[220px] min-w-[220px]">
                          <ExternalFieldLink type="website" value={result.sourceUrl || result.website} />
                        </TableCell>
                        <TableCell className="w-[260px] min-w-[260px] break-words text-sm text-muted-foreground">
                          {result.snippet || "Not found"}
                        </TableCell>
                        <TableCell className="w-[180px] min-w-[180px]">
                          <ExternalFieldLink type="linkedin" value={result.linkedin} />
                        </TableCell>
                        <TableCell className="w-[220px] min-w-[220px]">
                          <ExternalFieldLink type="email" value={result.contactEmail} />
                        </TableCell>
                        <TableCell className="w-[180px] min-w-[180px]">
                          <div className="font-medium">{result.sourceType}</div>
                          <div className="text-xs text-muted-foreground">{result.rawSearchSource || result.sourceNote}</div>
                        </TableCell>
                        <TableCell className="w-[170px] min-w-[170px]">
                          <Badge tone={result.confidence === "Verified" ? "success" : result.confidence === "Needs verification" ? "warning" : "muted"}>
                            {result.confidence}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[240px] min-w-[240px] break-words">{result.suggestedNextAction}</TableCell>
                        <TableCell className="w-[120px] min-w-[120px]">
                          <Badge tone={result.status === "Imported" ? "success" : result.status === "Duplicate" ? "warning" : "info"}>
                            {result.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableScrollContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discovery History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No discovery runs yet.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="rounded-md border bg-slate-50 p-3 text-sm">
                    <div className="font-medium text-emerald-950">
                      {item.parameters.country} / {item.parameters.category}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      Search: {item.parameters.searchText || "Any"} - Treatment: {item.parameters.treatmentKeyword || "Any"} - Max{" "}
                      {item.parameters.maximumResults}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.parameters.sourceType}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone="info">{item.resultCount} results</Badge>
                      <Badge tone={item.importedCount > 0 ? "success" : "muted"}>{item.importedCount} imported</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.searchedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
