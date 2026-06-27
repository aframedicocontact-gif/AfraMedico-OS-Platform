import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import type { AppView } from "../../app/App";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type CsvImportProps = {
  onNavigate: (view: AppView) => void;
};

const expectedColumns = [
  "organization_name",
  "country",
  "category",
  "website",
  "contact_email",
  "priority",
  "status",
  "opportunity_type",
  "notes",
];

export function CsvImport({ onNavigate }: CsvImportProps) {
  return (
    <div className="space-y-5">
      <div>
        <Button
          variant="ghost"
          className="-ml-3 mb-2"
          type="button"
          onClick={() => onNavigate({ name: "organizations" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-sm font-medium text-primary">Bulk intake</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">CSV Import</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          CSV import will allow bulk upload of universities, hospitals, NGOs, media targets, and medical associations.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              Import Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-emerald-50/50 p-8 text-center">
              <div className="rounded-full bg-white p-4 text-emerald-800 shadow-sm">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-emerald-950">
                Upload flow placeholder
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No file is processed in Sprint 1. This screen validates the bulk-upload workflow and expected data shape before backend work begins.
              </p>
              <Button className="mt-5" type="button">
                Choose CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit border-yellow-200 bg-yellow-50/60">
          <CardHeader>
            <CardTitle>Expected Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expectedColumns.map((column) => (
              <div key={column} className="rounded-md border bg-white px-3 py-2 font-mono text-sm text-emerald-950">
                {column}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
