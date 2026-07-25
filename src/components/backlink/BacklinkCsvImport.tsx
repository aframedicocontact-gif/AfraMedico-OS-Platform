import { FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Organization, OrganizationCategory } from "../../types/organization";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableScrollContainer } from "../ui/table";

type CsvField =
  | "organization_name"
  | "organization_type"
  | "country"
  | "website"
  | "contact_name"
  | "contact_email"
  | "contact_role"
  | "notes";

type CsvRow = Record<string, string>;
type DuplicateMode = "skip" | "import";

type PreviewRow = {
  rowNumber: number;
  organization: Organization;
  duplicate: boolean;
  invalid: boolean;
  reason: string;
};

type ImportResult = {
  imported: number;
  skipped: number;
  duplicates: number;
  invalidRows: number;
};

type BacklinkCsvImportProps = {
  existingOrganizations: Organization[];
  onImport: (organizations: Organization[], result: ImportResult) => void;
};

const csvFields: Array<{ key: CsvField; label: string; required?: boolean }> = [
  { key: "organization_name", label: "Organization Name", required: true },
  { key: "organization_type", label: "Organization Type" },
  { key: "country", label: "Country" },
  { key: "website", label: "Website" },
  { key: "contact_name", label: "Contact Name" },
  { key: "contact_email", label: "Contact Email" },
  { key: "contact_role", label: "Contact Role" },
  { key: "notes", label: "Notes" },
];

const fieldAliases: Record<CsvField, string[]> = {
  organization_name: ["organization_name", "organization name", "organization", "name", "company", "institution"],
  organization_type: ["organization_type", "organization type", "type", "category"],
  country: ["country", "market", "location"],
  website: ["website", "url", "site", "domain"],
  contact_name: ["contact_name", "contact name", "contact", "person"],
  contact_email: ["contact_email", "contact email", "email", "email address"],
  contact_role: ["contact_role", "contact role", "role", "position", "title"],
  notes: ["notes", "note", "description", "comments"],
};

const categoryFallback: OrganizationCategory = "Business Directories";
const categoryMap: Record<string, OrganizationCategory> = {
  "business directories": "Business Directories",
  directory: "Business Directories",
  directories: "Business Directories",
  "health blogs": "Health Blogs",
  blog: "Health Blogs",
  media: "News Media",
  "news media": "News Media",
  ngo: "NGOs",
  ngos: "NGOs",
  association: "Medical Associations",
  "medical association": "Medical Associations",
  "medical associations": "Medical Associations",
  hospital: "Teaching Hospitals",
  "teaching hospital": "Teaching Hospitals",
  "teaching hospitals": "Teaching Hospitals",
  university: "Universities",
  universities: "Universities",
};

export function BacklinkCsvImport({ existingOrganizations, onImport }: BacklinkCsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Record<CsvField, string>>(() => createEmptyMapping());
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const previewRows = useMemo(
    () => buildPreviewRows(rows, mapping, existingOrganizations),
    [existingOrganizations, mapping, rows],
  );

  const summary = useMemo(
    () => ({
      importedReady: previewRows.filter((row) => !row.invalid && (!row.duplicate || duplicateMode === "import")).length,
      skipped: previewRows.filter((row) => row.invalid || (row.duplicate && duplicateMode === "skip")).length,
      duplicates: previewRows.filter((row) => row.duplicate).length,
      invalidRows: previewRows.filter((row) => row.invalid).length,
    }),
    [duplicateMode, previewRows],
  );

  async function handleFile(file: File | undefined) {
    setResult(null);
    setParseError("");
    if (!file) return;
    setFileName(file.name);

    try {
      const parsed = parseCsv(await file.text());
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMapHeaders(parsed.headers));
    } catch (error) {
      setHeaders([]);
      setRows([]);
      setMapping(createEmptyMapping());
      setParseError(error instanceof Error ? error.message : "CSV could not be parsed.");
    }
  }

  function handleImport() {
    const imported = previewRows
      .filter((row) => !row.invalid)
      .filter((row) => duplicateMode === "import" || !row.duplicate)
      .map((row) => row.organization);

    const nextResult = {
      imported: imported.length,
      skipped: previewRows.length - imported.length,
      duplicates: summary.duplicates,
      invalidRows: summary.invalidRows,
    };

    onImport(imported, nextResult);
    setResult(nextResult);
  }

  return (
    <Card className="border-emerald-100 bg-emerald-50/30">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            Import Campaign Organizations
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              accept=".csv,text/csv"
              className="hidden"
              type="file"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <Button variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Select value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value as DuplicateMode)}>
              <option value="skip">Skip duplicates</option>
              <option value="import">Import duplicates</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload CSV targets for the selected campaign. Required field: organization_name. Emails are not sent.
        </p>

        {fileName ? <p className="text-sm font-medium text-emerald-950">Selected file: {fileName}</p> : null}
        {parseError ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{parseError}</div> : null}

        {headers.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {csvFields.map((field) => (
              <label key={field.key} className="space-y-1.5">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {field.label}{field.required ? " *" : ""}
                </span>
                <Select
                  value={mapping[field.key]}
                  onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}
                >
                  <option value="">Not mapped</option>
                  {headers.map((header) => (
                    <option key={`${field.key}-${header}`} value={header}>{header}</option>
                  ))}
                </Select>
              </label>
            ))}
          </div>
        ) : null}

        {previewRows.length > 0 ? (
          <>
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <Summary label="Ready" value={summary.importedReady} />
              <Summary label="Skipped" value={summary.skipped} />
              <Summary label="Duplicates" value={summary.duplicates} />
              <Summary label="Invalid rows" value={summary.invalidRows} />
            </div>
            <TableScrollContainer>
              <Table className="min-w-[1040px] table-fixed">
                <TableHeader>
                  <TableRow className="bg-emerald-50/70">
                    <TableHead className="w-[80px]">Row</TableHead>
                    <TableHead className="w-[260px]">Organization</TableHead>
                    <TableHead className="w-[180px]">Type</TableHead>
                    <TableHead className="w-[160px]">Country</TableHead>
                    <TableHead className="w-[220px]">Website</TableHead>
                    <TableHead className="w-[220px]">Email</TableHead>
                    <TableHead className="w-[180px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.slice(0, 25).map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="font-medium text-emerald-950">{row.organization.name || "Missing"}</TableCell>
                      <TableCell>{row.organization.organizationType || row.organization.category}</TableCell>
                      <TableCell>{row.organization.country || "Not found"}</TableCell>
                      <TableCell>{row.organization.website || "Not found"}</TableCell>
                      <TableCell>{row.organization.email || "Not found"}</TableCell>
                      <TableCell>
                        <span className={row.invalid ? "text-red-700" : row.duplicate ? "text-amber-700" : "text-emerald-700"}>
                          {row.reason}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollContainer>
            {previewRows.length > 25 ? <p className="text-xs text-muted-foreground">Preview shows first 25 rows only.</p> : null}
            <Button disabled={summary.importedReady === 0} type="button" onClick={handleImport}>
              Import {summary.importedReady} Organizations
            </Button>
          </>
        ) : null}

        {result ? (
          <div className="rounded-md border border-emerald-200 bg-white p-3 text-sm text-emerald-900">
            Imported {result.imported}. Skipped {result.skipped}. Duplicates {result.duplicates}. Invalid rows {result.invalidRows}.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function createEmptyMapping(): Record<CsvField, string> {
  return {
    organization_name: "",
    organization_type: "",
    country: "",
    website: "",
    contact_name: "",
    contact_email: "",
    contact_role: "",
    notes: "",
  };
}

function autoMapHeaders(headers: string[]): Record<CsvField, string> {
  const mapping = createEmptyMapping();
  csvFields.forEach((field) => {
    mapping[field.key] = headers.find((header) => fieldAliases[field.key].includes(normalizeHeader(header))) ?? "";
  });
  return mapping;
}

function buildPreviewRows(
  rows: CsvRow[],
  mapping: Record<CsvField, string>,
  existingOrganizations: Organization[],
): PreviewRow[] {
  const existingNames = new Set(existingOrganizations.map((organization) => normalizeValue(organization.name)).filter(Boolean));
  const existingWebsites = new Set(existingOrganizations.map((organization) => normalizeWebsite(organization.website)).filter(Boolean));
  const previewNames = new Set<string>();
  const previewWebsites = new Set<string>();

  return rows
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => Object.values(row).some((value) => value.trim()))
    .map(({ row, rowNumber }) => {
      const name = readMappedValue(row, mapping.organization_name);
      const website = readMappedValue(row, mapping.website);
      const category = normalizeCategory(readMappedValue(row, mapping.organization_type));
      const organization: Organization = {
        id: `csv-campaign-org-${Date.now()}-${rowNumber}`,
        name,
        country: readMappedValue(row, mapping.country),
        category,
        status: "research",
        priority: "medium",
        owner: "Backlink Campaign",
        contactName: readMappedValue(row, mapping.contact_name) || "To verify",
        email: readMappedValue(row, mapping.contact_email) || "Not found",
        website,
        linkedin: "",
        opportunityType: "Backlink",
        domainRating: 0,
        nextStep: "Review imported campaign target and prepare outreach.",
        nextFollowUp: new Date().toISOString().slice(0, 10),
        notes: [
          readMappedValue(row, mapping.notes),
          readMappedValue(row, mapping.contact_role) ? `Contact role: ${readMappedValue(row, mapping.contact_role)}.` : "",
          "Imported from Backlink Campaign CSV.",
        ].filter(Boolean).join(" "),
        organizationType: readMappedValue(row, mapping.organization_type),
        activity: [
          {
            date: new Date().toISOString().slice(0, 10),
            title: "Imported from Backlink Campaign CSV",
            detail: "Added to campaign organization table from user-uploaded CSV.",
          },
        ],
      };

      const normalizedName = normalizeValue(name);
      const normalizedWebsite = normalizeWebsite(website);
      const duplicate = Boolean(
        normalizedName && (existingNames.has(normalizedName) || previewNames.has(normalizedName)) ||
        normalizedWebsite && (existingWebsites.has(normalizedWebsite) || previewWebsites.has(normalizedWebsite)),
      );
      const invalid = !name.trim();

      if (normalizedName) previewNames.add(normalizedName);
      if (normalizedWebsite) previewWebsites.add(normalizedWebsite);

      return {
        rowNumber,
        organization,
        duplicate,
        invalid,
        reason: invalid ? "Invalid: organization_name required" : duplicate ? "Duplicate" : "Ready",
      };
    });
}

function readMappedValue(row: CsvRow, header: string) {
  return header ? row[header]?.trim() ?? "" : "";
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeWebsite(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function normalizeCategory(value: string): OrganizationCategory {
  return categoryMap[normalizeHeader(value)] ?? categoryFallback;
}

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = parseCsvLines(text);
  if (lines.length === 0) throw new Error("CSV file is empty.");
  const headers = lines[0].map((header) => header.trim()).filter(Boolean);
  if (headers.length === 0) throw new Error("CSV header row is empty.");

  const rows = lines.slice(1).map((line) =>
    headers.reduce<CsvRow>((record, header, index) => {
      record[header] = line[index] ?? "";
      return record;
    }, {}),
  );

  return { headers, rows };
}

function parseCsvLines(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows.filter((items) => items.some((item) => item.trim()));
}
