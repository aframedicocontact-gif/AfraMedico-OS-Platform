import {
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  canSendProspectInvitation,
  importPartnerProspects,
  isDoNotContactProspect,
  listPartnerProspects,
  normalizePartnerProspectCampaignGroup,
  parsePartnerProspectWorkbook,
  sendPartnerProspectInvitations,
  sendPartnerProspectTestPreview,
} from "../../services/partnerProspectService";
import { renderPartnerProspectEmail } from "../../services/partnerProspectEmailTemplates";
import type {
  PartnerProspect,
  PartnerProspectImportPreview,
  PartnerProspectImportSummary,
  PartnerProspectSendResult,
} from "../../types/partnerProspect";
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

const campaignFilters = [
  "All campaign groups",
  "Executive Invitation",
  "Professional Invitation",
  "Standard Invitation",
  "Talent Pool (Do Not Contact)",
];

const statusFilters = ["All statuses", "new", "email_sent", "applied", "approved", "active", "declined", "held"];

function formatDate(value: string | null) {
  if (!value) return "Not sent";
  return new Date(value).toLocaleString();
}

function normalize(value: string | null | undefined) {
  return (value ?? "").replace(/[\u2013\u2014]/g, "-").trim().toLowerCase();
}

function prospectCampaign(prospect: PartnerProspect) {
  return normalizePartnerProspectCampaignGroup(prospect.email_campaign_group || "Standard Invitation");
}

function badgeToneForStatus(status: PartnerProspect["outreach_status"]) {
  if (status === "email_sent" || status === "applied" || status === "approved" || status === "active") return "success";
  if (status === "held") return "warning";
  if (status === "declined") return "danger";
  return "info";
}

export function PartnerAcquisitionPipeline() {
  const [prospects, setProspects] = useState<PartnerProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PartnerProspectImportPreview | null>(null);
  const [importSummary, setImportSummary] = useState<PartnerProspectImportSummary | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("All campaign groups");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [previewProspect, setPreviewProspect] = useState<PartnerProspect | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sendResult, setSendResult] = useState<PartnerProspectSendResult | null>(null);
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendError, setSendError] = useState("");

  async function loadProspects() {
    setLoading(true);
    setError("");
    const result = await listPartnerProspects();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setProspects([]);
      return;
    }
    setProspects(result.data ?? []);
  }

  useEffect(() => {
    void loadProspects();
  }, []);

  const priorityOptions = useMemo(() => {
    const values = new Set(prospects.map((prospect) => prospect.contact_priority).filter(Boolean) as string[]);
    return ["All priorities", ...Array.from(values).sort()];
  }, [prospects]);

  const filteredProspects = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return prospects.filter((prospect) => {
      const searchable = [
        prospect.full_name,
        prospect.email,
        prospect.country,
        prospect.profession,
        prospect.recommended_role,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm || searchable.includes(searchTerm);
      const matchesCampaign =
        campaignFilter === "All campaign groups" || normalize(prospectCampaign(prospect)) === normalize(campaignFilter);
      const matchesPriority =
        priorityFilter === "All priorities" || normalize(prospect.contact_priority) === normalize(priorityFilter);
      const matchesStatus = statusFilter === "All statuses" || prospect.outreach_status === statusFilter;

      return matchesSearch && matchesCampaign && matchesPriority && matchesStatus;
    });
  }, [campaignFilter, priorityFilter, prospects, search, statusFilter]);

  const selectedProspects = useMemo(
    () => prospects.filter((prospect) => selectedIds.includes(prospect.id)),
    [prospects, selectedIds],
  );

  const sendableSelected = useMemo(
    () => selectedProspects.filter(canSendProspectInvitation).slice(0, 20),
    [selectedProspects],
  );

  const excludedSelected = selectedProspects.filter((prospect) => !canSendProspectInvitation(prospect));
  const alreadySentSelected = selectedProspects.filter((prospect) => prospect.outreach_status === "email_sent");
  const doNotContactSelected = selectedProspects.filter(isDoNotContactProspect);

  function toggleSelected(id: string) {
    const prospect = prospects.find((item) => item.id === id);
    if (prospect && isDoNotContactProspect(prospect)) return;

    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAllFiltered() {
    const filteredIds = filteredProspects
      .filter((prospect) => !isDoNotContactProspect(prospect))
      .map((prospect) => prospect.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : Array.from(new Set([...current, ...filteredIds])),
    );
  }

  async function handleWorkbookUpload(file: File | null) {
    setPreview(null);
    setImportSummary(null);
    setError("");
    if (!file) return;

    try {
      const nextPreview = await parsePartnerProspectWorkbook(file, prospects);
      setPreview(nextPreview);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to read workbook.");
    }
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    setError("");
    const result = await importPartnerProspects(preview.importableRecords);
    setImporting(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Unable to import partner prospects.");
      return;
    }
    setImportSummary(result.data);
    setPreview(null);
    await loadProspects();
  }

  async function handleSendTest() {
    const prospect = sendableSelected[0];
    if (!prospect) return;

    setSendingTest(true);
    setSendError("");
    setSendResult(null);
    const result = await sendPartnerProspectTestPreview({
      prospectIds: [prospect.id],
      testEmail,
    });
    setSendingTest(false);
    if (result.error || !result.data) {
      setSendError(result.error ?? "Test email action failed.");
      return;
    }
    setSendResult(result.data);
  }

  async function handleSendInvitations(prospectIds: string[]) {
    setSendingInvitations(true);
    setSendError("");
    setSendResult(null);
    const result = await sendPartnerProspectInvitations({ prospectIds });
    setSendingInvitations(false);
    if (result.error || !result.data) {
      setSendError(result.error ?? "Invitation action failed.");
      return;
    }
    setSendResult(result.data);
    await loadProspects();
  }

  const previewEmail = previewProspect ? renderPartnerProspectEmail(previewProspect) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Referral Partner CRM</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Partner Acquisition Pipeline</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Import evaluated partner prospects, review campaign assignment, and send approved invitation emails.
          </p>
        </div>
        <Button variant="secondary" type="button" onClick={() => void loadProspects()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              Import Partner Prospects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-slate-50 p-4 text-sm text-muted-foreground">
              Upload AfraMedico_Partner_Prospects_Master V2.0.xlsx. The importer reads the All Candidates
              sheet and uses email as the duplicate check.
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center hover:bg-emerald-50">
              <Upload className="h-6 w-6 text-emerald-700" />
              <span className="mt-2 text-sm font-medium text-emerald-950">Choose Excel workbook</span>
              <span className="mt-1 text-xs text-muted-foreground">.xlsx only, no invitation date required</span>
              <input
                accept=".xlsx,.xls"
                className="sr-only"
                type="file"
                onChange={(event) => void handleWorkbookUpload(event.target.files?.[0] ?? null)}
              />
            </label>

            {preview ? (
              <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
                <PreviewMetric label="Total rows" value={preview.totalRows} />
                <PreviewMetric label="Valid records" value={preview.validRecords} />
                <PreviewMetric label="Duplicates" value={preview.duplicateRecords} />
                <PreviewMetric label="Missing email" value={preview.missingEmailRecords} />
                <PreviewMetric label="Cannot import" value={preview.invalidRecords} />
                <div className="sm:col-span-2 xl:col-span-5">
                  <Button disabled={importing || preview.validRecords === 0} type="button" onClick={() => void handleImport()}>
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Import {preview.validRecords} Records
                  </Button>
                </div>
                {preview.invalidReasons.length > 0 ? (
                  <div className="max-h-28 overflow-y-auto rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2 xl:col-span-5">
                    {preview.invalidReasons.slice(0, 12).map((reason) => (
                      <p key={reason}>{reason}</p>
                    ))}
                    {preview.invalidReasons.length > 12 ? <p>Additional skipped rows hidden.</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {importSummary ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Imported {importSummary.imported} prospects. Skipped {importSummary.skipped}. Duplicate records were ignored before import.
              </div>
            ) : null}

            {error ? (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Send Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SafetyLine label="Selected" value={selectedProspects.length} />
            <SafetyLine label="Ready to send" value={sendableSelected.length} />
            <SafetyLine label="Excluded" value={excludedSelected.length} />
            <SafetyLine label="Already sent warnings" value={alreadySentSelected.length} />
            <SafetyLine label="Talent Pool excluded" value={doNotContactSelected.length} />
            <Input
              placeholder="Send test email to admin address"
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
            />
            <div className="flex flex-wrap gap-5">
              <Button
                disabled={sendingTest || sendingInvitations || sendableSelected.length === 0 || !testEmail.trim()}
                type="button"
                variant="secondary"
                onClick={() => void handleSendTest()}
              >
                {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send Test
              </Button>
              <Button
                disabled={sendingInvitations || sendingTest || sendableSelected.length === 0 || sendableSelected.length > 20}
                type="button"
                onClick={() => void handleSendInvitations(sendableSelected.map((prospect) => prospect.id))}
              >
                {sendingInvitations ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Selected
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Bulk sends are capped at 20 recipients. Talent Pool (Do Not Contact) records are disabled for selection
              and never sent by this action.
            </p>
            {sendResult ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                Sent {sendResult.sent}. Failed {sendResult.failed}. Excluded {sendResult.excluded}. Duplicate warnings {sendResult.duplicateWarnings}.
                {sendResult.failedReasons?.length ? (
                  <div className="mt-2 space-y-1 text-xs text-amber-900">
                    {sendResult.failedReasons.map((reason) => (
                      <p key={reason}>{reason}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {sendError ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">{sendError}</div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prospect Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 lg:grid-cols-[1.4fr_240px_180px_180px]">
            <Input
              placeholder="Search name, email, country, profession"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}>
              {campaignFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </Select>
            <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              {priorityOptions.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </Select>
          </div>

          <div className="mb-3 flex flex-col gap-2 rounded-md border bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedProspects.length} selected from {filteredProspects.length} visible prospects.
            </p>
            <Button variant="secondary" type="button" onClick={toggleAllFiltered}>
              Select Visible
            </Button>
          </div>

          <TableScrollContainer className="max-h-[620px]">
            <Table className="min-w-[1840px] table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow className="bg-emerald-50/70">
                  <TableHead className="w-[56px] bg-emerald-50">Select</TableHead>
                  <TableHead className="w-[220px] bg-emerald-50">Candidate</TableHead>
                  <TableHead className="w-[240px] bg-emerald-50">Email</TableHead>
                  <TableHead className="w-[150px] bg-emerald-50">Country</TableHead>
                  <TableHead className="w-[220px] bg-emerald-50">Profession</TableHead>
                  <TableHead className="w-[260px] bg-emerald-50">Recommended Role</TableHead>
                  <TableHead className="w-[120px] bg-emerald-50">Score</TableHead>
                  <TableHead className="w-[210px] bg-emerald-50">Campaign Group</TableHead>
                  <TableHead className="w-[150px] bg-emerald-50">Priority</TableHead>
                  <TableHead className="w-[150px] bg-emerald-50">Status</TableHead>
                  <TableHead className="w-[190px] bg-emerald-50">Invitation Sent</TableHead>
                  <TableHead className="w-[170px] bg-emerald-50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                      Loading partner prospects...
                    </TableCell>
                  </TableRow>
                ) : filteredProspects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                      No partner prospects found. Import the workbook to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProspects.map((prospect) => (
                    <TableRow key={prospect.id}>
                      <TableCell>
                        <input
                          aria-label={`Select ${prospect.full_name}`}
                          checked={selectedIds.includes(prospect.id)}
                          disabled={isDoNotContactProspect(prospect)}
                          type="checkbox"
                          onChange={() => toggleSelected(prospect.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-emerald-950">{prospect.full_name}</TableCell>
                      <TableCell>
                        <a className="text-emerald-700 hover:underline" href={`mailto:${prospect.email}`}>
                          {prospect.email}
                        </a>
                      </TableCell>
                      <TableCell>{prospect.country || "Not found"}</TableCell>
                      <TableCell className="break-words">{prospect.profession || "Not found"}</TableCell>
                      <TableCell className="break-words">{prospect.recommended_role || "Not found"}</TableCell>
                      <TableCell>{prospect.overall_suitability_score ?? "Not scored"}</TableCell>
                      <TableCell>
                        <Badge tone={isDoNotContactProspect(prospect) ? "warning" : "info"}>
                          {prospectCampaign(prospect)}
                        </Badge>
                      </TableCell>
                      <TableCell>{prospect.contact_priority || "Unassigned"}</TableCell>
                      <TableCell>
                        <Badge tone={badgeToneForStatus(prospect.outreach_status)}>
                          {prospect.outreach_status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(prospect.invitation_sent_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" type="button" onClick={() => setPreviewProspect(prospect)}>
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                          <Button
                            disabled={!canSendProspectInvitation(prospect) || sendingInvitations || sendingTest}
                            type="button"
                            onClick={() => void handleSendInvitations([prospect.id])}
                          >
                            Send
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableScrollContainer>
        </CardContent>
      </Card>

      {previewProspect && previewEmail ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Email Preview: {previewProspect.full_name}</CardTitle>
              <Button variant="secondary" type="button" onClick={() => setPreviewProspect(null)}>
                Close Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-slate-50 p-3 text-sm">
              <p className="font-medium text-emerald-950">Subject</p>
              <p className="mt-1">{previewEmail.subject}</p>
            </div>
            <div className="rounded-md border bg-slate-50 p-3 text-sm">
              <p className="font-medium text-emerald-950">Preview text</p>
              <p className="mt-1">{previewEmail.previewText}</p>
            </div>
            <div className="rounded-md border bg-slate-50 p-3 text-sm">
              <p className="font-medium text-emerald-950">Personalization variables</p>
              <p className="mt-1">{previewEmail.variablesUsed.join(", ") || "None"}</p>
            </div>
            <iframe
              className="h-[520px] w-full rounded-lg border bg-white"
              title="Partner prospect email preview"
              srcDoc={previewEmail.html}
            />
            <div className="rounded-md border bg-white p-3 text-sm">
              <p className="font-medium text-emerald-950">Plain-text body</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">
                {previewEmail.text}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function SafetyLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-emerald-950">{value}</span>
    </div>
  );
}
