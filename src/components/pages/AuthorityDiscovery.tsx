import { BrainCircuit, Download, Search, Sparkles } from "lucide-react";
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
  AuthorityDiscoveryStatus,
  AuthorityImportSummary,
} from "../../types/authorityDiscovery";
import type { Organization, OrganizationCategory } from "../../types/organization";
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

export function AuthorityDiscovery({ organizations, onImport, onNavigate }: AuthorityDiscoveryProps) {
  const [parameters, setParameters] = useState<AuthorityDiscoveryParameters>({
    country: "Nigeria",
    category: "Teaching Hospitals",
    keyword: "Cancer",
    maximumResults: 25,
  });
  const [results, setResults] = useState<AuthorityDiscoveryResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<AuthorityDiscoveryHistoryItem[]>(() => getAuthorityDiscoveryHistory());
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<AuthorityImportSummary | null>(null);

  const selectedResults = useMemo(
    () => results.filter((result) => selectedIds.includes(result.id)),
    [results, selectedIds],
  );

  async function handleDiscovery() {
    setImportSummary(null);
    const discovery = await runAuthorityDiscovery(parameters);
    setResults(discovery.results);
    setHistory(discovery.history);
    setActiveHistoryId(discovery.historyItem.id);
    setSelectedIds([]);
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
      current.length === results.length ? [] : results.map((result) => result.id),
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
            Discover, qualify, and import authority targets into the existing AfraMedico Authority CRM.
          </p>
        </div>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "organizations" })}>
          Manage Authority CRM
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            Discovery Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-[180px_220px_1fr_160px_auto]">
            <Select
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
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={parameters.keyword}
                onChange={(event) => setParameters((current) => ({ ...current, keyword: event.target.value }))}
                placeholder="Keyword, e.g. Cancer"
              />
            </label>
            <Input
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
            <Button type="button" onClick={() => void handleDiscovery()}>
              Run Discovery
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-emerald-700" />
                Discovery Results
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Deterministic scoring placeholders. External discovery APIs can plug into this layer later.
              </p>
            </div>
            <Button disabled={selectedResults.length === 0} type="button" onClick={handleImport}>
              <Download className="h-4 w-4" />
              Import Selected
            </Button>
          </CardHeader>
          <CardContent>
            {importSummary ? (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Imported {importSummary.importedOrganizations} organization(s). Skipped {importSummary.duplicateOrganizations} duplicate(s).
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-[1500px]">
                <TableHeader>
                  <TableRow className="bg-emerald-50/70">
                    <TableHead>
                      <input
                        aria-label="Select all results"
                        checked={results.length > 0 && selectedIds.length === results.length}
                        type="checkbox"
                        onChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Authority Type</TableHead>
                    <TableHead>Authority Score</TableHead>
                    <TableHead>Referral Value</TableHead>
                    <TableHead>Backlink Value</TableHead>
                    <TableHead>Partnership Potential</TableHead>
                    <TableHead>Suggested Next Action</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-8 text-center text-sm text-muted-foreground" colSpan={13}>
                        Run discovery to generate AI-scored authority candidates.
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <input
                            aria-label={`Select ${result.organization}`}
                            checked={selectedIds.includes(result.id)}
                            disabled={result.status !== "New"}
                            type="checkbox"
                            onChange={() => toggleSelected(result.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-emerald-950">{result.organization}</TableCell>
                        <TableCell>{result.country}</TableCell>
                        <TableCell>{result.category}</TableCell>
                        <TableCell className="text-emerald-800">{result.website}</TableCell>
                        <TableCell>{result.contactEmail}</TableCell>
                        <TableCell>{result.authorityType}</TableCell>
                        <TableCell>
                          <Badge tone={result.authorityScore >= 85 ? "success" : result.authorityScore >= 70 ? "gold" : "muted"}>
                            {result.authorityScore}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ValueBadge value={result.referralValue} />
                        </TableCell>
                        <TableCell>
                          <ValueBadge value={result.backlinkValue} />
                        </TableCell>
                        <TableCell>
                          <ValueBadge value={result.partnershipPotential} />
                        </TableCell>
                        <TableCell className="max-w-96">{result.suggestedNextAction}</TableCell>
                        <TableCell>
                          <Badge tone={result.status === "Imported" ? "success" : result.status === "Duplicate" ? "warning" : "info"}>
                            {result.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
                      Keyword: {item.parameters.keyword || "Any"} · Max {item.parameters.maximumResults}
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

function ValueBadge({ value }: { value: "High" | "Medium" | "Low" }) {
  const tone = value === "High" ? "success" : value === "Medium" ? "gold" : "muted";
  return <Badge tone={tone}>{value}</Badge>;
}
