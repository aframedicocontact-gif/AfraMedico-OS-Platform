import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Database, FolderOpen, RefreshCw, Search } from "lucide-react";
import {
  getCurrentOrganizationCases,
  type CaseServiceResult,
} from "../../services/caseService";
import type { CasePriority, CaseStatus, PatientCase } from "../../types/case";
import { CaseCard } from "../cases/CaseCard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

type CasesPageState = {
  loading: boolean;
  result: CaseServiceResult<PatientCase[]> | null;
};

export function CasesPage() {
  const [state, setState] = useState<CasesPageState>({
    loading: true,
    result: null,
  });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CaseStatus>("all");
  const [priority, setPriority] = useState<"all" | CasePriority>("all");
  const [stage, setStage] = useState("all");

  async function loadCases() {
    setState((current) => ({ ...current, loading: true }));
    const result = await getCurrentOrganizationCases();
    setState({ loading: false, result });
  }

  useEffect(() => {
    void loadCases();
  }, []);

  const cases = state.result?.data ?? [];
  const source = state.result?.source ?? "unavailable";
  const stages = useMemo(
    () =>
      Array.from(
        new Set(
          cases
            .map((patientCase) => patientCase.current_stage)
            .filter((item): item is string => Boolean(item)),
        ),
      ).sort(),
    [cases],
  );
  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return cases.filter((patientCase) => {
      const matchesStatus = status === "all" || patientCase.status === status;
      const matchesPriority = priority === "all" || patientCase.priority === priority;
      const matchesStage = stage === "all" || patientCase.current_stage === stage;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          patientCase.case_code,
          patientCase.treatment,
          patientCase.specialty,
          patientCase.country,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesPriority && matchesStage && matchesQuery;
    });
  }, [cases, priority, query, stage, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Platform operations</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Case Management</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage organization-scoped treatment cases. This module is live Supabase-ready and preserves mock fallback while backend access is connected.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadCases()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Connection Mode</CardTitle>
            <Badge tone={source === "live" ? "success" : source === "mock" ? "warning" : "danger"}>
              {source}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Live mode reads `public.cases`. Mock mode keeps case operations visible until tenant auth and RLS context are fully connected.
          </p>
        </CardHeader>
        {state.result?.error ? (
          <CardContent>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {state.result.error}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_180px_180px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search case code, treatment, specialty, or country"
            />
          </label>
          <Select value={status} onChange={(event) => setStatus(event.target.value as "all" | CaseStatus)}>
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="waiting_documents">Waiting Documents</option>
            <option value="waiting_quotes">Waiting Quotes</option>
            <option value="treatment_approved">Treatment Approved</option>
            <option value="travel_planned">Travel Planned</option>
            <option value="under_treatment">Under Treatment</option>
            <option value="recovery">Recovery</option>
            <option value="closed">Closed</option>
            <option value="reopened">Reopened</option>
            <option value="lost">Lost</option>
          </Select>
          <Select
            value={priority}
            onChange={(event) => setPriority(event.target.value as "all" | CasePriority)}
          >
            <option value="all">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="all">All stages</option>
            {stages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {state.loading ? (
        <StateCard
          icon={<Database className="h-5 w-5" />}
          title="Loading cases"
          description="Checking live Supabase access and fallback case data."
        />
      ) : filteredCases.length === 0 ? (
        <StateCard
          icon={<FolderOpen className="h-5 w-5" />}
          title="No cases found"
          description="Try clearing the search or changing filters."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredCases.map((patientCase) => (
            <CaseCard key={patientCase.id} patientCase={patientCase} />
          ))}
        </div>
      )}
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
