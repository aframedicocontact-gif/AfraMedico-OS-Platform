import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import type { PatientCase } from "../../types/case";

type CaseDocumentsPanelProps = {
  patientCase: PatientCase;
};

export function CaseDocumentsPanel({ patientCase }: CaseDocumentsPanelProps) {
  const documents = [
    { name: "Passport", status: "pending" },
    { name: `${patientCase.specialty ?? "Medical"} report`, status: patientCase.status === "waiting_documents" ? "missing" : "received" },
    { name: "Clinical summary", status: patientCase.current_stage === "Clinical Decision" ? "in review" : "pending" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {documents.map((document) => (
          <div key={document.name} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <FileText className="h-4 w-4 text-emerald-700" />
              <Badge tone={document.status === "received" ? "success" : document.status === "missing" ? "danger" : "warning"}>
                {document.status}
              </Badge>
            </div>
            <p className="mt-3 font-medium">{document.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Document tracking placeholder. No upload writes are enabled.</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
