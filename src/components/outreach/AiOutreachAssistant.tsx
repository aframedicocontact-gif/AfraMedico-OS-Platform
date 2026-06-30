import { Eraser, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  clearStoredOutreachDrafts,
  emptyOutreachDrafts,
  generateOutreachDrafts,
  getStoredOutreachDrafts,
  saveStoredOutreachDrafts,
  type OutreachDraftKind,
  type OutreachDrafts,
} from "../../services/aiOutreachAssistantService";
import type { Organization } from "../../types/organization";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type AiOutreachAssistantProps = {
  organization: Organization;
};

const draftFields: Array<{ key: OutreachDraftKind; label: string; helper: string }> = [
  {
    key: "professionalEmail",
    label: "Professional Email",
    helper: "Formal authority-building outreach for institutional contacts.",
  },
  {
    key: "linkedinMessage",
    label: "LinkedIn Message",
    helper: "Short first-touch message for professional networking.",
  },
  {
    key: "whatsappMessage",
    label: "WhatsApp Message",
    helper: "Concise mobile-friendly outreach draft.",
  },
  {
    key: "meetingRequest",
    label: "Meeting Request",
    helper: "Direct meeting invitation with a clear agenda.",
  },
  {
    key: "followUpEmail",
    label: "Follow-up Email",
    helper: "Polite follow-up after no response or after first contact.",
  },
];

export function AiOutreachAssistant({ organization }: AiOutreachAssistantProps) {
  const [drafts, setDrafts] = useState<OutreachDrafts>(emptyOutreachDrafts);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    const stored = getStoredOutreachDrafts(organization.id);
    setDrafts(stored?.drafts ?? emptyOutreachDrafts);
    setUpdatedAt(stored?.updatedAt ?? "");
    setStatus(stored ? "Stored drafts loaded for this organization." : "");
    setError("");
  }, [organization.id]);

  function updateDraft(key: OutreachDraftKind, value: string) {
    setDrafts((current) => ({ ...current, [key]: value }));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setStatus("");

    const result = await generateOutreachDrafts(organization);
    setIsGenerating(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const record = saveStoredOutreachDrafts(organization, result.drafts);
    setDrafts(result.drafts);
    setUpdatedAt(record.updatedAt);
    setStatus("AI drafts generated and stored. Review and edit before use.");
  }

  function handleSave() {
    const record = saveStoredOutreachDrafts(organization, drafts);
    setUpdatedAt(record.updatedAt);
    setStatus("Drafts saved locally.");
    setError("");
  }

  function handleClear() {
    clearStoredOutreachDrafts(organization.id);
    setDrafts(emptyOutreachDrafts);
    setUpdatedAt("");
    setStatus("Drafts cleared for this organization.");
    setError("");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                AI Outreach Assistant
              </CardTitle>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Generate editable outreach drafts for {organization.name}. Nothing is sent automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="warning">Drafts only</Badge>
              <Badge tone="muted">Local draft storage</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
            <SummaryItem label="Organization" value={organization.name} />
            <SummaryItem label="Country" value={organization.country} />
            <SummaryItem label="Category" value={organization.category} />
            <SummaryItem label="Opportunity" value={organization.opportunityType} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Drafts"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save Drafts
            </Button>
            <Button type="button" variant="ghost" onClick={handleClear}>
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {updatedAt ? <p className="text-xs text-muted-foreground">Last saved: {new Date(updatedAt).toLocaleString()}</p> : null}
          {status ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{status}</div> : null}
          {error ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {draftFields.map((field) => (
          <Card key={field.key}>
            <CardHeader>
              <CardTitle className="text-base">{field.label}</CardTitle>
              <p className="text-xs text-muted-foreground">{field.helper}</p>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-56 w-full rounded-md border bg-white p-3 text-sm leading-6 text-emerald-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={drafts[field.key]}
                onChange={(event) => updateDraft(field.key, event.target.value)}
                placeholder={`${field.label} draft will appear here after generation.`}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-emerald-950">{value || "Not found"}</p>
    </div>
  );
}
